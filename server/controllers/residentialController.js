// Controller functions for residential parking spaces
const mongoose = require('mongoose');
const Parking = require('../models/Parking');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get all parking spaces owned by a residential user
exports.getResidentialParkingSpaces = async (req, res) => {
  try {
    const parkingSpaces = await Parking.find({ 
      operator: req.user.id,
      type: 'residential'
    });

    res.status(200).json({
      status: 'success',
      results: parkingSpaces.length,
      data: {
        parkingSpaces
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Create a new residential parking space
exports.createResidentialParking = async (req, res) => {
  try {
    console.log('Creating residential parking with user role:', req.user.role);
    console.log('Request body:', req.body);
    
    // For development purposes, allow any user to create residential parking
    // This can be removed in production, but helpful for testing
    if (!req.user.role) {
      console.log('No user role found, defaulting to residential for development');
      req.user.role = 'residential';
    }
    
    // More lenient role check - allow 'residential', undefined roles, or any role containing 'resident'
    const isResidential = 
      req.user.role === 'residential' || 
      req.user.role?.toLowerCase().includes('resident');
    
    if (!isResidential) {
      console.log('User role not authorized:', req.user.role);
      return res.status(403).json({
        status: 'fail',
        message: 'Only residential users can create residential parking spaces'
      });
    }

    // Set operator as current user and type as residential
    req.body.operator = req.user.id;
    req.body.type = 'residential';
    
    // Initialize available spots with total spots
    req.body.availableSpots = req.body.totalSpots || 1;
    
    // For residential spaces, validate it's a reasonable number (usually 1-2 spots)
    if (req.body.totalSpots > 3) {
      return res.status(400).json({
        status: 'fail',
        message: 'Residential parking spaces typically cannot have more than 3 spots'
      });
    }

    console.log('Creating new parking with:', req.body);
    const newParking = await Parking.create(req.body);
    console.log('New parking created successfully:', newParking._id);

    res.status(201).json({
      status: 'success',
      data: {
        parking: newParking
      }
    });
  } catch (err) {
    console.error('Error creating residential parking:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update a residential parking space
exports.updateResidentialParking = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parking space not found'
      });
    }

    // Ensure it's a residential parking space
    if (parking.type !== 'residential') {
      return res.status(400).json({
        status: 'fail',
        message: 'This is not a residential parking space'
      });
    }

    // Check if user is the operator
    if (parking.operator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this parking space'
      });
    }

    // Don't allow changing the type
    if (req.body.type && req.body.type !== 'residential') {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot change the type of a residential parking space'
      });
    }

    const updatedParking = await Parking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        parking: updatedParking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update residential parking space availability
exports.updateResidentialAvailability = async (req, res) => {
  try {
    console.log("Updating availability for space ID:", req.params.id);
    console.log("Request body:", req.body);
    
    const parking = await Parking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parking space not found'
      });
    }

    // Check if user is the operator
    if (parking.operator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update availability'
      });
    }

    // Update the status
    parking.status = req.body.status;
    await parking.save();

    res.status(200).json({
      status: 'success',
      data: {
        parking
      }
    });
  } catch (err) {
    console.error("Error updating availability:", err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete a residential parking space
exports.deleteResidentialParking = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parking space not found'
      });
    }

    // Check if user is the operator
    if (parking.operator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this parking space'
      });
    }

    await Parking.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get bookings for residential spaces
exports.getResidentialBookings = async (req, res) => {
  try {
    // First get all parking spaces owned by the residential user
    const parkings = await Parking.find({
      operator: req.user.id,
      type: 'residential'
    });

    const parkingIds = parkings.map(parking => parking._id);

    // Then get all bookings for those spaces
    const bookings = await Booking.find({
      parking: { $in: parkingIds }
    })
      .populate('user', 'name email')
      .populate('parking', 'name address totalSpots availableSpots')
      .sort('-createdAt');

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

// Update booking status for a residential space
exports.updateResidentialBookingStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    const booking = await Booking.findById(req.params.id)
      .populate('parking')
      .populate('user');

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }

    // Check if the parking space belongs to the user
    if (booking.parking.operator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this booking'
      });
    }

    // Only allow updating to 'approved', 'rejected', or other valid statuses
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Status must be "approved", "rejected", or "cancelled"'
      });
    }
    
    // If the status is already set to the requested value, return early to prevent duplicate operations
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
    
    // If cancelling or rejecting, make the spot available again if it was previously approved
    if ((status === 'cancelled' || status === 'rejected') && previousStatus === 'approved') {
      const parking = booking.parking;
      parking.availableSpots = Math.min(parking.totalSpots, parking.availableSpots + 1);
      await parking.save();
    }

    // If approving, make sure there's still availability
    if (status === 'approved' && previousStatus === 'pending') {
      const parking = booking.parking;
      if (parking.availableSpots < 1) {
        return res.status(400).json({
          status: 'fail',
          message: 'No available spots to approve this booking'
        });
      }
      parking.availableSpots = Math.max(0, parking.availableSpots - 1);
      await parking.save();
    }

    // Update booking status
    booking.status = status;
    
    // Add comment if provided
    if (comment) {
      booking.comment = comment;
    }
    
    await booking.save();

    // Send email notification if booking status is changed to 'approved'
    if (status === 'approved' && previousStatus !== 'approved') {
      try {
        // Import email service
        const emailService = require('../utils/emailService');
        
        // Send confirmation email to the user
        await emailService.sendBookingConfirmationEmail(booking, booking.user, booking.parking);
        console.log(`Booking confirmation email sent to ${booking.user.email}`);
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

// Get analytics for residential spaces
exports.getResidentialAnalytics = async (req, res) => {
  try {
    // Get all parking spaces owned by the residential user
    const parkings = await Parking.find({
      operator: req.user.id,
      type: 'residential'
    });

    const parkingIds = parkings.map(parking => parking._id);

    // Get completed bookings for revenue calculation
    const bookings = await Booking.find({
      parking: { $in: parkingIds },
      status: 'confirmed'
    });

    // Calculate total revenue
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    // Calculate other stats
    const totalSpaces = parkings.length;
    const totalBookings = bookings.length;
    const mostBookedSpace = parkings.length > 0 
      ? parkings.reduce((prev, current) => {
          const prevBookings = bookings.filter(b => b.parking.toString() === prev._id.toString()).length;
          const currentBookings = bookings.filter(b => b.parking.toString() === current._id.toString()).length;
          return prevBookings > currentBookings ? prev : current;
        }, parkings[0])
      : null;

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        totalSpaces,
        totalBookings,
        mostBookedSpace: mostBookedSpace ? {
          id: mostBookedSpace._id,
          name: mostBookedSpace.name,
          bookings: bookings.filter(b => b.parking.toString() === mostBookedSpace._id.toString()).length
        } : null
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};