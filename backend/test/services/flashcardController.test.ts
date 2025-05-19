import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('FlashcardController', () => {
  test('returns AI flashcards from OpenAI response', async () => {
    const res = await request(app).post('/api/flashcards/ai')
      .send({ text: 'Photosynthesis is...' });
    expect(res.body).toHaveLength(5);
    expect(res.body[0]).toHaveProperty('question');
  });

  test('handles OpenAI error gracefully', async () => {
    const res = await request(app).post('/api/flashcards/ai')
      .send({ text: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
