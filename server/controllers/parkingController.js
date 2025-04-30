const Parking = require('../models/Parking');

// Get all parking spaces with filters
exports.getAllParkings = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'lat', 'lng', 'distance'];
    excludedFields.forEach(el => delete queryObj[el]);

    console.log('Getting all parkings with query:', queryObj);

    // Filter by location if coordinates provided
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const distance = parseFloat(req.query.distance) || 5; // Default 5km radius

      console.log(`Searching for parking lots within ${distance}km of [${lat}, ${lng}]`);

      // Convert distance to radians (divide by Earth's radius in km)
      const radius = distance / 6378.1;

      queryObj.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius]
        }
      };

      console.log('Geospatial query:', JSON.stringify(queryObj.location));
    } else {
      console.log('No location parameters provided, returning all parking lots');
    }

    let query = Parking.find(queryObj);

    // Sorting
    if (req.query.sort) {
      query = query.sort(req.query.sort);
    }

    // Execute query
    const parkings = await query;
    console.log(`Found ${parkings.length} parking lots`);

    // Log coordinates for debugging
    parkings.forEach(parking => {
      if (parking.location && parking.location.coordinates) {
        console.log(`Parking ${parking.name} coordinates:`, parking.location.coordinates);
      }
    });

    res.status(200).json({
      status: 'success',
      results: parkings.length,
      data: {
        parkings
      }
    });
  } catch (err) {
    console.error('Error in getAllParkings:', err);
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
    console.log('Creating parking space with data:', req.body);
    console.log('User info:', req.user);
    
    // Set operator as current user
    req.body.operator = req.user.id;
    
    // Enhanced role detection
    let effectiveRole = req.user.role;
    
    // For backward compatibility and better role detection
    if (req.originalUrl && (req.originalUrl.includes('/operators') || req.originalUrl.includes('/operator'))) {
      console.log('URL indicates operator role');
      effectiveRole = 'operator';
    } else if (req.originalUrl && req.originalUrl.includes('/residential')) {
      console.log('URL indicates residential role');
      effectiveRole = 'residential';
    }
    
    console.log('Effective user role:', effectiveRole);
    
    // Additional role checking - allow any role containing "operator" text
    const isOperator = 
      effectiveRole === 'operator' || 
      (typeof effectiveRole === 'string' && effectiveRole.toLowerCase().includes('operator'));
    
    const isResidential = 
      effectiveRole === 'residential' || 
      (typeof effectiveRole === 'string' && effectiveRole.toLowerCase().includes('resident'));
    
    // Role-based parking type validation with improved detection
    if (isOperator) {
      // Operators can only create government or private parking spaces
      if (req.body.type === 'residential') {
        console.log('Operator attempting to create residential parking, changing to private');
        req.body.type = 'private';
      }
      
      // Ensure type is set - default to 'private' if not provided
      if (!req.body.type || !['government', 'private'].includes(req.body.type)) {
        req.body.type = 'private';
        console.log('Setting default type to "private" for operator');
      }
    } else if (isResidential) {
      // Force type to be residential regardless of what was sent
      req.body.type = 'residential';
      console.log('Setting type to "residential" for residential user');
    } else {
      // Regular users cannot create parking spaces
      console.log('Unauthorized role detected:', effectiveRole);
      return res.status(403).json({
        status: 'fail',
        message: 'Only operators and residential users can create parking spaces'
      });
    }
    
    // Ensure availableSpots matches totalSpots if not set
    if (req.body.totalSpots && req.body.availableSpots === undefined) {
      req.body.availableSpots = req.body.totalSpots;
      console.log('Setting availableSpots to match totalSpots:', req.body.totalSpots);
    }
    
    console.log('Final parking data to be created:', {
      operator: req.body.operator,
      type: req.body.type
    });
    
    const newParking = await Parking.create(req.body);
    console.log('Parking space created successfully with ID:', newParking._id);

    res.status(201).json({
      status: 'success',
      data: {
        parking: newParking
      }
    });
  } catch (err) {
    console.error('Error creating parking space:', err);
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

    // Use findByIdAndDelete instead of remove()
    await Parking.findByIdAndDelete(req.params.id);

    // Return a proper JSON response with status 200 instead of 204
    // Status 204 doesn't allow response body which can cause JSON parsing issues
    return res.status(200).json({
      status: 'success',
      message: 'Parking space deleted successfully',
      data: null
    });
  } catch (err) {
    console.error('Error deleting parking space:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};