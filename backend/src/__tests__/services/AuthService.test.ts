import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { Response, Request } from 'express';
import AuthService from '../../services/AuthService';
import User, { IUser } from '../../models/User';
import ErrorResponse from '../../utils/errorResponse';
import sendEmailUtil from '../../utils/sendEmail';
import { mockUser } from '../../../factories/user.factory';

// Mock the entire sendEmailUtil module (used by forgotPassword)
vi.mock('../../utils/sendEmail', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue(true)
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSendTokenResponse: ReturnType<typeof vi.spyOn>;
  let testUser: IUser & { _id: mongoose.Types.ObjectId };

  beforeAll(() => {
    authService = new AuthService();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    vi.mocked(sendEmailUtil).mockClear();

    mockRequest = {
      protocol: 'http',
      get: vi.fn().mockReturnValue('localhost:5000') as any,
      cookies: {}
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Spy on sendTokenResponse as it's called by login and other methods
    mockSendTokenResponse = vi.spyOn(authService, 'sendTokenResponse').mockImplementation(() => {});

    testUser = await User.create(mockUser({})) as IUser & { _id: mongoose.Types.ObjectId };
  });

  afterEach(() => {
    mockSendTokenResponse.mockRestore();
  });

  describe('registerUser', () => {
    const userData = {
      name: 'Register User',
      email: 'testregister@example.com',
      password: 'password123',
      username: 'testregisteruser'
    };

    it('should register a new user as immediately active (no email verification)', async () => {
      const user = await authService.registerUser(userData);

      expect(user.email).toBe(userData.email);
      expect(user.emailVerified).toBe(true);

      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser).toBeDefined();
      expect(dbUser?.emailVerified).toBe(true);

      // No verification email is involved in registration anymore
      expect(sendEmailUtil).not.toHaveBeenCalled();
    });

    it('should throw ErrorResponse if email already exists', async () => {
      await User.create(mockUser({ name: 'Other User', username: 'otheruser', email: userData.email }));
      await expect(authService.registerUser(userData))
        .rejects.toThrow(new ErrorResponse('User with this email already exists', 400));
    });

    it('should throw ErrorResponse if username already exists', async () => {
      await User.create(mockUser({ name: 'Other User', username: userData.username, email: 'another@example.com' }));
      await expect(authService.registerUser(userData))
        .rejects.toThrow(new ErrorResponse('Username is already taken', 400));
    });

    it('should replace a leftover unverified account with the same email', async () => {
      await User.create(mockUser({ username: 'oldunverified', email: userData.email, emailVerified: false }));

      const user = await authService.registerUser(userData);
      expect(user.username).toBe(userData.username);
      expect(user.emailVerified).toBe(true);

      const count = await User.countDocuments({ email: userData.email });
      expect(count).toBe(1);
    });
  });

  describe('loginUser', () => {
    const loginCredentials = { email: 'testlogin@example.com', password: 'password123' };
    let loginUser: IUser & { _id: mongoose.Types.ObjectId };

    beforeEach(async () => {
      loginUser = await User.create(mockUser({
        name: 'Test Login User',
        email: loginCredentials.email,
        password: loginCredentials.password,
        username: 'testloginuser'
      })) as IUser & { _id: mongoose.Types.ObjectId };
    });

    it('should login a user, update streak/xp, and call sendTokenResponse', async () => {
      const initialXp = loginUser.xp;
      await authService.loginUser(loginCredentials, mockResponse as Response);

      const userAfterLogin = await User.findById(loginUser._id);
      expect(userAfterLogin?.streak.current).toBe(1);
      expect(userAfterLogin?.xp).toBe(initialXp + 1);
      expect(userAfterLogin?.activity.some(act => act.action === 'login')).toBe(true);

      expect(mockSendTokenResponse).toHaveBeenCalledTimes(1);
      expect(mockSendTokenResponse).toHaveBeenCalledWith(
        expect.objectContaining({ _id: loginUser._id }),
        200,
        mockResponse as Response
      );
    });

    it('should throw ErrorResponse for non-existent email', async () => {
      await expect(authService.loginUser({ email: 'wrong@example.com', password: 'password123' }, mockResponse as Response))
        .rejects.toThrow(new ErrorResponse('Invalid credentials (user not found)', 401));
    });

    it('should throw ErrorResponse for incorrect password', async () => {
      await expect(authService.loginUser({ ...loginCredentials, password: 'wrongpassword' }, mockResponse as Response))
        .rejects.toThrow(new ErrorResponse('Invalid credentials (password mismatch)', 401));
    });

    it('should log in and heal a legacy account stuck in unverified state', async () => {
      loginUser.emailVerified = false;
      await loginUser.save();

      await authService.loginUser(loginCredentials, mockResponse as Response);

      const healed = await User.findById(loginUser._id);
      expect(healed?.emailVerified).toBe(true);
      expect(mockSendTokenResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAuthenticatedUserProfile', () => {
    it('should return user profile data for authenticated user', async () => {
      const profile = await authService.getAuthenticatedUserProfile(testUser._id.toString());

      expect(profile._id?.toString()).toBe(testUser._id.toString());
      expect(profile.email).toBe(testUser.email);
      expect(profile.name).toBe(testUser.name);

      // Ensure sensitive fields are not returned
      expect(profile).not.toHaveProperty('password');
      expect(profile).not.toHaveProperty('resetPasswordToken');
    });

    it('should throw error if user not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(authService.getAuthenticatedUserProfile(nonExistentId.toString()))
        .rejects.toThrow();
    });
  });

  describe('logoutUser', () => {
    it('should clear cookie on logout', async () => {
      await authService.logoutUser(mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'none',
        expect.objectContaining({ httpOnly: true })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile information', async () => {
      const updateData = { name: 'Updated Name', biography: 'This is my updated bio' };

      const updatedProfile = await authService.updateUserProfile(testUser._id.toString(), updateData);

      expect(updatedProfile.name).toBe(updateData.name);
      expect(updatedProfile.biography).toBe(updateData.biography);

      const dbUser = await User.findById(testUser._id);
      expect(dbUser?.name).toBe(updateData.name);
    });

    it('should throw error when attempting to update to an email that already exists', async () => {
      await User.create(mockUser({ name: 'Another User', email: 'another@example.com', username: 'anotheruser' }));

      await expect(authService.updateUserProfile(testUser._id.toString(), { email: 'another@example.com' }))
        .rejects.toThrow(ErrorResponse);
    });

    it('should throw error when user not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(authService.updateUserProfile(nonExistentId.toString(), { name: 'Updated Name' }))
        .rejects.toThrow('User not found');
    });

    it('should update user preferences', async () => {
      const updatedProfile = await authService.updateUserProfile(testUser._id.toString(), {
        preferences: { darkMode: true, emailNotifications: false }
      });

      expect(updatedProfile.preferences?.darkMode).toBe(true);
      expect(updatedProfile.preferences?.emailNotifications).toBe(false);
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password', async () => {
      const userToUpdate = await User.create(mockUser({
        email: 'update-password@example.com',
        username: 'updatepassuser',
        password: 'password123'
      }));

      await authService.updateUserPassword(userToUpdate._id.toString(), 'password123', 'newpassword456');

      const updatedUser = await User.findById(userToUpdate._id).select('+password');
      const isMatch = await updatedUser?.matchPassword('newpassword456');
      expect(isMatch).toBe(true);
    });

    it('should throw error if current password is incorrect', async () => {
      await expect(
        authService.updateUserPassword(testUser._id.toString(), 'wrongpassword', 'newpassword456')
      ).rejects.toThrow('Incorrect current password');
    });

    it('should throw error if user not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        authService.updateUserPassword(nonExistentId, 'password123', 'newpassword456')
      ).rejects.toThrow('User not found');
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token and send email', async () => {
      const result = await authService.forgotPassword(testUser.email, mockRequest as Request);

      expect(result).toContain('If an account with that email exists');

      const user = await User.findOne({ email: testUser.email });
      expect(user?.resetPasswordToken).toBeDefined();
      expect(user?.resetPasswordExpire).toBeDefined();
      expect(sendEmailUtil).toHaveBeenCalledTimes(1);
    });

    it('should not throw error if user not found', async () => {
      const result = await authService.forgotPassword('nonexistent@example.com', mockRequest as Request);
      expect(result).toContain('If an account with that email exists');
      expect(sendEmailUtil).not.toHaveBeenCalled();
    });

    it('should handle email sending error', async () => {
      vi.mocked(sendEmailUtil).mockRejectedValueOnce(new Error('Email sending failed'));

      await expect(
        authService.forgotPassword(testUser.email, mockRequest as Request)
      ).rejects.toThrow('Email could not be sent');

      // Verify reset token was cleared
      const user = await User.findOne({ email: testUser.email });
      expect(user?.resetPasswordToken).toBeUndefined();
      expect(user?.resetPasswordExpire).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset user password with valid token', async () => {
      const user = await User.findById(testUser._id);
      const resetToken = user!.getResetPasswordToken();
      await user!.save({ validateBeforeSave: false });

      const result = await authService.resetPassword(resetToken, 'newpassword456');

      expect(result._id?.toString()).toBe(testUser._id.toString());

      const updatedUser = await User.findById(testUser._id).select('+password');
      const isMatch = await updatedUser!.matchPassword('newpassword456');
      expect(isMatch).toBe(true);

      expect(updatedUser?.resetPasswordToken).toBeUndefined();
      expect(updatedUser?.resetPasswordExpire).toBeUndefined();
    });

    it('should throw error for invalid token', async () => {
      await expect(
        authService.resetPassword('invalidtoken123', 'newpassword')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for expired token', async () => {
      const user = await User.findById(testUser._id);
      const resetToken = user!.getResetPasswordToken();
      user!.resetPasswordExpire = new Date(Date.now() - 10 * 60 * 1000);
      await user!.save({ validateBeforeSave: false });

      await expect(
        authService.resetPassword(resetToken, 'newpassword')
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });
});
