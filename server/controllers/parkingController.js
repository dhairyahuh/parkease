const Parking = require('../models/Parking');

// Get all parking spaces with filters
exports.getAllParkings = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Filter by location if coordinates provided
    if (req.query.lat && req.query.lng && req.query.distance) {
      const radius = req.query.distance / 6378.1; // Convert distance to radians
      queryObj.location = {
        $geoWithin: {
          $centerSphere: [[req.query.lng, req.query.lat], radius]
        }
      };
    }

    let query = Parking.find(queryObj);

    // Sorting
    if (req.query.sort) {
      query = query.sort(req.query.sort);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const parkings = await query;

    res.status(200).json({
      status: 'success',
      results: parkings.length,
      data: {
        parkings
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get single parking space
exports.getParking = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id)
      .populate('operator')
      .populate('bookings');

    if (!parking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parking space not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        parking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Create new parking space
exports.createParking = async (req, res) => {
  try {
    // Set operator as current user
    req.body.operator = req.user.id;
    
    const newParking = await Parking.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        parking: newParking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update parking space
exports.updateParking = async (req, res) => {
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
        message: 'You are not authorized to update this parking space'
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

// Update parking space availability
exports.updateAvailability = async (req, res) => {
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
        message: 'You are not authorized to update availability'
      });
    }

    parking.availableSpots = req.body.availableSpots;
    await parking.save();

    res.status(200).json({
      status: 'success',
      data: {
        parking
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete parking space
exports.deleteParking = async (req, res) => {
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

    await parking.remove();

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