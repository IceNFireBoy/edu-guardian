import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('NoteController', () => {
  test('filters notes by subject', async () => {
    const res = await request(app).get('/api/notes?subject=Science');
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ subject: 'Science' })
    ]));
  });

  test('rejects upload with missing fields', async () => {
    const res = await request(app).post('/api/notes').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
