import mongoose, { Document, Schema } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  category: 'upload' | 'engagement' | 'streak' | 'achievement' | 'special' | 'ai';
  requirements: any;
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  slug: string;
}

const BadgeSchema = new Schema<IBadge>({
  name: {
    type: String,
    required: [true, 'Please add a badge name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  icon: {
    type: String,
    required: [true, 'Please add an icon']
  },
  category: {
    type: String,
    enum: ['upload', 'engagement', 'streak', 'achievement', 'special', 'ai'],
    required: [true, 'Please specify a badge category']
  },
  requirements: {
    type: Schema.Types.Mixed,
    required: [true, 'Please add requirements for earning this badge']
  },
  xpReward: {
    type: Number,
    default: 0
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    required: [true, 'Please specify a badge level']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 999
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better querying
BadgeSchema.index({ category: 1, rarity: 1 });

// Create a slug for url-friendly badge names
BadgeSchema.pre('save', function(next) {
  this.slug = this.name.toLowerCase().replace(/ /g, '-');
  next();
});

const Badge = mongoose.model<IBadge>('Badge', BadgeSchema);

export default Badge; 