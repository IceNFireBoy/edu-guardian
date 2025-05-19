import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('BadgeController', () => {
  test('returns badge list for user', async () => {
    const res = await request(app).get('/api/badges').set('Authorization', 'Bearer valid-token');
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: expect.any(String) })
    ]));
  });
});
