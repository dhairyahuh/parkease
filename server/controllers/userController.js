const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn
  });
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // Use TLS - true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug output in development
  logger: process.env.NODE_ENV === 'development', // Log to console in development
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
  }
});

// Send password reset email
const sendPasswordResetEmail = async (user, resetURL) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'ParkEase - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Reset Your ParkEase Password</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password for your ParkEase account. Please click the button below to set a new password:</p>
        <p style="text-align: center;">
          <a href="${resetURL}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </p>
        <p>This link will expire in 10 minutes for security reasons.</p>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        <p>Thank you,<br>The ParkEase Team</p>
      </div>
    `
  };

  // Check if we're in development mode with email sending disabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAILS === 'true') {
    console.log('Email sending disabled in development mode');
    console.log('Reset URL:', resetURL);
    console.log('Email would have been sent to:', user.email);
    return; // Skip actual email sending
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    // Check if user already exists with the same email and role
    const existingUser = await User.findOne({
      email: req.body.email,
      role: req.body.role
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: `You're already registered as a ${req.body.role} with this email`
      });
    }

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'user'
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if email, password, and role exist
    if (!email || !password || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email, password and select an account type'
      });
    }

    // Find user with the specific email and role
    const user = await User.findOne({ 
      email,
      role 
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email, password, or account type'
      });
    }

    // Generate token
    const token = signToken(user._id);
    
    res.status(200).json({
      status: 'success',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Protect route middleware
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'User no longer exists'
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token'
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookings');
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Fields that are allowed to be updated
    const allowedFields = ['name', 'vehicleNumber', 'vehicleType'];
    
    // Filter out fields that are not allowed to be updated
    const filteredBody = {};
    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        filteredBody[field] = req.body[field];
      }
    });

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Test route for forgot password
exports.testForgotPassword = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Forgot password test route is working!'
  });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    // 1) Get user based on email
    const users = await User.find({ email: req.body.email });
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address'
      });
    }

    // 2) Generate random reset token for each user account with that email
    // (A user might have multiple accounts with different roles)
    for (const user of users) {
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // 3) Send it to user's email
      try {
        // Use a fixed client URL instead of relying on request headers
        const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetURL = `${clientURL}/reset-password?token=${resetToken}`;
        
        // Log the reset URL regardless of email sending status
        console.log('================ PASSWORD RESET ================');
        console.log('Reset token for user:', user.email);
        console.log('Reset URL:', resetURL);
        console.log('=================================================');
        
        await sendPasswordResetEmail(user, resetURL);

        res.status(200).json({
          status: 'success',
          message: process.env.DISABLE_EMAILS === 'true' 
            ? 'Password reset token generated! Check server console for the reset URL.' 
            : 'Password reset token sent to email!'
        });
      } catch (err) {
        // If there's an error sending email, clean up the tokens
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        console.error('Error in forgot password:', err);

        return res.status(500).json({
          status: 'error',
          message: 'There was an error sending the email. Please try again later!'
        });
      }
    }
  } catch (err) {
    console.error('General error in forgot password:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user (handled by middleware)

    // 4) Log the user in, send JWT
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      message: 'Password successfully reset'
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};