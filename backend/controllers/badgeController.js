const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Badge = require('../models/Badge');
const User = require('../models/User');

// @desc    Get all badges
// @route   GET /api/v1/badges
// @access  Public
exports.getBadges = asyncHandler(async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ displayOrder: 1 });
    console.log("[Backend] Returning all badges:", badges.length);
    
    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    console.error("[Backend] Error getting badges:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve badges"
    });
  }
});

// @desc    Get single badge
// @route   GET /api/v1/badges/:id
// @access  Public
exports.getBadge = asyncHandler(async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({
        success: false,
        error: "Badge not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error("[Backend] Error getting badge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve badge"
    });
  }
});

// @desc    Create new badge
// @route   POST /api/v1/badges
// @access  Public
exports.createBadge = asyncHandler(async (req, res) => {
  try {
    const badge = await Badge.create(req.body);
    console.log("[Backend] Created new badge:", badge._id);
    
    res.status(201).json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error("[Backend] Error creating badge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create badge"
    });
  }
});

// @desc    Update badge
// @route   PUT /api/v1/badges/:id
// @access  Public
exports.updateBadge = asyncHandler(async (req, res) => {
  try {
    let badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({
        success: false,
        error: "Badge not found"
      });
    }
    
    badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log("[Backend] Updated badge:", badge._id);
    
    res.status(200).json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error("[Backend] Error updating badge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update badge"
    });
  }
});

// @desc    Delete badge
// @route   DELETE /api/v1/badges/:id
// @access  Public
exports.deleteBadge = asyncHandler(async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({
        success: false,
        error: "Badge not found"
      });
    }
    
    await badge.deleteOne();
    console.log("[Backend] Deleted badge:", req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error("[Backend] Error deleting badge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete badge"
    });
  }
});

// @desc    Award badge to user
// @route   POST /api/v1/badges/award/:userId
// @access  Public
exports.awardBadge = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { badgeId } = req.body;
    
    // Since auth is disabled, just return success
    console.log("[Backend] Awarding badge to user:", userId, badgeId);
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        badgeId,
        awardedAt: new Date()
      }
    });
  } catch (error) {
    console.error("[Backend] Error awarding badge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to award badge"
    });
  }
});

// @desc    Get user badges
// @route   GET /api/v1/badges/user/:userId
// @access  Public
exports.getUserBadges = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Since auth is disabled, return dummy badges
    console.log("[Backend] Getting badges for user:", userId);
    
    res.status(200).json({
      success: true,
      data: [
        {
          _id: "badge_1",
          name: "First Upload",
          description: "Upload your first note",
          icon: "📚",
          earnedAt: new Date()
        }
      ]
    });
  } catch (error) {
    console.error("[Backend] Error getting user badges:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user badges"
    });
  }
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