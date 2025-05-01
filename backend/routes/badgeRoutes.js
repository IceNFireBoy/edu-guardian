const express = require('express');
const {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  awardBadge,
  getUserBadges
} = require('../controllers/badgeController');

const router = express.Router();

// Public routes
router.route('/').get(getBadges).post(createBadge);
router.route('/award/:userId').post(awardBadge);
router.route('/user/:userId').get(getUserBadges);
router.route('/:id').get(getBadge).put(updateBadge).delete(deleteBadge);

module.exports = router; 