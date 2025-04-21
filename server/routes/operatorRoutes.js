const express = require('express');
const operatorController = require('../controllers/operatorController');

const router = express.Router();

// Define routes
router.post('/register', operatorController.registerOperator);
router.post('/login', operatorController.loginOperator);
router.get('/profile', operatorController.getOperatorProfile);

module.exports = router;