const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// All booking routes are protected
router.use(authMiddleware);

// User routes
router.post('/', bookingController.createBooking);
router.get('/user', bookingController.getUserBookings);
router.patch('/:id/cancel', bookingController.cancelBooking);

// Operator routes
router.get('/operator', bookingController.getOperatorBookings);
router.patch('/:id', bookingController.updateBookingStatus);

module.exports = router;