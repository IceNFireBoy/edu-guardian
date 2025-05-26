import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mockUser } from './factories/user.factory';
import { mockNote } from './factories/note.factory';
import { mockBadge } from './factories/badge.factory';

let mongoServer: MongoMemoryServer;

// Connect to the in-memory database before running tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect and stop server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Test utilities
export const createTestUser = async (overrides = {}) => {
  const User = mongoose.model('User');
  const userData = mockUser(overrides);
  const user = new User(userData);
  return await user.save();
};

export const createTestNote = async (overrides = {}) => {
  const Note = mongoose.model('Note');
  const noteData = mockNote(overrides);
  const note = new Note(noteData);
  return await note.save();
};

export const createTestBadge = async (overrides = {}) => {
  const Badge = mongoose.model('Badge');
  const badgeData = mockBadge();
  const badge = new Badge(badgeData);
  return await badge.save();
}; 