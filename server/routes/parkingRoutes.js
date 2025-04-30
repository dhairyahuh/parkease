const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes for accessing parking data
router.get('/', parkingController.getAllParkings);
router.get('/:id', parkingController.getParking);

// Protected routes for managing parking
router.use(authMiddleware);

// Routes for creating and managing parking
router.post('/', parkingController.createParking);
router.put('/:id', parkingController.updateParking);
router.delete('/:id', parkingController.deleteParking);
router.patch('/:id/availability', parkingController.updateAvailability);

module.exports = router;