const express = require('express');
const bookingController = require('../controllers/bookingController');
const userController = require('../controllers/userController');
const router = express.Router();

// All routes are protected
router.use(userController.protect);

// User routes
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.patch('/:id/cancel', bookingController.cancelBooking);

// Operator routes
router.get('/operator-bookings',
  userController.restrictTo('operator', 'residential'),
  bookingController.getOperatorBookings
);

router.patch('/:id/status',
  userController.restrictTo('operator', 'residential'),
  bookingController.updateBookingStatus
);

module.exports = router;