import mongoose, { Document } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  description: string;
  imageUrl: string;
  category: 'xp' | 'notes';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: {
    description: string;
    requirements: Record<string, any>;
  };
  xpAward?: number;
  isActive: boolean;
  slug: string;
  createdAt: Date;
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
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  category: {
    type: String,
    enum: ['xp', 'notes'],
    required: [true, 'Please specify a category']
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: [true, 'Please specify a rarity level']
  },
  criteria: {
    description: {
      type: String,
      required: [true, 'Please add criteria description']
    },
    requirements: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Please specify badge requirements']
    }
  },
  xpAward: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  slug: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Create slug from name
badgeSchema.pre('save', function(next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  next();
});

export default mongoose.model<IBadge>('Badge', badgeSchema); 