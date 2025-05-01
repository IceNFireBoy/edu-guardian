const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Note = require('../models/Note');
const Badge = require('../models/Badge');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public
exports.getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log("[Backend] Returning all users");
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error("[Backend] Error getting users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve users"
    });
  }
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Public
exports.getUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("[Backend] Error getting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user"
    });
  }
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Public
exports.createUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.create(req.body);
    console.log("[Backend] Created new user:", user._id);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("[Backend] Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user"
    });
  }
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Public
exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    console.log("[Backend] Updated user:", user._id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("[Backend] Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user"
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Public
exports.deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    await user.deleteOne();
    console.log("[Backend] Deleted user:", req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error("[Backend] Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user"
    });
  }
});

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Public
exports.getUserProfile = asyncHandler(async (req, res) => {
  try {
    // Since auth is disabled, return a dummy profile
    res.status(200).json({
      success: true,
      data: {
        _id: "dummy_user_id",
        name: "Demo User",
        email: "demo@example.com",
        role: "user",
        xp: 100,
        level: 1,
        streak: { count: 1, lastLogin: new Date() }
      }
    });
  } catch (error) {
    console.error("[Backend] Error getting user profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile"
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Public
exports.updateUserProfile = asyncHandler(async (req, res) => {
  try {
    // Since auth is disabled, just return success
    res.status(200).json({
      success: true,
      data: {
        ...req.body,
        _id: "dummy_user_id",
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("[Backend] Error updating user profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user profile"
    });
  }
});

// @desc    Get user badges
// @route   GET /api/v1/users/badges
// @access  Public
exports.getBadges = asyncHandler(async (req, res) => {
  try {
    // Return dummy badges since auth is disabled
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
    console.error("[Backend] Error getting badges:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get badges"
    });
  }
});

// @desc    Add badge to user
// @route   POST /api/v1/users/badges
// @access  Public
exports.addBadge = asyncHandler(async (req, res) => {
  try {
    // Since auth is disabled, just return success
    res.status(200).json({
      success: true,
      data: {
        badge: req.body,
        earnedAt: new Date()
      }
    });
  } catch (error) {
    console.error("[Backend] Error adding badge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add badge"
    });
  }
});

// @desc    Get user streak
// @route   GET /api/v1/users/streak
// @access  Public
exports.getStreak = asyncHandler(async (req, res) => {
  try {
    // Return dummy streak since auth is disabled
    res.status(200).json({
      success: true,
      data: {
        count: 1,
        lastLogin: new Date(),
        history: []
      }
    });
  } catch (error) {
    console.error("[Backend] Error getting streak:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get streak"
    });
  }
});

// @desc    Update user streak
// @route   PUT /api/v1/users/streak
// @access  Public
exports.updateStreak = asyncHandler(async (req, res) => {
  try {
    // Since auth is disabled, just return success
    res.status(200).json({
      success: true,
      data: {
        count: req.body.count || 1,
        lastLogin: new Date(),
        history: []
      }
    });
  } catch (error) {
    console.error("[Backend] Error updating streak:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update streak"
    });
  }
});

// @desc    Get leaderboard
// @route   GET /api/v1/users/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res) => {
  try {
    // Return dummy leaderboard since auth is disabled
    res.status(200).json({
      success: true,
      data: [
        {
          _id: "user_1",
          name: "Top User",
          xp: 1000,
          level: 10,
          badges: 5
        }
      ]
    });
  } catch (error) {
    console.error("[Backend] Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get leaderboard"
    });
  }
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