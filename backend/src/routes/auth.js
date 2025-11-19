import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../services/emailService.js';
import { sendOTPSMS } from '../services/smsService.js';

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enhanced Registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, phone, password, confirmPassword } = req.body;

    if (!fullName || !username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format. Use +91XXXXXXXXXX' });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }, { phone }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const user = await User.create({
      fullName,
      username,
      email,
      phone,
      password,
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql,
      original: error.original
    });
    
    // Return specific error message
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ error: `Validation error: ${validationErrors.join(', ')}` });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email, username, or phone already exists' });
    }
    
    res.status(500).json({ error: `Registration failed: ${error.message}` });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier, type } = req.body;

    if (!identifier || !type) {
      return res.status(400).json({ error: 'Identifier and type are required' });
    }

    const whereClause = type === 'email' ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ error: `No account found with this ${type}` });
    }

    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'production') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOTPs = await OTP.count({
        where: {
          identifier,
          type,
          createdAt: { [Op.gte]: oneHourAgo }
        }
      });

      if (recentOTPs >= 3) {
        return res.status(429).json({ error: 'Too many OTP requests. Try again later.' });
      }
    }

    const otpCode = generateOTP();
    const otpHash = await bcrypt.hash(otpCode, 10);

    await OTP.create({
      identifier,
      type,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send OTP via email or SMS
    if (type === 'email') {
      await sendOTPEmail(identifier, otpCode);
    } else {
      await sendOTPSMS(identifier, otpCode);
    }
    
    res.json({
      message: `OTP sent to your ${type}`,
      identifier: type === 'email' ? identifier : identifier.replace(/(\+91)(\d{2})(\d{4})(\d{4})/, '$1XX$3XXXX')
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, type, otp } = req.body;

    if (!identifier || !type || !otp) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const otpRecord = await OTP.findOne({
      where: {
        identifier,
        type,
        isUsed: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ error: 'Too many failed attempts' });
    }

    const isValidOTP = await otpRecord.compareOTP(otp);

    if (!isValidOTP) {
      await otpRecord.increment('attempts');
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await otpRecord.update({ isUsed: true });

    const resetToken = jwt.sign(
      { identifier, type, otpId: otpRecord.id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const { identifier, type } = decoded;

    const whereClause = type === 'email' ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ password: newPassword });

    await OTP.destroy({
      where: {
        identifier,
        type,
        isUsed: true
      }
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ 
        error: "You don't have an account. Please sign up first.",
        needsSignup: true 
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = generateToken(user.id);

    res.json({
      message: `Welcome back, ${user.fullName}!`,
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user preferences
router.patch('/preferences', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.preferences = { ...user.preferences, ...req.body };
    await user.save();

    res.json({ 
      message: 'Preferences updated',
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;