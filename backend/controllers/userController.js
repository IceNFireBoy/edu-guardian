const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Note = require('../models/Note');
const Badge = require('../models/Badge');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'badges.badge',
    select: 'name description icon rarity'
  });

  // Update streak if user visits
  user.updateStreak();
  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update my profile
// @route   PUT /api/v1/users/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res, next) => {
  // Fields to update
  const fieldsToUpdate = {
    name: req.body.name,
    biography: req.body.biography,
    preferences: req.body.preferences
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update profile image
// @route   PUT /api/v1/users/me/avatar
// @access  Private
exports.updateProfileImage = asyncHandler(async (req, res, next) => {
  // Fields to update
  const fieldsToUpdate = {
    profileImage: req.body.profileImage
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get user progress and stats
// @route   GET /api/v1/users/me/progress
// @access  Private
exports.getProgress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Get total notes
  const totalNotes = await Note.countDocuments({ user: req.user.id });
  
  // Calculate completion percentage for each subject
  const subjects = user.subjects.map(subject => ({
    name: subject.name,
    progress: subject.progress
  }));

  // Get recent badges
  const recentBadges = user.badges
    .sort((a, b) => b.earnedAt - a.earnedAt)
    .slice(0, 5)
    .map(badge => badge.badge);

  // Get activity summary
  const activitySummary = user.activity.reduce((summary, activity) => {
    const action = activity.action;
    summary[action] = (summary[action] || 0) + 1;
    return summary;
  }, {});

  // Calculate XP needed for next level
  const currentXp = user.xp;
  const currentLevel = user.level;
  const xpForNextLevel = (currentLevel * 100);
  const xpProgress = Math.min(100, (currentXp % 100));

  const progressData = {
    xp: {
      total: currentXp,
      forNextLevel: xpForNextLevel,
      progress: xpProgress
    },
    level: currentLevel,
    streak: user.streak.count,
    subjects,
    totalNotes,
    recentBadges,
    activitySummary
  };

  res.status(200).json({
    success: true,
    data: progressData
  });
});

// @desc    Get user badges
// @route   GET /api/v1/users/me/badges
// @access  Private
exports.getBadges = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'badges.badge',
    select: 'name description icon category rarity xpReward isActive'
  });

  // Get all available badges
  const allBadges = await Badge.find({ isActive: true });
  
  // Format earned badges
  const earnedBadges = user.badges.map(badge => ({
    ...badge.badge.toObject(),
    earnedAt: badge.earnedAt
  }));
  
  // Format unearned badges
  const earnedBadgeIds = earnedBadges.map(badge => badge._id.toString());
  const unearnedBadges = allBadges
    .filter(badge => !earnedBadgeIds.includes(badge._id.toString()))
    .map(badge => badge.toObject());

  res.status(200).json({
    success: true,
    data: {
      earned: earnedBadges,
      unearned: unearnedBadges
    }
  });
});

// @desc    Add or update subject progress
// @route   PUT /api/v1/users/me/subjects
// @access  Private
exports.updateSubjectProgress = asyncHandler(async (req, res, next) => {
  const { name, progress } = req.body;

  if (!name) {
    return next(new ErrorResponse('Please provide subject name', 400));
  }

  if (progress === undefined || progress < 0 || progress > 100) {
    return next(new ErrorResponse('Progress must be between 0 and 100', 400));
  }

  const user = await User.findById(req.user.id);

  // Check if subject already exists
  const subjectIndex = user.subjects.findIndex(s => s.name === name);

  if (subjectIndex !== -1) {
    // Update existing subject
    user.subjects[subjectIndex].progress = progress;
  } else {
    // Add new subject
    user.subjects.push({ name, progress });
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.subjects
  });
});

// @desc    Get recent activity
// @route   GET /api/v1/users/me/activity
// @access  Private
exports.getActivity = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Get recent activity (last 30 items)
  const recentActivity = user.activity.slice(0, 30);

  res.status(200).json({
    success: true,
    count: recentActivity.length,
    data: recentActivity
  });
});

// @desc    Add a badge to user
// @route   POST /api/v1/users/me/badges
// @access  Private
exports.addBadge = asyncHandler(async (req, res, next) => {
  const { badgeId } = req.body;

  if (!badgeId) {
    return next(new ErrorResponse('Please provide badge ID', 400));
  }

  // Check if badge exists
  const badge = await Badge.findById(badgeId);

  if (!badge) {
    return next(new ErrorResponse(`Badge not found with id of ${badgeId}`, 404));
  }

  // Check if user already has this badge
  const user = await User.findById(req.user.id);
  const hasBadge = user.badges.some(b => b.badge.toString() === badgeId);

  if (hasBadge) {
    return next(new ErrorResponse('User already has this badge', 400));
  }

  // Add badge to user
  user.badges.push({
    badge: badgeId,
    earnedAt: Date.now()
  });

  // Add XP reward
  user.xp += badge.xpReward;
  
  // Add activity
  user.addActivity('earn_badge', `Earned badge: ${badge.name}`, badge.xpReward);
  
  // Calculate new level
  user.calculateLevel();
  
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      badge,
      currentXp: user.xp,
      currentLevel: user.level
    }
  });
});

// @desc    Get user leaderboard
// @route   GET /api/v1/users/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
  const leaderboard = await User.find()
    .select('name username profileImage xp level streak.count badges')
    .sort({ xp: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard
  });
}); 