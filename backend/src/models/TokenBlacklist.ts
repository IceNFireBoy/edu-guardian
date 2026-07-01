import mongoose, { Document, Schema } from 'mongoose';

/**
 * A JWT that has been explicitly invalidated (e.g. on logout). Because JWTs are
 * stateless, a stolen-but-logged-out token would otherwise stay valid until its
 * natural expiry (up to 30 days). Storing the token's hash lets `protect` reject
 * it immediately.
 *
 * Entries carry the token's own expiry in `expiresAt`; a TTL index purges them
 * automatically once the underlying JWT could no longer be used anyway, so the
 * collection never grows unbounded and no cron job is required.
 */
export interface ITokenBlacklist extends Document {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  // sha256 of the raw JWT — never store the token itself
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: Mongo removes the document once expiresAt has passed.
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);

export default TokenBlacklist;
