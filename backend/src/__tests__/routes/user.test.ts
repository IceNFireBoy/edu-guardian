import request from 'supertest';
import express, { Express } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../../models/User';
import Note, { INote } from '../../models/Note'; // For favorite notes tests
import Badge from '../../models/Badge'; // For badge tests
import authRoutes from '../../routes/authRoutes';
import userRoutes from '../../routes/userRoutes'; // Import user routes
import errorHandler from '../../middleware/errorHandler';
import { mockUser, mockUserActivity } from '../factories/user.factory';
import { mockNote } from '../factories/note.factory';
import { mockBadge } from '../factories/badge.factory';

// Mock external dependencies
vi.mock('../../utils/sendEmail');

let app: Express;
let regularUser: IUser;
let regularUserToken: string;
let adminUser: IUser;
let adminToken: string;

const setupApp = () => {
  const tempApp = express();
  tempApp.use(express.json());
  tempApp.use('/api/v1/auth', authRoutes);
  tempApp.use('/api/v1/users', userRoutes); // Mount user routes
  tempApp.use(errorHandler);
  return tempApp;
};

async function createUserAndLogin(userData: Partial<IUser>, makeAdmin = false): Promise<{ user: IUser, token: string }> {
    // Ensure unique email/username for each created user
    const uniqueSuffix = Date.now() + Math.random();
    const email = userData.email?.replace('@', `${uniqueSuffix}@`) || `test${uniqueSuffix}@example.com`;
    const username = userData.username ? `${userData.username}${uniqueSuffix}` : `testuser${uniqueSuffix}`;

    await request(app).post('/api/v1/auth/register').send({ ...userData, email, username });
    const userDoc = await User.findOne({ email });
    userDoc!.emailVerified = true;
    if (makeAdmin) userDoc!.role = 'admin';
    await userDoc!.save();
  
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: userData.password });
    return { user: (await User.findById(loginRes.body.user._id))!, token: loginRes.body.token };
}

beforeAll(async () => {
  app = setupApp();
  await User.deleteMany({});
  await Note.deleteMany({});
  await Badge.deleteMany({});

  const regularUserData = { name: 'Regular User', email: 'regular@example.com', username: 'regularuser', password: 'password123', role: 'user' as const };
  ({ user: regularUser, token: regularUserToken } = await createUserAndLogin(regularUserData));
  
  const adminUserData = { name: 'Admin User', email: 'admin@example.com', username: 'adminuser', password: 'password123', role: 'admin' as const };
  ({ user: adminUser, token: adminToken } = await createUserAndLogin(adminUserData, true));
});

afterAll(async () => {
  await User.deleteMany({});
  await Note.deleteMany({});
  await Badge.deleteMany({});
  await mongoose.disconnect();
});

describe('User Routes', () => {
  describe('Public User Routes', () => {
    let publicUser: IUser;
    beforeAll(async () => {
        publicUser = await User.create(mockUser({ username: 'publicprofile', name: 'Public User'}));
        // Add some badges to this user
        const badge1 = await Badge.create(mockBadge({ name: 'Public Badge 1', slug: 'public-badge-1'}));
        publicUser.badges = [{ badge: badge1._id, earnedAt: new Date(), criteriaMet: 'test'}];
        await publicUser.save();
    });

    it('GET /api/v1/users/:username/profile - should get a user\'s public profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${publicUser.username}/profile`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(publicUser.username);
      expect(response.body.data.name).toBe(publicUser.name);
      // Ensure sensitive info is not present
      expect(response.body.data.email).toBeUndefined();
      expect(response.body.data.password).toBeUndefined();
    });

    it('GET /api/v1/users/:userId/badges - should get public badges for a user', async () => {
        const response = await request(app)
          .get(`/api/v1/users/${publicUser._id}/badges`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].badge.name).toBe('Public Badge 1');
      });
    
    // TODO: Test GET /leaderboard (requires more setup with XP)
  });

  describe('Authenticated User Routes (/me)', () => {
    beforeAll(async () => {
        // Add some activity and badges to regularUser for these tests
        regularUser.activity = [
            mockUserActivity({ action: 'login', description: 'Logged in'}),
            mockUserActivity({ action: 'ai_summary', description: 'Summarized a note'})
        ];
        const myBadge = await Badge.create(mockBadge({ name: 'My Test Badge', slug: 'my-test-badge'}));
        regularUser.badges = [{badge: myBadge._id, earnedAt: new Date(), criteriaMet: 'test'}];
        await regularUser.save();
    });

    it('GET /api/v1/users/me/badges - should get current user\'s badges', async () => {
      const response = await request(app)
        .get('/api/v1/users/me/badges')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].badge.name).toBe('My Test Badge');
    });

    it('GET /api/v1/users/me/activity - should get current user\'s activity log', async () => {
        const response = await request(app)
          .get('/api/v1/users/me/activity')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        // Based on UserService.getUserActivityLog, it should return the activities.
        // Further checks can be on the count or specific activity details if UserService is more complex.
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        expect(response.body.data.some((act:any) => act.action === 'ai_summary')).toBe(true);
      });

    // Favorite Notes tests
    let noteForFavorite: INote;
    beforeAll(async () => {
        noteForFavorite = await Note.create(mockNote({ user: regularUser._id, title: 'Note to Favorite', isPublic: true }));
    });

    it('POST /api/v1/users/me/favorites/:noteId - should add a note to favorites', async () => {
        const response = await request(app)
            .post(`/api/v1/users/me/favorites/${noteForFavorite._id}`)
            .set('Authorization', `Bearer ${regularUserToken}`)
            .expect(200);
        expect(response.body.success).toBe(true);
        const userAfter = await User.findById(regularUser._id);
        expect(userAfter?.favoriteNotes.some(favId => favId.toString() === noteForFavorite._id.toString())).toBe(true);
    });

    it('GET /api/v1/users/me/favorites - should get user\'s favorite notes', async () => {
        // Ensure note is favorited first by the previous test or add it here if tests are isolated.
        // For simplicity, assuming previous test ran and favorited the note.
        const response = await request(app)
            .get('/api/v1/users/me/favorites')
            .set('Authorization', `Bearer ${regularUserToken}`)
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0]._id.toString()).toBe(noteForFavorite._id.toString());
    });

    it('DELETE /api/v1/users/me/favorites/:noteId - should remove a note from favorites', async () => {
        const response = await request(app)
            .delete(`/api/v1/users/me/favorites/${noteForFavorite._id}`)
            .set('Authorization', `Bearer ${regularUserToken}`)
            .expect(200);
        expect(response.body.success).toBe(true);
        const userAfter = await User.findById(regularUser._id);
        expect(userAfter?.favoriteNotes.some(favId => favId.toString() === noteForFavorite._id.toString())).toBe(false);
    });

    // TODO: Test GET /me/notes (user's uploaded notes)
  });

  describe('Admin User Routes', () => {
    let createdUserByAdmin: IUser;

    it('POST /api/v1/users - admin should create a new user', async () => {
        const newUserDetails = { name: 'Created By Admin', email: 'createdbyadmin@example.com', username: 'admincreated', password: 'password123', role: 'user' };
        const response = await request(app)
            .post('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newUserDetails)
            .expect(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(newUserDetails.email);
        createdUserByAdmin = response.body.data;
    });

    it('GET /api/v1/users - admin should get all users', async () => {
        const response = await request(app)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(3); // regularUser, adminUser, createdUserByAdmin
    });

    it('GET /api/v1/users/:id - admin should get a single user by ID', async () => {
        const response = await request(app)
            .get(`/api/v1/users/${createdUserByAdmin._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(createdUserByAdmin.email);
    });

    it('PUT /api/v1/users/:id - admin should update a user', async () => {
        const updates = { name: 'Updated Name by Admin', role: 'user' as const }; // Role cannot be updated this way usually, but test name
        const response = await request(app)
            .put(`/api/v1/users/${createdUserByAdmin._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updates)
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updates.name);
    });

    it('DELETE /api/v1/users/:id - admin should delete a user', async () => {
        await request(app)
            .delete(`/api/v1/users/${createdUserByAdmin._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        const user = await User.findById(createdUserByAdmin._id);
        expect(user).toBeNull();
    });

    it('GET /api/v1/users - regular user should not access admin routes', async () => {
        await request(app)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${regularUserToken}`)
            .expect(403); // Forbidden
    });
  });

  // TODO: Add tests for UserActivityFeedController routes if they remain in userRoutes.ts
}); 