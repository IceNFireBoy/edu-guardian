import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../models/User';
import Note from '../../models/Note';
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
        .get('/api/v1/users/feed?type=study,earn_badge')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // No study/badge activity yet - the filter should simply return an empty list
      expect(res.body.data.activities).toEqual([]);
    });
  });

  describe('POST /api/v1/users/study-complete', () => {
    let token: string;
    let noteId: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(credentials);
      token = res.body.token;
      const note = await Note.create({
        title: 'Logarithmic Functions',
        fileUrl: 'https://example.com/note.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        subject: 'General Mathematics',
        grade: '12',
        semester: '1',
        quarter: '2',
        topic: 'Logarithms',
        user: res.body.user._id ?? res.body.user.id
      });
      noteId = note._id.toString();
    });

    it('records the studied note, awards XP, and updates the streak', async () => {
      const res = await request(app)
        .post('/api/v1/users/study-complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ noteId, duration: 300 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studiedNote).toMatchObject({
        noteId,
        timesStudied: 1,
        totalSeconds: 300
      });
      expect(res.body.data.xpEarned).toBeGreaterThan(0);
      expect(res.body.data.user.streak.current).toBeGreaterThanOrEqual(1);

      // The profile now carries the studied record for the notes grid
      const me = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(me.body.data.studiedNotes).toHaveLength(1);
      expect(me.body.data.studiedNotes[0].note.toString()).toBe(noteId);
    });

    it('accumulates time and count on repeat sessions for the same note', async () => {
      await request(app)
        .post('/api/v1/users/study-complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ noteId, duration: 300 });
      const res = await request(app)
        .post('/api/v1/users/study-complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ noteId, duration: 200 });

      expect(res.status).toBe(200);
      expect(res.body.data.studiedNote).toMatchObject({
        timesStudied: 2,
        totalSeconds: 500
      });
    });

    it('rejects an unknown note id with 404 and a missing duration with 400', async () => {
      const missing = await request(app)
        .post('/api/v1/users/study-complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ noteId: '64b5f9d2f1a2c34d56789012', duration: 60 });
      expect(missing.status).toBe(404);

      const badDuration = await request(app)
        .post('/api/v1/users/study-complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ noteId });
      expect(badDuration.status).toBe(400);
    });
  });

  describe('POST /api/v1/notes', () => {
    let token: string;
    const validNote = {
      title: 'Stats Reviewer',
      subject: 'General Mathematics',
      grade: '12',
      semester: '1',
      quarter: '4',
      topic: 'Statistics',
      fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/reviewer.pdf',
      fileType: 'pdf',
      fileSize: 12345,
      description: 'Full intercession reviewer',
      tags: ['Ateneo', 'Statistics'],
      isPublic: true
    };

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(credentials);
      token = res.body.token;
    });

    it('creates a note with canonical enum values', async () => {
      const res = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(validNote);

      expect(res.status).toBe(201);
      expect(res.body.data.grade).toBe('12');
      expect(res.body.data.quarter).toBe('4');
    });

    it('rejects label-style values and NAMES the offending fields', async () => {
      // Regression: the upload form used to send option labels as values
      const res = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validNote, grade: 'Grade 12', semester: 'Semester 1', quarter: 'Quarter 4' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('grade:');
      expect(res.body.error).toContain('semester:');
      expect(res.body.error).toContain('quarter:');
    });
  });

  describe('GET /api/v1/test', () => {
    it('responds to the health check used by the frontend', async () => {
      const res = await request(app).get('/api/v1/test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.database).toBe('connected');
    });
  });
});
