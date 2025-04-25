const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Badge = require('../models/Badge');
const User = require('../models/User');

// @desc    Get all badges
// @route   GET /api/v1/badges
// @access  Public
exports.getAllBadges = asyncHandler(async (req, res, next) => {
  const badges = await Badge.find({ isActive: true }).sort({ displayOrder: 1 });
  
  res.status(200).json({
    success: true,
    count: badges.length,
    data: badges
  });
});

// @desc    Get single badge
// @route   GET /api/v1/badges/:id
// @access  Public
exports.getBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id);
  
  if (!badge) {
    return next(new ErrorResponse(`Badge not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: badge
  });
});

// @desc    Create new badge
// @route   POST /api/v1/badges
// @access  Private/Admin
exports.createBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.create(req.body);
  
  res.status(201).json({
    success: true,
    data: badge
  });
});

// @desc    Update badge
// @route   PUT /api/v1/badges/:id
// @access  Private/Admin
exports.updateBadge = asyncHandler(async (req, res, next) => {
  let badge = await Badge.findById(req.params.id);
  
  if (!badge) {
    return next(new ErrorResponse(`Badge not found with id of ${req.params.id}`, 404));
  }
  
  badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: badge
  });
});

// @desc    Delete badge
// @route   DELETE /api/v1/badges/:id
// @access  Private/Admin
exports.deleteBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id);
  
  if (!badge) {
    return next(new ErrorResponse(`Badge not found with id of ${req.params.id}`, 404));
  }
  
  await badge.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get badges by category
// @route   GET /api/v1/badges/category/:category
// @access  Public
exports.getBadgesByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  
  if (!['streak', 'xp', 'notes', 'achievement'].includes(category)) {
    return next(new ErrorResponse(`Invalid category: ${category}`, 400));
  }
  
  const badges = await Badge.find({ 
    category,
    isActive: true 
  }).sort({ displayOrder: 1 });
  
  res.status(200).json({
    success: true,
    count: badges.length,
    data: badges
  });
});

// @desc    Get badges by rarity
// @route   GET /api/v1/badges/rarity/:rarity
// @access  Public
exports.getBadgesByRarity = asyncHandler(async (req, res, next) => {
  const { rarity } = req.params;
  
  if (!['common', 'rare', 'epic', 'legendary'].includes(rarity)) {
    return next(new ErrorResponse(`Invalid rarity: ${rarity}`, 400));
  }
  
  const badges = await Badge.find({ 
    rarity,
    isActive: true 
  }).sort({ displayOrder: 1 });
  
  res.status(200).json({
    success: true,
    count: badges.length,
    data: badges
  });
});

// @desc    Check user eligibility for badges
// @route   GET /api/v1/badges/check-eligibility
// @access  Private
exports.checkBadgeEligibility = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Get all active badges
  const allBadges = await Badge.find({ isActive: true });
  
  // Get user's current badges
  const userBadgeIds = user.badges.map(badge => badge.badge.toString());
  
  // Find badges the user is eligible for but hasn't earned yet
  const eligibleBadges = allBadges.filter(badge => {
    // Skip if user already has this badge
    if (userBadgeIds.includes(badge._id.toString())) {
      return false;
    }
    
    // Check eligibility based on badge category and requirements
    switch (badge.category) {
      case 'streak':
        return user.currentStreak >= badge.requirements;
      case 'xp':
        return user.xp >= badge.requirements;
      case 'notes':
        return user.notes && user.notes.length >= badge.requirements;
      // For achievement badges, we'll need custom logic per badge
      case 'achievement':
        // This would require more specific implementation based on achievement types
        return false;
      default:
        return false;
    }
  });
  
  res.status(200).json({
    success: true,
    data: eligibleBadges
  });
}); 