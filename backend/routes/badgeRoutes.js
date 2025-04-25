const express = require('express');
const {
  getAllBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  getBadgesByCategory,
  getBadgesByRarity,
  checkBadgeEligibility
} = require('../controllers/badgeController');

const Badge = require('../models/Badge');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.route('/category/:category').get(getBadgesByCategory);
router.route('/rarity/:rarity').get(getBadgesByRarity);

// Protected routes
router.route('/check-eligibility').get(protect, checkBadgeEligibility);

// Public & protected routes
router
  .route('/')
  .get(advancedResults(Badge), getAllBadges)
  .post(protect, authorize('admin'), createBadge);

router
  .route('/:id')
  .get(getBadge)
  .put(protect, authorize('admin'), updateBadge)
  .delete(protect, authorize('admin'), deleteBadge);

module.exports = router; 