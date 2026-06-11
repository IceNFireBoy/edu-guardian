// Set up Vitest to provide Jest-like functionality
import { vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
// Register every schema referenced by populate() calls (e.g. 'badges.badge'
// -> 'Badge'); tests that only import a service would otherwise hit
// MissingSchemaError for models loaded as a side effect elsewhere.
import './models/Badge';

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  // Pin a mongod that links against OpenSSL 3: the old default (5.0.x)
  // needs libcrypto.so.1.1, which modern runners no longer ship.
  mongo = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION || '7.0.14' }
  });
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db?.collections();
  if (collections) {
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  // Guard: if the instance never started, don't mask the original error
  await mongo?.stop();
});

global.signin = (id?: string) => {
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
  const session = { jwt: token };
  const sessionJSON = JSON.stringify(session);
  const base64 = Buffer.from(sessionJSON).toString('base64');
  return [`session=${base64}`];
};

// Set up Vitest to provide Jest-like functionality
globalThis.jest = vi as any;

// Mock fetch
globalThis.fetch = vi.fn(); 