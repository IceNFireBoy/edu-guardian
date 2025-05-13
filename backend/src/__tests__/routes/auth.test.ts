import request from 'supertest';
import express, { Express } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../../models/User';
import authRoutes from '../../routes/authRoutes';
import errorHandler from '../../middleware/errorHandler'; // Import your global error handler
import { mockUser } from '../factories/user.factory';
import sendEmailUtil from '../../utils/sendEmail'; // Will be auto-mocked

// Mock the sendEmailUtil
jest.mock('../../utils/sendEmail');

let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json()); // Middleware to parse JSON bodies
  app.use('/api/v1/auth', authRoutes); // Mount auth routes
  app.use(errorHandler); // Add global error handler
});

afterEach(async () => {
  await User.deleteMany({});
  (sendEmailUtil as jest.Mock).mockClear();
});

afterAll(async () => {
  await mongoose.disconnect();
  // await mongoServer.stop(); // If you were using mongodb-memory-server directly here
});

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/register', () => {
    const validUserData = {
      name: 'Test User',
      email: 'register@example.com',
      username: 'testregister',
      password: 'password123',
    };

    it('should register a new user successfully and send verification email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Registration successful. Please check your email to verify your account.');
      
      const user = await User.findOne({ email: validUserData.email });
      expect(user).not.toBeNull();
      expect(user?.emailVerified).toBe(false);
      expect(user?.emailVerificationToken).toBeDefined();
      expect(sendEmailUtil).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' }) // Missing name, username, password
        .expect(400);
      expect(response.body.success).toBe(false);
      // Based on AuthController, it joins messages. Update if error format is different.
      expect(response.body.error).toContain('Name is required'); 
      expect(response.body.error).toContain('Username is required'); 
      expect(response.body.error).toContain('Password must be 6 or more characters');
    });

    it('should return 400 if email is invalid', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({ ...validUserData, email: 'invalid-email' })
          .expect(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Please include a valid email');
      });

    it('should return 400 if password is too short', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({ ...validUserData, password: '123' })
          .expect(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Password must be 6 or more characters');
      });

    it('should return 400 if email already exists', async () => {
      await User.create(mockUser({ email: validUserData.email }));
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should return 400 if username already exists', async () => {
        await User.create(mockUser({ username: validUserData.username, email: 'another@example.com' }));
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(validUserData)
          .expect(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Username is already taken');
      });
  });

  describe('POST /api/v1/auth/login', () => {
    const loginCredentials = { email: 'login@example.com', password: 'password123' };
    let verifiedUser: IUser;

    beforeEach(async () => {
      verifiedUser = await User.create(mockUser({
        ...loginCredentials,
        emailVerified: true,
      }));
    });

    it('should login a verified user and return a token and user data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(verifiedUser._id.toString());
      expect(response.body.user.email).toBe(verifiedUser.email);
      expect(response.headers['set-cookie']).toBeDefined(); // Check for cookie
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'password123' })
        .expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials (user not found)');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ ...loginCredentials, password: 'wrongpassword' })
        .expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials (password mismatch)');
    });

    it('should return 403 if email is not verified', async () => {
      await User.updateOne({ _id: verifiedUser._id }, { emailVerified: false });
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Please verify your email address to login. You can request a new verification link if needed.');
    });

    it('should return 400 for missing email or password', async () => {
        const resMissingEmail = await request(app)
          .post('/api/v1/auth/login')
          .send({ password: 'password123' })
          .expect(400);
        expect(resMissingEmail.body.success).toBe(false);
        expect(resMissingEmail.body.error).toContain('Please include a valid email');

        const resMissingPassword = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: loginCredentials.email })
          .expect(400);
        expect(resMissingPassword.body.success).toBe(false);
        expect(resMissingPassword.body.error).toContain('Password is required');
      });
  });

  // TODO: Add tests for /logout
  // TODO: Add tests for /me (GET and PUT), /updatepassword (requires handling JWT for protected routes)
  // TODO: Add tests for /verify-email, /resend-verification
  // TODO: Add tests for /forgotpassword, /resetpassword
}); 