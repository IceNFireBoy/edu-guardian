import express from 'express';
import { protect, authorize } from '../middleware/auth';
import BadgeController from '../controllers/BadgeController';
import { body, param } from 'express-validator';
import { cacheRoute } from '../middleware/cache';

const router = express.Router();

// Public routes. The badge catalog changes rarely but is read on nearly every
// page load, so cache it for 5 minutes (writes below invalidate it immediately).
router.get('/', cacheRoute(300), BadgeController.getBadges);
router.get('/category/:category', cacheRoute(300), BadgeController.getBadgesByCategory);
router.get('/rarity/:rarity', cacheRoute(300), BadgeController.getBadgesByRarity);
router.get('/:id', cacheRoute(300), BadgeController.getBadgeById);

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