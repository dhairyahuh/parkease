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

    // Format vehicle details to match the updated schema
    let vehicleDetails = {
      plateNumber: 'Unknown',
      vehicleType: 'car'
    };

    if (req.body.vehicleDetails) {
      // Handle different possible formats from client
      if (req.body.vehicleDetails.number) {
        vehicleDetails.plateNumber = req.body.vehicleDetails.number;
      } else if (req.body.vehicleDetails.plateNumber) {
        vehicleDetails.plateNumber = req.body.vehicleDetails.plateNumber;
      }

      if (req.body.vehicleDetails.type) {
        vehicleDetails.vehicleType = req.body.vehicleDetails.type;
      } else if (req.body.vehicleDetails.vehicleType) {
        vehicleDetails.vehicleType = req.body.vehicleDetails.vehicleType;
      }
    }
    
    // Create booking with pending status
    const booking = await Booking.create({
      user: req.user.id,
      parking: req.body.parking,
      startTime,
      endTime,
      duration,
      totalPrice,
      vehicleDetails: vehicleDetails,
      status: 'pending' // Set initial status to pending for approval
    });

    // Add booking reference to parking
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
      .populate({
        path: 'parking',
        select: 'name location type pricePerHour features'
      })
      .sort('-startTime');

    // Format bookings with calculated duration
    const formattedBookings = bookings.map(booking => {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const durationHours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
      
      return {
        _id: booking._id,
        parking: booking.parking,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: durationHours,
        totalPrice: booking.totalPrice,
        status: booking.status,
        vehicleDetails: booking.vehicleDetails
      };
    });

    res.status(200).json({
      status: 'success',
      results: formattedBookings.length,
      data: {
        bookings: formattedBookings
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

// Update booking status (for operators and residential owners)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    // Validate status
    if (!['approved', 'rejected', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status value'
      });
    }
    
    // Find the booking and populate user and parking info for email notification
    const booking = await Booking.findById(req.params.id)
      .populate('user')
      .populate('parking');
    
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }
    
    // Verify that the operator owns the parking lot for this booking
    const parking = booking.parking;
    
    if (!parking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parking not found'
      });
    }
    
    // Check if the current user is the owner of the parking space
    if (parking.operator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this booking'
      });
    }
    
    // If the status is already what we're trying to update it to, return early to prevent duplicate operations
    if (booking.status === status) {
      return res.status(200).json({
        status: 'success',
        message: `Booking is already ${status}`,
        data: {
          booking
        }
      });
    }
    
    // Store previous status for comparison
    const previousStatus = booking.status;
    
    // Update booking status
    booking.status = status;
    
    // Add comment if provided
    if (comment) {
      booking.comment = comment;
    }
    
    // Set notification flag to mark that the user should be notified about this change
    booking.notificationSent = false;
    
    // Handle parking space availability based on status change
    if (status === 'approved' && previousStatus === 'pending') {
      // Reduce available spots only when a pending booking is approved
      parking.availableSpots = Math.max(0, parking.availableSpots - 1);
      await parking.save();
    } 
    else if ((status === 'rejected' || status === 'cancelled') && 
            (previousStatus === 'approved' || previousStatus === 'pending')) {
      // Only restore availability if it was previously approved
      if (previousStatus === 'approved') {
        parking.availableSpots = Math.min(parking.totalSpots, parking.availableSpots + 1);
        await parking.save();
      }
    }
    
    await booking.save();
    
    // Send email notification if booking status is changed to 'approved'
    if (status === 'approved' && previousStatus !== 'approved') {
      try {
        // Import email service
        const emailService = require('../utils/emailService');
        
        // Send confirmation email to the user
        await emailService.sendBookingConfirmationEmail(booking, booking.user, parking);
        console.log(`Booking confirmation email sent to ${booking.user.email}`);
        
        // Update notification flag
        booking.notificationSent = true;
        await booking.save();
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('Failed to send booking confirmation email:', emailError);
      }
    }
    
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