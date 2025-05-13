import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables from .env.test
config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '1d';
process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/eduguardian_test';

// Global setup
beforeAll(async () => {
  // Connect to the test database
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

// Global teardown
afterAll(async () => {
  // Drop the test database and close the connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clean up between tests
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}); 