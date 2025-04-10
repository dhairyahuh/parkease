const Booking = require('../models/Booking');
const Parking = require('../models/Parking');

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    // Check parking availability
    const parking = await Parking.findById(req.body.parking);
    if (!parking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parking space not found'
      });
    }

    if (parking.availableSpots <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No available spots'
      });
    }

    // Calculate total price
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    const duration = Math.ceil((endTime - startTime) / (1000 * 60 * 60)); // Duration in hours
    const totalPrice = duration * parking.pricePerHour;

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      parking: req.body.parking,
      startTime,
      endTime,
      duration,
      totalPrice,
      vehicleDetails: req.body.vehicleDetails
    });

    // Update parking availability
    parking.availableSpots -= 1;
    parking.bookings.push(booking._id);
    await parking.save();

    res.status(201).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('parking')
      .sort('-startTime');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get operator's parking space bookings
exports.getOperatorBookings = async (req, res) => {
  try {
    const parkings = await Parking.find({ operator: req.user.id });
    const parkingIds = parkings.map(parking => parking._id);

    const bookings = await Booking.find({
      parking: { $in: parkingIds }
    })
      .populate('user')
      .populate('parking')
      .sort('-startTime');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }

    // Check authorization
    const parking = await Parking.findById(booking.parking);
    if (parking.operator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this booking'
      });
    }

    booking.status = req.body.status;
    await booking.save();

    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to cancel this booking'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Update parking availability
    const parking = await Parking.findById(booking.parking);
    parking.availableSpots += 1;
    await parking.save();

    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};