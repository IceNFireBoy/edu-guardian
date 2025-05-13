import request from 'supertest';
import mongoose from 'mongoose';
import User from '../../models/User';
import Note from '../../models/Note';
import app from '../../server';

describe('Note Routes', () => {
  let token: string;
  let testUser: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/eduguardian_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});

    testUser = await User.create({
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

    token = testUser.getSignedJwtToken();
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note',
        isPublic: true
      };

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(noteData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(noteData.title);
      expect(res.body.data.content).toBe(noteData.content);
      expect(res.body.data.isPublic).toBe(noteData.isPublic);
    });

    it('should not create note without authentication', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note',
        isPublic: true
      };

      const res = await request(app)
        .post('/api/notes')
        .send(noteData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/notes', () => {
    beforeEach(async () => {
      await Note.create([
        {
          title: 'Public Note 1',
          content: 'This is a public note',
          isPublic: true,
          user: testUser._id
        },
        {
          title: 'Public Note 2',
          content: 'This is another public note',
          isPublic: true,
          user: testUser._id
        },
        {
          title: 'Private Note',
          content: 'This is a private note',
          isPublic: false,
          user: testUser._id
        }
      ]);
    });

    it('should get all public notes', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].isPublic).toBe(true);
      expect(res.body.data[1].isPublic).toBe(true);
    });

    it('should get user\'s private notes when authenticated', async () => {
      const res = await request(app)
        .get('/api/notes?isPublic=false')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isPublic).toBe(false);
    });
  });

  describe('GET /api/notes/:id', () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        title: 'Test Note',
        content: 'This is a test note',
        isPublic: true,
        user: testUser._id
      });
    });

    it('should get a note by id', async () => {
      const res = await request(app)
        .get(`/api/notes/${testNote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testNote.title);
      expect(res.body.data.content).toBe(testNote.content);
    });

    it('should not get a non-existent note', async () => {
      const res = await request(app)
        .get(`/api/notes/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/notes/:id', () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        title: 'Test Note',
        content: 'This is a test note',
        isPublic: true,
        user: testUser._id
      });
    });

    it('should update a note', async () => {
      const updateData = {
        title: 'Updated Note',
        content: 'This is an updated note'
      };

      const res = await request(app)
        .put(`/api/notes/${testNote._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.content).toBe(updateData.content);
    });

    it('should not update a note without authentication', async () => {
      const updateData = {
        title: 'Updated Note',
        content: 'This is an updated note'
      };

      const res = await request(app)
        .put(`/api/notes/${testNote._id}`)
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        title: 'Test Note',
        content: 'This is a test note',
        isPublic: true,
        user: testUser._id
      });
    });

    it('should delete a note', async () => {
      const res = await request(app)
        .delete(`/api/notes/${testNote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedNote = await Note.findById(testNote._id);
      expect(deletedNote).toBeNull();
    });

    it('should not delete a note without authentication', async () => {
      const res = await request(app)
        .delete(`/api/notes/${testNote._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
}); 