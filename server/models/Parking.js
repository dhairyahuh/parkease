const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide parking space name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['government', 'private', 'residential'],
    required: true
  },
  operator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  totalSpots: {
    type: Number,
    required: true
  },
  availableSpots: {
    type: Number,
    required: true
  },
  pricePerHour: {
    type: Number,
    required: true
  },
  features: [{
    type: String,
    enum: ['covered', 'security', 'charging', 'disabled', '24/7']
  }],
  operatingHours: {
    open: String,
    close: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  bookings: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Booking'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
parkingSchema.index({ location: '2dsphere' });

const Parking = mongoose.model('Parking', parkingSchema);

module.exports = Parking;