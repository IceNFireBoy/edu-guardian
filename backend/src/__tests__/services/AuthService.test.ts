import mongoose from 'mongoose';
import { Response } from 'express';
import AuthService from '../../services/AuthService';
import User, { IUser } from '../../models/User';
import Badge from '../../models/Badge';
import ErrorResponse from '../../utils/errorResponse';
import sendEmailUtil from '../../utils/sendEmail'; // Auto-mocked by Jest
import { Request } from 'express'; // For mocking req/res
import { mockUser } from '../../../factories/user.factory';

// Mock the entire sendEmailUtil module
jest.mock('../../utils/sendEmail', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSendTokenResponse: ReturnType<typeof jest.spyOn>;
  let testUser: IUser & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    authService = new AuthService();
    // Register Badge model if not already registered
    if (!mongoose.models.Badge) {
      mongoose.model('Badge', Badge.schema);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
    (sendEmailUtil as any)?.mockClear?.(); // Clear mock usage for each test

    mockRequest = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000') as any,
      cookies: {}, // Added to satisfy Request type
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    // Spy on sendTokenResponse as it's called by login and other methods
    // and we want to verify its call without re-testing its internal logic here.
    mockSendTokenResponse = jest.spyOn(authService, 'sendTokenResponse').mockImplementation(() => {});

    // Create a test user with all required fields
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      emailVerified: true,
      streak: {
        current: 0,
        max: 0,
        lastUsed: new Date()
      },
      subjects: [{
        name: 'Math',
        level: 'Beginner',
        topics: ['Algebra']
      }]
    }) as IUser & { _id: mongoose.Types.ObjectId };
  });

  afterEach(() => {
    mockSendTokenResponse.mockRestore(); // Restore original implementation
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
  });

  describe('registerUser', () => {
      const userData = {
      name: 'Test User',
      email: 'testregister@example.com',
        password: 'password123',
      username: 'testregisteruser',
    };

    it('should register a new user, save verification token, and send verification email', async () => {
      const resultMessage = await authService.registerUser(userData, mockRequest as Request);
      expect(resultMessage).toBe('Registration successful. Please check your email to verify your account.');

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user?.name).toBe(userData.name);
      expect(user?.emailVerified).toBe(false);
      expect(user?.emailVerificationToken).toBeDefined();
      expect(user?.emailVerificationTokenExpire).toBeDefined();

      expect(sendEmailUtil).toHaveBeenCalledTimes(1);
      expect(sendEmailUtil).toHaveBeenCalledWith(expect.objectContaining({
        email: userData.email,
        subject: 'Email Verification',
        message: expect.stringContaining('/api/v1/auth/verify-email/'),
      }));
    });

    it('should throw ErrorResponse if email already exists', async () => {
      await User.create({ ...mockUser, name: "Other User", username: "otheruser", email: userData.email });
      await expect(authService.registerUser(userData, mockRequest as Request))
        .rejects.toThrow(new ErrorResponse('User with this email already exists', 400));
    });

    it('should throw ErrorResponse if username already exists', async () => {
      await User.create({ ...mockUser, name: "Other User", username: userData.username, email: 'another@example.com' });
      await expect(authService.registerUser(userData, mockRequest as Request))
        .rejects.toThrow(new ErrorResponse('Username is already taken', 400));
    });

    it('should throw ErrorResponse and cleanup token if email sending fails', async () => {
      (sendEmailUtil as any).mockRejectedValueOnce(new Error('SMTP Error'));
      
      await expect(authService.registerUser(userData, mockRequest as Request))
        .rejects.toThrow(new ErrorResponse('Email could not be sent. Please try registering again or contact support if the issue persists.', 500));
      
      const user = await User.findOne({ email: userData.email });
      expect(user?.emailVerificationToken).toBeUndefined();
      expect(user?.emailVerificationTokenExpire).toBeUndefined();
    });
  });

  describe('loginUser', () => {
    const loginCredentials = { email: 'testlogin@example.com', password: 'password123' };
    let testUser: IUser;

    beforeEach(async () => {
      // Create a verified user for login tests with all required fields
      testUser = await User.create({
        name: 'Test Login User',
        email: loginCredentials.email,
        password: loginCredentials.password,
        username: 'testloginuser',
        emailVerified: true,
        streak: {
          current: 0,
          longest: 0,
          lastLogin: new Date()
        },
        xp: 0,
        level: 1,
        subjects: [{
          name: 'Math',
          level: 'Beginner',
          topics: ['Algebra']
        }]
      }) as IUser & { _id: mongoose.Types.ObjectId };
    });

    it('should login a verified user, update streak/xp, and call sendTokenResponse', async () => {
      const initialXp = testUser.xp;
      await authService.loginUser(loginCredentials, mockResponse as Response);

      const userAfterLogin = await User.findById(testUser._id);
      expect(userAfterLogin).toBeDefined();
      expect(userAfterLogin?.streak.current).toBe(1);
      expect(userAfterLogin?.xp).toBe(initialXp + 1);
      expect(userAfterLogin?.activity.some(act => act.action === 'login')).toBe(true);

      expect(mockSendTokenResponse).toHaveBeenCalledTimes(1);
      expect(mockSendTokenResponse).toHaveBeenCalledWith(expect.objectContaining({ _id: testUser._id }), 200, mockResponse as Response);
    });

    it('should throw ErrorResponse for non-existent email', async () => {
      await expect(authService.loginUser({ email: 'wrong@example.com', password: 'password123' }, mockResponse as Response))
        .rejects.toThrow(new ErrorResponse('Invalid credentials (user not found)', 401));
    });

    it('should throw ErrorResponse for incorrect password', async () => {
      await expect(authService.loginUser({ ...loginCredentials, password: 'wrongpassword' }, mockResponse as Response))
        .rejects.toThrow(new ErrorResponse('Invalid credentials (password mismatch)', 401));
    });

    it('should throw ErrorResponse if email is not verified', async () => {
      testUser.emailVerified = false;
      await testUser.save();
      await expect(authService.loginUser(loginCredentials, mockResponse as Response))
        .rejects.toThrow(new ErrorResponse('Please verify your email address to login. You can request a new verification link if needed.', 403));
    });
  });

  describe('getAuthenticatedUserProfile', () => {
    it('should return user profile data for authenticated user', async () => {
      const profile = await authService.getAuthenticatedUserProfile(testUser._id.toString());

      expect(profile).toBeDefined();
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
        .rejects.toThrow(ErrorResponse);
    });
  });

  describe('logoutUser', () => {
    it('should clear cookie on logout', async () => {
      await authService.logoutUser(mockResponse as Response);
      
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'none',
        expect.objectContaining({
          httpOnly: true
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile information', async () => {
      const updateData = {
        name: 'Updated Name',
        biography: 'This is my updated bio'
      };

      const updatedProfile = await authService.updateUserProfile(
        testUser._id.toString(),
        updateData
      );

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.name).toBe(updateData.name);
      expect(updatedProfile.biography).toBe(updateData.biography);

      // Verify changes are persisted in database
      const dbUser = await User.findById(testUser._id);
      expect(dbUser?.name).toBe(updateData.name);
    });

    it('should throw error when attempting to update to an email that already exists', async () => {
      // Create another user
      await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
        username: 'anotheruser'
      });

      // Try to update to the existing email
      const updateData = {
        email: 'another@example.com'
      };

      await expect(authService.updateUserProfile(testUser._id.toString(), updateData))
        .rejects.toThrow(ErrorResponse);
    });

    it('should throw error when user not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Name'
      };

      await expect(authService.updateUserProfile(nonExistentId.toString(), updateData))
        .rejects.toThrow('User not found');
    });

    it('should update user preferences', async () => {
      const updateData = {
        preferences: {
          darkMode: true,
          emailNotifications: false
        }
      };

      const updatedProfile = await authService.updateUserProfile(
        testUser._id.toString(),
        updateData
      );

      expect(updatedProfile.preferences?.darkMode).toBe(true);
      expect(updatedProfile.preferences?.emailNotifications).toBe(false);
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password', async () => {
      const userId = testUser._id.toString();
      const currentPassword = 'password123';
      const newPassword = 'newpassword456';

      const user = await authService.updateUserPassword(
        userId,
        currentPassword,
        newPassword
      );

      // Check that user is returned
      expect(user).toBeDefined();
      
      // Verify password was updated
      const updatedUser = await User.findById(userId).select('+password');
      const isMatch = await updatedUser!.matchPassword(newPassword);
      expect(isMatch).toBe(true);
    });

    it('should throw error if current password is incorrect', async () => {
      const userId = testUser._id.toString();
      const wrongCurrentPassword = 'wrongpassword';
      const newPassword = 'newpassword456';

      await expect(
        authService.updateUserPassword(userId, wrongCurrentPassword, newPassword)
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
      const email = testUser.email;
      
      const result = await authService.forgotPassword(email, mockRequest as Request);
      
      // Check response
      expect(result).toContain('If an account with that email exists');
      
      // Verify user has reset token
      const user = await User.findOne({ email });
      expect(user?.resetPasswordToken).toBeDefined();
      expect(user?.resetPasswordExpire).toBeDefined();
    });

    it('should not throw error if user not found', async () => {
      const nonExistentEmail = 'nonexistent@example.com';
      
      // This should not throw an error for security reasons
      const result = await authService.forgotPassword(nonExistentEmail, mockRequest as Request);
      expect(result).toContain('If an account with that email exists');
    });

    it('should handle email sending error', async () => {
      // Mock email failure
      const sendEmailMock = require('../../utils/sendEmail');
      sendEmailMock.mockImplementationOnce(() => {
        throw new Error('Email sending failed');
      });

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
      // First generate a reset token
      const user = await User.findById(testUser._id);
      const resetToken = user!.getResetPasswordToken();
      await user!.save({ validateBeforeSave: false });
      
      // Now reset the password using that token
      const result = await authService.resetPassword(resetToken, 'newpassword456');
      
      // Verify user returned
      expect(result).toBeDefined();
      expect(result._id?.toString()).toBe(testUser._id.toString());
      
      // Verify password was changed
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isMatch = await updatedUser!.matchPassword('newpassword456');
      expect(isMatch).toBe(true);
      
      // Verify token was cleared
      expect(updatedUser?.resetPasswordToken).toBeUndefined();
      expect(updatedUser?.resetPasswordExpire).toBeUndefined();
    });

    it('should throw error for invalid token', async () => {
      await expect(
        authService.resetPassword('invalidtoken123', 'newpassword')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for expired token', async () => {
      // Generate token but set expiration to the past
      const user = await User.findById(testUser._id);
      const resetToken = user!.getResetPasswordToken();
      user!.resetPasswordExpire = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes in the past
      await user!.save({ validateBeforeSave: false });
      
      await expect(
        authService.resetPassword(resetToken, 'newpassword')
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify user email with valid token', async () => {
      // First generate a verification token
      const user = await User.findById(testUser._id);
      user!.emailVerified = false; // Reset verification status
      const verificationToken = user!.getEmailVerificationToken();
      await user!.save({ validateBeforeSave: false });
      
      // Now verify the email using that token
      const result = await authService.verifyUserEmail(verificationToken);
      
      // Verify user returned and is now verified
      expect(result).toBeDefined();
      expect(result.emailVerified).toBe(true);
      
      // Verify token was cleared
      expect(result.emailVerificationToken).toBeUndefined();
      expect(result.emailVerificationTokenExpire).toBeUndefined();
    });

    it('should throw error for invalid token', async () => {
      await expect(
        authService.verifyUserEmail('invalidtoken123')
      ).rejects.toThrow('Invalid or expired email verification token');
    });

    it('should throw error for expired token', async () => {
      // Generate token but set expiration to the past
      const user = await User.findById(testUser._id);
      user!.emailVerified = false;
      const verificationToken = user!.getEmailVerificationToken();
      user!.emailVerificationTokenExpire = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours in the past
      await user!.save({ validateBeforeSave: false });
      
      await expect(
        authService.verifyUserEmail(verificationToken)
      ).rejects.toThrow('Invalid or expired email verification token');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email to unverified user', async () => {
      // Create an unverified user
      const unverifiedUser = await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        username: 'unverified',
        emailVerified: false
      }) as IUser & { _id: mongoose.Types.ObjectId };
      
      const result = await authService.resendVerificationEmail(
        unverifiedUser.email,
        mockRequest as Request
      );
      
      // Check response
      expect(result).toContain('If your email is registered and not yet verified');
      
      // Verify user has verification token
      const user = await User.findOne({ email: unverifiedUser.email });
      expect(user?.emailVerificationToken).toBeDefined();
      expect(user?.emailVerificationTokenExpire).toBeDefined();
    });

    it('should throw error if user is already verified', async () => {
      await expect(
        authService.resendVerificationEmail(testUser.email, mockRequest as Request)
      ).rejects.toThrow('This email is already verified');
    });

    it('should not throw error if user not found', async () => {
      // For security reasons, this should not reveal if user exists
      const result = await authService.resendVerificationEmail('nonexistent@example.com', mockRequest as Request);
      expect(result).toContain('If your email is registered and not yet verified');
    });

    it('should handle email sending error', async () => {
      // Create an unverified user
      const unverifiedUser = await User.create({
        name: 'Email Fail User',
        email: 'emailfail@example.com',
        password: 'password123',
        username: 'emailfailuser',
        emailVerified: false
      });
      
      // Mock email failure
      const sendEmailMock = require('../../utils/sendEmail');
      sendEmailMock.mockImplementationOnce(() => {
        throw new Error('Email sending failed');
      });

      await expect(
        authService.resendVerificationEmail(unverifiedUser.email, mockRequest as Request)
      ).rejects.toThrow('Email could not be sent');
    });
  });
}); 