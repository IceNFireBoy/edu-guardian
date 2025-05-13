import express from 'express';
import UserController from '../controllers/UserController';
import { protect, authorize } from '../middleware/auth';
import { body, param } from 'express-validator'; // For potential future validation
import UserActivityFeedController from '../controllers/UserActivityFeedController';

const router = express.Router();
const userController = new UserController();

// Public routes
router.get('/leaderboard', userController.getLeaderboard);
router.get('/:username/profile', userController.getUserPublicProfile); // New route for public profiles
router.get('/:userId/badges', userController.getUserBadgesById); // Publicly viewable badges for a user

// Authenticated user routes (เกี่ยวกับ "me")
router.get('/me/badges', protect, userController.getMyBadges);
router.get('/me/activity', protect, userController.getMyActivityLog);
router.get('/me/notes', protect, userController.getMyUploadedNotes);
router.get('/me/favorites', protect, userController.getMyFavoriteNotes);
router.post('/me/favorites/:noteId', protect, [
    param('noteId').isMongoId().withMessage('Invalid Note ID')
], userController.addNoteToFavorites);
router.delete('/me/favorites/:noteId', protect, [
    param('noteId').isMongoId().withMessage('Invalid Note ID')
], userController.removeNoteFromFavorites);

// Activity feed routes
router.get('/feed', UserActivityFeedController.getUserFeed);
router.post('/check-badges', UserActivityFeedController.checkAndAwardBadges);
router.post('/study-complete', UserActivityFeedController.logStudyCompletion);

// Admin only routes for managing all users
router.route('/')
    .get(protect, authorize('admin'), userController.getUsers)
    .post(protect, authorize('admin'), [
        // Add validation for createUser if needed
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('username').notEmpty().withMessage('Username is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ], userController.createUser);

router.route('/:id')
    .get(protect, authorize('admin'), [
        param('id').isMongoId().withMessage('Invalid User ID')
    ], userController.getUserById)
    .put(protect, authorize('admin'), [
        param('id').isMongoId().withMessage('Invalid User ID'),
        // Add validation for updateUser if needed
        body('email').optional().isEmail().withMessage('Please provide a valid email'),
        body('username').optional().notEmpty().withMessage('Username cannot be empty')
    ], userController.updateUser)
    .delete(protect, authorize('admin'), [
        param('id').isMongoId().withMessage('Invalid User ID')
    ], userController.deleteUser);

export default router; 