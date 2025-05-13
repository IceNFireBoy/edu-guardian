import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '1d';
process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/edu_guardian_test';
process.env.PORT = '5001';

// Global setup
beforeAll(async () => {
  if (!process.env.MONGODB_URI_TEST) {
    throw new Error('MONGODB_URI_TEST environment variable is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
});

// Global teardown
afterAll(async () => {
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('Test database dropped');
    }
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during test cleanup:', error);
    throw error;
  }
});

// Clean up after each test
afterEach(async () => {
  try {
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
      console.log('Collections cleaned up');
    }
  } catch (error) {
    console.error('Error cleaning up collections:', error);
    throw error;
  }
});

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mock AI response',
              },
            },
          ],
        }),
      },
    },
  })),
}));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://mock-cloudinary-url.com/image.jpg',
        public_id: 'mock-public-id',
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
})); 