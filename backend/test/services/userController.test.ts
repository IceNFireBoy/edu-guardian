import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('UserController', () => {
  test('gets current user profile', async () => {
    const res = await request(app).get('/api/user/profile').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.email).toMatch(/@/);
  });
});
