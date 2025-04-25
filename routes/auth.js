const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// @route   POST api/auth/send-otp
// @desc    Send OTP to user's phone
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ msg: 'Phone number is required' });
    }

    // Validate phone number format (simple validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ msg: 'Please enter a valid 10-digit phone number' });
    }

    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        // Check if user exists
        let user = await User.findOne({ phone });

        // If user doesn't exist, create a new user
        if (!user) {
          user = new User({
            phone
          });
          await user.save();
        }
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Continue without database operations
      }
    }

    // In a real application, you would generate and send an OTP to the user's phone
    // For this example, we're using a hardcoded OTP (1212)
    
    return res.json({
      msg: 'OTP sent successfully',
      phone
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and return JWT token
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ msg: 'Phone number and OTP are required' });
    }

    // Validate phone number format (simple validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ msg: 'Please enter a valid 10-digit phone number' });
    }

    let user;
    
    // Check if MongoDB is connected
    if (global.isMongoDBConnected) {
      try {
        // Check if user exists
        user = await User.findOne({ phone });
        if (!user) {
          // For testing without DB, create a mock user
          user = { id: 'mock-user-id', phone };
        }
      } catch (dbError) {
        console.warn('Database operation failed:', dbError.message);
        // Create a mock user for testing
        user = { id: 'mock-user-id', phone };
      }
    } else {
      // Create a mock user for testing
      user = { id: 'mock-user-id', phone };
    }

    // Verify OTP (hardcoded as 1212)
    if (otp !== '1212') {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    // Create and return JWT token
    const payload = {
      user: {
        id: user.id || 'mock-user-id',
        phone: user.phone
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;