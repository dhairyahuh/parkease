const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes after this middleware
router.use(authMiddleware);

// Operator registration and login
router.post('/register', operatorController.registerOperator);
router.post('/login', operatorController.loginOperator);

// Operator profile
router.get('/profile', operatorController.getOperatorProfile);
router.patch('/profile', operatorController.updateOperatorProfile);

// Operator parking lots
router.get('/lots', operatorController.getOperatorLots);

// Operator bookings
router.get('/bookings', operatorController.getOperatorBookings);

// Operator analytics
router.get('/analytics', operatorController.getOperatorAnalytics);

module.exports = router;