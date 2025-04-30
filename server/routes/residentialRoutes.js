const express = require('express');
const router = express.Router();
const residentialController = require('../controllers/residentialController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes after this middleware
router.use(authMiddleware);

// Routes for residential parking spaces
router.route('/parking-spaces')
  .get(residentialController.getResidentialParkingSpaces)
  .post(residentialController.createResidentialParking);

router.route('/parking-spaces/:id')
  .put(residentialController.updateResidentialParking)
  .delete(residentialController.deleteResidentialParking);

router.patch('/parking-spaces/:id/availability', residentialController.updateResidentialAvailability);

// Routes for residential bookings
router.get('/bookings', residentialController.getResidentialBookings);
router.patch('/bookings/:id/status', residentialController.updateResidentialBookingStatus);

// Route for analytics
router.get('/analytics', residentialController.getResidentialAnalytics);

module.exports = router;