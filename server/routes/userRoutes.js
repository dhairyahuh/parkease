const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.use(userController.protect); // Apply protection to all routes below

router.get('/profile', userController.getProfile);

module.exports = router;