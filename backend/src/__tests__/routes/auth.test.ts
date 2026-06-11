import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../models/User';
import app from '../../server';

// End-to-end smoke of the auth flow against the in-memory MongoDB from
// setupVitest.ts: register -> token -> login -> /auth/me -> /users/feed.
describe('Auth Routes', () => {
  const credentials = {
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return a token (no email verification step)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(credentials);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(credentials.email);
      expect(res.body.user.password).toBeUndefined();

      const dbUser = await User.findOne({ email: credentials.email });
      expect(dbUser?.emailVerified).toBe(true);
    });

    it('should generate a username when none is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'No Username', email: 'nouser@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.user.username).toBeTruthy();
    });

    it('should not register user with existing email', async () => {
      await request(app).post('/api/v1/auth/register').send(credentials);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...credentials, username: 'different' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(credentials);
    });

    it('should login user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(credentials.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should login a legacy account stuck in unverified state', async () => {
      await User.updateOne({ email: credentials.email }, { emailVerified: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should not login user with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('authenticated session', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(credentials);
      token = res.body.token;
    });

    it('GET /api/v1/auth/me should return the current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(credentials.email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('GET /api/v1/auth/me should reject without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/users/feed should return the activity feed shape the dashboard expects', async () => {
      // Log in once so the feed has at least one activity entry
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password });

      const res = await request(app)
        .get('/api/v1/users/feed?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
      expect(res.body.data.activities.length).toBeGreaterThan(0);
      expect(res.body.data.activities[0]).toMatchObject({
        action: expect.any(String),
        description: expect.any(String)
      });
      expect(res.body.data.currentPage).toBe(1);
      expect(res.body.data.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/users/feed should filter by a comma-separated type list', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password });

      const res = await request(app)
        .get('/api/v1/users/feed?type=ai_summary_generated,ai_flashcards_generated')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // No AI activity yet - the filter should simply return an empty list
      expect(res.body.data.activities).toEqual([]);
    });
  });

  describe('GET /api/v1/test', () => {
    it('responds to the health check used by the frontend', async () => {
      const res = await request(app).get('/api/v1/test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
