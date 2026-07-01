import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import TokenBlacklist from '../models/TokenBlacklist';

/**
 * Helpers for invalidating JWTs on logout. See models/TokenBlacklist.ts for the
 * rationale (stateless JWTs cannot otherwise be revoked before expiry).
 */

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Record a token as invalid. Idempotent (upsert on the token hash). The blacklist
 * entry inherits the JWT's own expiry so it self-cleans via the TTL index.
 */
export const blacklistToken = async (token: string): Promise<void> => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : // Fall back to the default cookie lifetime if the token carries no exp claim
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await TokenBlacklist.updateOne(
    { tokenHash: hashToken(token) },
    { $setOnInsert: { tokenHash: hashToken(token), expiresAt } },
    { upsert: true }
  );
};

/** True if the token was previously invalidated via logout. */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const existing = await TokenBlacklist.exists({ tokenHash: hashToken(token) });
  return Boolean(existing);
};
