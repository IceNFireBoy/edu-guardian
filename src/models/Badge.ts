import mongoose, { Document, Schema } from 'mongoose';

export interface Badge {
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    value: number;
  };
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BadgeDocument extends Badge, Document {}

const BadgeSchema = new Schema<BadgeDocument>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: {
    type: String,
    enum: ['achievement', 'milestone', 'special'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: true
  },
  criteria: {
    type: { type: String, required: true },
    value: { type: Number, required: true }
  },
  xpReward: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BadgeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Badge = mongoose.model<BadgeDocument>('Badge', BadgeSchema); 