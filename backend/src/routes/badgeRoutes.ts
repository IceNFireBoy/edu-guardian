import express from 'express';
import BadgeController from '../controllers/BadgeController';
import { protect, authorize } from '../middleware/auth';
import { body, param } from 'express-validator';

const router = express.Router();
const badgeController = new BadgeController();

// Public routes for badges
router.get('/', badgeController.getBadges);
router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid Badge ID')
], badgeController.getBadgeById);
router.get('/category/:categoryName', badgeController.getBadgesByCategory);
router.get('/rarity/:rarityLevel', badgeController.getBadgesByRarity);

// Admin routes for managing badges
router.post('/', protect, authorize('admin'), [
    body('name').notEmpty().withMessage('Badge name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('icon').notEmpty().withMessage('Icon is required'),
    body('criteria.description').notEmpty().withMessage('Criteria description is required'),
    // Add more validation for badge fields (category, rarity, xpAward, etc.)
], badgeController.createBadge);

router.put('/:id', protect, authorize('admin'), [
    param('id').isMongoId().withMessage('Invalid Badge ID'),
    // Add more validation for update fields
], badgeController.updateBadge);

router.delete('/:id', protect, authorize('admin'), [
    param('id').isMongoId().withMessage('Invalid Badge ID')
], badgeController.deleteBadge);

router.post('/:badgeId/award/:userId', protect, authorize('admin'), [
    param('badgeId').isMongoId().withMessage('Invalid Badge ID'),
    param('userId').isMongoId().withMessage('Invalid User ID')
], badgeController.awardBadgeToUser);

// Route for system/user to check and award badges based on events
router.post('/check-eligibility', protect, badgeController.checkAndAwardBadges);

export default router; 