const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Badge = require('../models/Badge');

// @desc    Get all badges
// @route   GET /api/v1/badges
// @access  Public
exports.getBadges = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
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
  const badges = await Badge.find({ 
    category: req.params.category,
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
  const badges = await Badge.find({ 
    rarity: req.params.rarity,
    isActive: true
  }).sort({ displayOrder: 1 });

  res.status(200).json({
    success: true,
    count: badges.length,
    data: badges
  });
}); 