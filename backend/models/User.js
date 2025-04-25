const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
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
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    maxlength: [20, 'Username cannot be more than 20 characters']
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
    select: false // Don't return password in queries
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
    darkMode: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  // Gamification features
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streak: {
    count: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  badges: [
    {
      badge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
      },
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  activity: [
    {
      action: {
        type: String,
        enum: ['upload', 'download', 'comment', 'rate', 'share', 'login', 'earn_badge', 'earn_xp'],
        required: true
      },
      description: String,
      xpEarned: {
        type: Number,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  subjects: [
    {
      name: String,
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  ],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  return verificationToken;
};

// Calculate user level based on XP
UserSchema.methods.calculateLevel = function() {
  // Simple level calculation: level = 1 + Math.floor(xp / 100)
  this.level = 1 + Math.floor(this.xp / 100);
  return this.level;
};

// Update streak count
UserSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActive = this.streak.lastActive;
  const diffTime = Math.abs(now - lastActive);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // User was active yesterday, increment streak
    this.streak.count += 1;
  } else if (diffDays > 1) {
    // User missed a day, reset streak
    this.streak.count = 1;
  }
  // If diffDays is 0, user was already active today, don't change streak
  
  this.streak.lastActive = now;
  return this.streak.count;
};

// Add activity
UserSchema.methods.addActivity = function(action, description = '', xpEarned = 0) {
  this.activity.unshift({
    action,
    description,
    xpEarned,
    createdAt: Date.now()
  });
  
  // Keep only the latest 100 activities
  if (this.activity.length > 100) {
    this.activity = this.activity.slice(0, 100);
  }
  
  // Add XP if earned
  if (xpEarned > 0) {
    this.xp += xpEarned;
    this.calculateLevel();
  }
  
  return this.activity[0];
};

module.exports = mongoose.model('User', UserSchema); 