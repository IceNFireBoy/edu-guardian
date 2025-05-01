const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateProfile);

module.exports = router; 