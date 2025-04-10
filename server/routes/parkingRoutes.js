const express = require('express');
const parkingController = require('../controllers/parkingController');
const userController = require('../controllers/userController');
const router = express.Router();

// Public routes
router.get('/', parkingController.getAllParkings);
router.get('/:id', parkingController.getParking);

// Protected routes
router.use(userController.protect);

// Operator routes
router.post('/',
  userController.restrictTo('operator', 'residential'),
  parkingController.createParking
);

router.patch('/:id',
  userController.restrictTo('operator', 'residential'),
  parkingController.updateParking
);

router.patch('/:id/availability',
  userController.restrictTo('operator', 'residential'),
  parkingController.updateAvailability
);

router.delete('/:id',
  userController.restrictTo('operator', 'residential'),
  parkingController.deleteParking
);

module.exports = router;