import express from 'express';
import UserController from '../controllers/UserController';
import UserActivityFeedController from '../controllers/UserActivityFeedController';
import { protect, authorize } from '../middleware/auth';
import { body, param } from 'express-validator'; // For potential future validation

const router = express.Router();
const userActivityFeedController = new UserActivityFeedController();
const userController = new UserController();

// Public routes
router.get('/leaderboard', UserController.getLeaderboard);
router.get('/:username/profile', UserController.getUserPublicProfile);
router.get('/me/badges', protect, UserController.getMyBadges);
router.get('/:userId/badges', UserController.getUserBadgesById);

// Protected routes
router.get('/me', protect, UserController.getMe);
router.put('/me', protect, UserController.updateDetails);
router.put('/me/password', protect, UserController.updatePassword);
router.get('/me/activity', protect, UserController.getMyActivityLog);
router.get('/me/notes', protect, UserController.getMyUploadedNotes);
router.get('/me/favorites', protect, UserController.getMyFavoriteNotes);

router.post(
  '/me/favorites/:noteId',
  protect,
  UserController.addNoteToFavorites
);

router.delete(
  '/me/favorites/:noteId',
  protect,
  UserController.removeNoteFromFavorites
);

// Activity feed routes
router.get('/feed', protect, UserActivityFeedController.getUserFeed);
router.post('/check-badges', protect, UserActivityFeedController.checkAndAwardBadges);
router.post('/study-complete', protect, UserActivityFeedController.logStudyCompletion);

// Admin routes
router.use(protect, authorize('admin'));
router.route('/')
  .get(UserController.getUsers)
  .post(UserController.createUser);

router.route('/:id')
  .get(UserController.getUserById)
  .put(UserController.updateUser)
  .delete(UserController.deleteUser);

export default router; 