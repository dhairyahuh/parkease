const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/test-forgot-password', userController.testForgotPassword); // Test route

// Protected routes
router.use(authMiddleware); // Use our standalone middleware instead

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile); // New route for updating profile

module.exports = router;