import mongoose, { Document } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  description: string;
  category: 'engagement' | 'ai' | 'streak' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    threshold: number;
  };
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a badge name'],
    trim: true,
    unique: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: ['engagement', 'ai', 'streak', 'achievement'],
    required: [true, 'Please specify a category']
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: [true, 'Please specify a rarity level']
  },
  criteria: {
    type: {
      type: String,
      required: [true, 'Please specify criteria type']
    },
    threshold: {
      type: Number,
      required: [true, 'Please specify criteria threshold']
    }
  },
  xpReward: {
    type: Number,
    required: [true, 'Please specify XP reward'],
    min: [0, 'XP reward cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
export default Badge;
export { Badge }; 