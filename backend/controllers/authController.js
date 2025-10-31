const User = require('../models/User');
const Wallet = require('../models/Wallet'); // ← CRITICAL: Must import Wallet
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // ← ADD: For manual password hashing

// --- Helper function to generate JWT ---
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// --- Register User ---
exports.register = async (req, res) => {
  // 1. Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  const { username, email, password } = req.body;

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] }).session(session);
    
    if (user) {
      await session.abortTransaction();
      session.endSession();
      
      if (user.email === email) {
        return res.status(400).json({ 
          success: false, 
          message: 'An account with this email already exists.' 
        });
      }
      if (user.username === username) {
        return res.status(400).json({ 
          success: false, 
          message: 'This username is already taken.' 
        });
      }
    }

    // 3. ✅ FIX: Manually hash password BEFORE creating user
    // Pre-save hooks don't work reliably with MongoDB transactions
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new user with hashed password
    user = new User({
      username,
      email,
      password: hashedPassword, // ← Use hashed password!
      lastLoginIP: req.ip || req.connection.remoteAddress
    });

    await user.save({ session });

    // 5. Create wallet for the new user
    const newWallet = new Wallet({ 
      userId: user._id,
      balance: 0,
      currency: 'USD',
      isActive: true,
      isFrozen: false
    });
    
    await newWallet.save({ session });

    // 6. Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ User registered: ${user.username} | Wallet created: ${newWallet._id}`);

    // 7. Generate JWT token
    const token = generateToken(user._id);

    // 8. Send success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    
    console.error('Registration Error:', error.message);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `This ${field} is already registered.` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration.' 
    });
  }
};

// --- Login User ---
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    console.log(`✅ User logged in: ${user.username}`);

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wins: user.wins || 0,
        losses: user.losses || 0,
        winRate: user.winRate || 0
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// --- Get Current User ---
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {  // ← Changed from "user" to "data"
        id: user._id,
        username: user.username,
        email: user.email,
        wins: user.wins || 0,
        losses: user.losses || 0,
        winRate: user.winRate || 0,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get Me Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// --- Logout User ---
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      lastActive: Date.now()
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};