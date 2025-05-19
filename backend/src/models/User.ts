import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Interface for individual badge entry in user's badges array
export interface IUserBadge extends Document { // Can be a sub-document if not needing _id, or just an object type
  badge: mongoose.Types.ObjectId; // Reference to Badge model
  earnedAt: Date;
  criteriaMet: string;
}

// Interface for individual activity entry
export interface IUserActivity extends Document { // Sub-document or object type
  action: 'study' | 'comment' | 'upload' | 'download' | 'rate' | 'share' | 'login' | 'earn_badge' | 'earn_xp' | 'ai_summary_generated' | 'ai_flashcards_generated';
  description: string;
  xpEarned?: number;
  timestamp: Date;
}

// Interface for individual subject entry
export interface IUserSubject extends Document { // Sub-document or object type
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
}

// Main User Interface
export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  role: 'user' | 'publisher' | 'admin';
  password?: string; // Optional because it's selected: false
  profileImage: string;
  biography?: string;
  preferences: {
    darkMode: boolean;
    emailNotifications: boolean;
  };
  xp: number;
  level: number;
  streak: {
    current: number;
    max: number;
    lastUsed: Date;
  };
  lastActive: Date;
  badges: IUserBadge[];
  activity: IUserActivity[];
  subjects: IUserSubject[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  emailVerificationToken?: string;
  emailVerificationTokenExpire?: Date; // Added field based on service logic
  emailVerified: boolean;
  aiUsage: {
    summaryUsed: number;
    flashcardUsed: number;
    lastReset: Date;
  };
  totalSummariesGenerated: number; // Added for lifetime count
  totalFlashcardsGenerated: number; // Added for lifetime count
  favoriteNotes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // Instance Methods (declare signatures)
  getSignedJwtToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
  getEmailVerificationToken(): string;
  calculateLevel(): number;
  updateStreak(): Promise<void>;
  addActivity(action: IUserActivity['action'], description: string, xpEarned?: number): void;
}

// User Schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      maxlength: [30, 'Username cannot be more than 30 characters']
    },
    role: {
      type: String,
      enum: ['user', 'publisher', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password in queries by default
    },
    profileImage: {
      type: String,
      default: 'no-photo.jpg'
    },
    biography: {
      type: String,
      maxlength: [500, 'Biography cannot be more than 500 characters']
    },
    preferences: {
      darkMode: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true }
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      lastUsed: { type: Date, default: Date.now }
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    badges: [
      {
        badge: { type: Schema.Types.ObjectId, ref: 'Badge' },
        earnedAt: { type: Date, default: Date.now },
        criteriaMet: { type: String, required: true }
      }
    ],
    activity: [
      {
        action: {
          type: String,
          enum: ['study', 'comment', 'upload', 'download', 'rate', 'share', 'login', 'earn_badge', 'earn_xp', 'ai_summary_generated', 'ai_flashcards_generated'],
          required: true
        },
        description: String,
        xpEarned: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    subjects: [
      {
        name: {
          type: String,
          required: [true, 'Please add a subject name']
        },
        level: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced'],
          required: [true, 'Please specify a level']
        },
        topics: [{
          type: String,
          required: [true, 'Please add at least one topic']
        }]
      }
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationTokenExpire: Date, // Added field based on service logic
    emailVerified: { type: Boolean, default: false },
    aiUsage: {
      summaryUsed: { type: Number, default: 0 },
      flashcardUsed: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now }
    },
    totalSummariesGenerated: { type: Number, default: 0 }, // Added for lifetime count
    totalFlashcardsGenerated: { type: Number, default: 0 }, // Added for lifetime count
    favoriteNotes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { // Schema options
    timestamps: true, // if you want Mongoose to add createdAt and updatedAt automatically
    // To make sure virtuals are included when converting to JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Encrypt password using bcrypt (pre-save hook)
UserSchema.pre<IUser>('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function(this: IUser): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not defined');
  }
  
  const payload = { id: this._id, role: this.role };
  
  // Type assertion to help TypeScript understand the structure
  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  };
  
  // @ts-ignore - Ignoring TypeScript error because we know this is correct
  return jwt.sign(payload, secret, options);
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  if (!this.password) return false; // Should not happen if password is required
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function(this: IUser): string {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function(this: IUser): string {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

// Calculate user level based on XP
UserSchema.methods.calculateLevel = function(this: IUser): number {
  this.level = 1 + Math.floor(this.xp / 100);
  return this.level;
};

// Update streak count
UserSchema.methods.updateStreak = async function(this: IUser): Promise<void> {
  const now = new Date();
  const lastLogin = new Date(this.streak.lastUsed);
  const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    this.streak.current += 1;
    if (this.streak.current > this.streak.max) {
      this.streak.max = this.streak.current;
    }
  } else if (diffDays > 1) {
    // Streak broken
    this.streak.current = 1;
  }

  this.streak.lastUsed = now;
  await this.save();
};

// Add activity
UserSchema.methods.addActivity = function(
  this: IUser, 
  action: IUserActivity['action'], 
  description: string, 
  xpEarned: number = 0
): void {
  const newActivity: IUserActivity = {
    action,
    description,
    xpEarned,
    timestamp: new Date()
  } as IUserActivity; // Type assertion

  this.activity.unshift(newActivity);

  if (xpEarned > 0) {
    this.xp += xpEarned;
    this.calculateLevel();
  }

  // Keep only the last 100 activities
  if (this.activity.length > 100) {
    this.activity = this.activity.slice(0, 100);
  }
};

// Static model type
export interface IUserModel extends Model<IUser> {
  // Define static methods here if any
}

// Export the model
const User = mongoose.model<IUser, IUserModel>('User', UserSchema);
export default User;
export { User }; 