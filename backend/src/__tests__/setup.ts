import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(__dirname, '../../.env.test') });

const MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/edu_guardian_test';

beforeAll(async () => {
  try {
    await mongoose.connect(MONGODB_URI_TEST);
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

afterEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Mock OpenAI for Vitest
globalThis.vi?.mock?.('openai', () => ({
  OpenAI: globalThis.vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: globalThis.vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked AI response' } }]
        })
      }
    }
  }))
}));

// Mock Cloudinary for Vitest
globalThis.vi?.mock?.('cloudinary', () => ({
  v2: {
    config: globalThis.vi.fn(),
    uploader: {
      upload: globalThis.vi.fn().mockResolvedValue({
        secure_url: 'https://mocked.cloudinary.com/image.png',
        public_id: 'mocked_public_id',
        asset_id: 'mocked_asset_id',
        bytes: 12345,
        format: 'png',
        resource_type: 'image',
        created_at: new Date().toISOString()
      })
    }
  }
})); 