import request from 'supertest';
import express, { Express } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../../models/User';
import Note, { INote } from '../../models/Note';
import authRoutes from '../../routes/authRoutes';
import noteRoutes from '../../routes/noteRoutes'; // Import note routes
import errorHandler from '../../middleware/errorHandler';
import { mockUser } from '../factories/user.factory';
import { mockNote } from '../factories/note.factory';

// Mock external dependencies if necessary (e.g., OpenAI, Cloudinary for AI routes)
jest.mock('../../utils/sendEmail'); // Already mocked for auth tests
jest.mock('../../services/OpenAIService'); // Assuming an OpenAIService for AI features
jest.mock('../../services/CloudinaryService'); // Assuming a CloudinaryService for file uploads

let app: Express;
let testUser: IUser;
let authToken: string;
let createdNote: INote;

const setupApp = () => {
  const tempApp = express();
  tempApp.use(express.json());
  tempApp.use('/api/v1/auth', authRoutes);
  tempApp.use('/api/v1/notes', noteRoutes); // Mount note routes
  tempApp.use(errorHandler);
  return tempApp;
};

beforeAll(async () => {
  app = setupApp();
  await User.deleteMany({});
  await Note.deleteMany({});

  // Create and login a test user to get a token for protected routes
  const userCredentials = { name: 'Note Tester', email: 'notetester@example.com', username: 'notetester', password: 'password123' };
  await request(app).post('/api/v1/auth/register').send(userCredentials); // Register
  const userToVerify = await User.findOne({ email: userCredentials.email });
  userToVerify!.emailVerified = true; // Manually verify for tests
  userToVerify!.emailVerificationToken = undefined;
  await userToVerify!.save();

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email: userCredentials.email, password: userCredentials.password });
  authToken = loginRes.body.token;
  testUser = loginRes.body.user; // This will be the simplified user object from token response
  // For full user object with methods, you might need to fetch again or use the one from DB
  testUser = (await User.findById(loginRes.body.user._id))!;
});

afterAll(async () => {
  await User.deleteMany({});
  await Note.deleteMany({});
  await mongoose.disconnect();
});

describe('Note Routes', () => {
  describe('Public GET Routes', () => {
    let publicNote1: INote, publicNote2: INote;

    beforeAll(async () => {
      // Create some public notes for testing GET routes
      publicNote1 = await Note.create(mockNote({ user: testUser._id, title: 'Public Note 1', subject: 'Math', isPublic: true, averageRating: 4.5 }));
      publicNote2 = await Note.create(mockNote({ user: testUser._id, title: 'Public Note 2', subject: 'Science', isPublic: true, averageRating: 3.0 }));
      // Create a private note to ensure it's not fetched by public routes
      await Note.create(mockNote({ user: testUser._id, title: 'Private Note', subject: 'History', isPublic: false }));
    });

    it('GET /api/v1/notes - should get all public notes with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2); // Only public notes
      expect(response.body.count).toBe(2);
    });

    it('GET /api/v1/notes?subject=Math - should filter notes by subject', async () => {
        const response = await request(app)
          .get('/api/v1/notes?subject=Math')
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe('Public Note 1');
      });

    it('GET /api/v1/notes/:id - should get a single public note by ID and increment view count', async () => {
      const initialViewCount = publicNote1.viewCount;
      const response = await request(app)
        .get(`/api/v1/notes/${publicNote1._id}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(publicNote1.title);

      const noteAfter = await Note.findById(publicNote1._id);
      expect(noteAfter?.viewCount).toBe(initialViewCount + 1);
    });

    it('GET /api/v1/notes/search?term=Public - should search public notes', async () => {
        const response = await request(app)
          .get('/api/v1/notes/search?term=Public')
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(2);
      });
    
    it('GET /api/v1/notes/top-rated - should get top rated public notes', async () => {
        const response = await request(app)
            .get('/api/v1/notes/top-rated')
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].title).toBe('Public Note 1'); // Higher rating
    });

    // Add more tests for other public GET routes like /user/:userId, /subject/:subjectName
  });

  describe('Protected POST /api/v1/notes', () => {
    const noteData = {
      title: 'My Test Note',
      subject: 'Testing',
      grade: '11' as const,
      semester: '1' as const,
      quarter: '2' as const,
      topic: 'Integration Tests',
      fileUrl: 'http://example.com/test.pdf',
      fileType: 'pdf',
      fileSize: 12345,
      description: 'This is a note created via API test.',
      tags: ['test', 'api'],
      isPublic: true
    };

    it('should create a new note when authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(noteData.title);
      expect(response.body.data.user).toBe(testUser._id.toString());
      createdNote = response.body.data; // Save for later tests (update, delete)
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/v1/notes')
        .send(noteData)
        .expect(401);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { ...noteData, title: '' };
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('Protected PUT /api/v1/notes/:id', () => {
    it('should update an existing note when authenticated as owner', async () => {
      const updateData = { title: 'Updated Test Note Title', description: 'Updated description.' };
      const response = await request(app)
        .put(`/api/v1/notes/${createdNote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should return 401 if trying to update another user\'s note (or if not authenticated)', async () => {
      // Create another user and their note
      const otherUserCredentials = { name: 'OtherUser', email: 'other@example.com', username: 'otheruser', password: 'password123' };
      await request(app).post('/api/v1/auth/register').send(otherUserCredentials);
      const otherUserVerified = await User.findOne({ email: otherUserCredentials.email });
      otherUserVerified!.emailVerified = true; await otherUserVerified!.save();
      const otherLoginRes = await request(app).post('/api/v1/auth/login').send({ email: otherUserCredentials.email, password: otherUserCredentials.password });
      const otherAuthToken = otherLoginRes.body.token;
      
      const otherUsersNote = await Note.create(mockNote({ user: otherLoginRes.body.user._id, title: 'Other User\'s Note'}));

      // Try to update otherUsersNote with testUser's token
      await request(app)
        .put(`/api/v1/notes/${otherUsersNote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Malicious Update' })
        .expect(401); // Or 403/404 depending on service logic for non-owner
    });
  });

  describe('Protected DELETE /api/v1/notes/:id', () => {
    it('should delete an existing note when authenticated as owner', async () => {
      await request(app)
        .delete(`/api/v1/notes/${createdNote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const note = await Note.findById(createdNote._id);
      expect(note).toBeNull();
    });

    // Add tests for trying to delete non-existent note, or another user's note
  });

  // TODO: Add tests for POST /:id/ratings
  // TODO: Add tests for PUT /:id/download
  // TODO: Add tests for POST /:id/flashcards (manual creation)
  // TODO: Add tests for POST /:id/summarize (AI)
  // TODO: Add tests for POST /:id/generate-flashcards (AI)
  // TODO: Add tests for POST /:id/save-ai-flashcards (AI)
  // TODO: Add tests for GET /my-notes
  // TODO: Add tests for POST /upload (might need to mock multer or file handling service)
}); 