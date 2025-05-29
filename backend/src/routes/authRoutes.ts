import express from 'express';
import AuthController from '../controllers/AuthController';
import { check, body } from 'express-validator';
import { protect } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('username').optional(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], authController.register);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

router.post('/logout', authController.logout);

router.get('/verify-email/:verificationtoken', authController.verifyEmail);
router.post(
  '/resend-verification',
  [check('email', 'Please provide a valid email').isEmail()],
  authController.resendVerificationEmail
);

// Protected routes
router.get('/me', protect, authController.getProfile);
router.put('/me', protect, [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('profileImage').optional(),
    body('biography').optional(),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
], authController.updateProfile);

router.put('/updatepassword', protect, [
    body('currentPassword', 'Current password is required').notEmpty(),
    body('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 })
], authController.updatePassword);

// Forgot and Reset Password Routes
router.post('/forgotpassword', [
    body('email', 'Please provide a valid email').isEmail()
], authController.forgotPassword);

router.put('/resetpassword/:resettoken', [
    body('password', 'New password must be 6 or more characters').isLength({ min: 6 })
], authController.resetPassword);

export default router; 