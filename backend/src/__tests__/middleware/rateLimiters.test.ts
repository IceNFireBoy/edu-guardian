import request from 'supertest';
import express from 'express';
import { describe, it, expect } from 'vitest';
import { createLimiter } from '../../middleware/rateLimiters';

// The exported authLimiter/passwordResetLimiter skip the test environment so
// they don't make other suites flaky. Here we exercise the underlying factory
// directly (no skip) to prove the throttling behaviour.
describe('rate limiter factory', () => {
  it('returns 429 with the standard error envelope once the budget is spent', async () => {
    const app = express();
    app.use(createLimiter({ windowMs: 60_000, max: 2 }));
    app.get('/', (_req, res) => {
      res.json({ ok: true });
    });

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);

    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect(typeof blocked.body.error).toBe('string');
  });
});
