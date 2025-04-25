const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  updateProfileImage,
  getProgress,
  getBadges,
  updateSubjectProgress,
  getActivity,
  addBadge,
  getLeaderboard
} = require('../controllers/userController');

const User = require('../models/User');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes available to all authenticated users
router.route('/me').get(getMe);
router.route('/me').put(updateMe);
router.route('/me/avatar').put(updateProfileImage);
router.route('/me/progress').get(getProgress);
router.route('/me/badges').get(getBadges);
router.route('/me/badges').post(addBadge);
router.route('/me/subjects').put(updateSubjectProgress);
router.route('/me/activity').get(getActivity);

// Public routes
router.route('/leaderboard').get(getLeaderboard);

// Admin only routes
router.use(authorize('admin'));

router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 