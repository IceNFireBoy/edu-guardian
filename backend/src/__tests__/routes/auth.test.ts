import request from 'supertest';
import mongoose from 'mongoose';
import User from '../../models/User';
import app from '../../server';

describe('Auth Routes', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/eduguardian_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.password).toBeUndefined();
    });

    it('should not register user with existing email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        xp: 0,
        level: 1,
        badges: [],
        activity: [],
        favoriteNotes: [],
        aiUsage: {
          current: 0,
          max: 10,
          lastUsed: new Date()
        },
        streak: {
          current: 0,
          max: 0,
          lastUsed: new Date()
        },
        totalSummariesGenerated: 0,
        totalFlashcardsGenerated: 0
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        xp: 0,
        level: 1,
        badges: [],
        activity: [],
        favoriteNotes: [],
        aiUsage: {
          current: 0,
          max: 10,
          lastUsed: new Date()
        },
        streak: {
          current: 0,
          max: 0,
          lastUsed: new Date()
        },
        totalSummariesGenerated: 0,
        totalFlashcardsGenerated: 0
      });
    });

    it('should login user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.password).toBeUndefined();
    });

    it('should not login user with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        xp: 0,
        level: 1,
        badges: [],
        activity: [],
        favoriteNotes: [],
        aiUsage: {
          current: 0,
          max: 10,
          lastUsed: new Date()
        },
        streak: {
          current: 0,
          max: 0,
          lastUsed: new Date()
        },
        totalSummariesGenerated: 0,
        totalFlashcardsGenerated: 0
      });

      token = user.getSignedJwtToken();
    });

    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
}); 