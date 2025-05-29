import mongoose, { Document, Schema } from 'mongoose';
import { User as IUser, UserBadge, UserActivity } from '../types/user';

export interface UserDocument extends IUser, Document {}

const UserBadgeSchema = new Schema<UserBadge>({
  badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  earnedAt: { type: Date, default: Date.now },
  criteriaMet: { type: String, required: true }
});

const UserActivitySchema = new Schema<UserActivity>({
  action: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  xpEarned: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed }
});

const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: {
    current: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    lastUsed: { type: Date }
  },
  aiUsage: {
    summaryUsed: { type: Number, default: 0 },
    flashcardUsed: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  badges: [UserBadgeSchema],
  favoriteNotes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
  activity: [UserActivitySchema],
  totalSummariesGenerated: { type: Number, default: 0 },
  totalFlashcardsGenerated: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<UserDocument>('User', UserSchema); 