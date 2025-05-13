import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Set test environment
process.env.NODE_ENV = 'test';

// Extend timeout for database operations
jest.setTimeout(60000); // Increase timeout to 60 seconds

// Declare the variable in a wider scope
let mongoServer: MongoMemoryServer;

// Connect to test database
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'eduguardian_test',
        storageEngine: 'wiredTiger',
      },
      binary: {
        version: '6.0.5', // Specify a more stable version
        downloadDir: './.cache/mongodb-binaries', // Cache binaries between test runs
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory database');
  } catch (error) {
    console.error('Test database connection error:', error);
    process.exit(1);
  }
});

// Clear database between tests
beforeEach(async () => {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected');
  }
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  if (mongoose.connection) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}); 