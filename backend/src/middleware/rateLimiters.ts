import rateLimit, { Options } from 'express-rate-limit';

/**
 * Rate limiters for sensitive routes.
 *
 * The global limiter in server.ts protects the API as a whole; these are much
 * stricter and scoped to authentication endpoints so credential-stuffing and
 * brute-force attempts are throttled long before they threaten student data.
 *
 * Responses use the same `{ success, error }` envelope as the rest of the API
 * so the frontend error handler treats them consistently.
 */

const isTestEnv = (): boolean => process.env.NODE_ENV === 'test';

/**
 * Factory for consistently-configured limiters. Does not skip any environment
 * by default so it can be unit-tested directly.
 */
export const createLimiter = (options: Partial<Options>) =>
  rateLimit({
    standardHeaders: true, // expose RateLimit-* headers
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
    ...options,
  });

/**
 * Login / register throttle. Only failed attempts count toward the limit
 * (skipSuccessfulRequests), so an active user is never locked out while a
 * password-guessing attacker is stopped after a handful of failures.
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again in about 15 minutes.',
  },
  skip: isTestEnv, // don't throttle the test suite
});

/**
 * Forgot / reset-password throttle. Counts every request (successful or not)
 * because the forgot-password endpoint always returns 200 to avoid user
 * enumeration; without this an attacker could spam reset emails.
 */
export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Too many password reset requests from this IP. Please try again later.',
  },
  skip: isTestEnv,
});
