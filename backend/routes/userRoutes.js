const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  addBadge,
  getBadges,
  updateStreak,
  getStreak,
  getLeaderboard
} = require('../controllers/userController');

const router = express.Router();

// Public routes
router.route('/').get(getUsers).post(createUser);
router.route('/profile').get(getUserProfile).put(updateUserProfile);
router.route('/badges').get(getBadges).post(addBadge);
router.route('/streak').get(getStreak).put(updateStreak);
router.route('/leaderboard').get(getLeaderboard);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router; 