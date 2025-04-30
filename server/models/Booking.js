const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  parking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Parking',
    required: [true, 'Booking must be for a parking space']
  },
  startTime: {
    type: Date,
    required: [true, 'Please specify start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please specify end time']
  },
  duration: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  vehicleDetails: {
    plateNumber: {
      type: String,
      default: 'Unknown'
    },
    vehicleType: {
      type: String,
      enum: ['car', 'motorcycle', 'truck', 'ev'],
      default: 'car'
    }
  },
  comment: {
    type: String,
    default: ''
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate duration before saving
bookingSchema.pre('save', function(next) {
  this.duration = Math.ceil((this.endTime - this.startTime) / (1000 * 60 * 60)); // Duration in hours
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;