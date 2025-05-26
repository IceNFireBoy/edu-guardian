import express from 'express';
import { protect, authorize } from '../middleware/auth';
import BadgeController from '../controllers/BadgeController';
import { body, param } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/', BadgeController.getBadges);
router.get('/:id', BadgeController.getBadgeById);
router.get('/category/:category', BadgeController.getBadgesByCategory);
router.get('/rarity/:rarity', BadgeController.getBadgesByRarity);

// Protected routes
router.use(protect);
router.post('/award', BadgeController.awardBadgeToUser);
router.post('/check', BadgeController.checkAndAwardBadges);

// Admin routes
router.use(authorize('admin'));
router.post('/', BadgeController.createBadge);
router.put('/:id', BadgeController.updateBadge);
router.delete('/:id', BadgeController.deleteBadge);

export default router; 