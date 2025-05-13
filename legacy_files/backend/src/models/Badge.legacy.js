// This file has been superseded by backend/src/models/Badge.ts
const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
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
    enum: ['upload', 'engagement', 'streak', 'achievement', 'special'],
    required: [true, 'Please specify a badge category']
  },
  requirements: {
    type: mongoose.Schema.Types.Mixed,
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

module.exports = mongoose.model('Badge', BadgeSchema); 