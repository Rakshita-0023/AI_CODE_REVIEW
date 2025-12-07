import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import OAuthAccount from '../models/OAuthAccount.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../services/emailService.js';
import { sendOTPSMS } from '../services/smsService.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enhanced Registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate username from email
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

    const user = await User.create({
      fullName,
      username,
      email,
      password,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
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

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: `Welcome back, ${user.fullName}!`,
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    // Handle OAuth callback logic here
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?error=oauth_failed`);
  }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ where: { email } });
    let oauthAccount = await OAuthAccount.findOne({
      where: { provider: 'google', providerId: googleId },
    });

    if (!user) {
      // Create new user
      user = await User.create({
        fullName: name,
        username: email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
      });
    }

    if (!oauthAccount) {
      // Link OAuth account
      oauthAccount = await OAuthAccount.create({
        userId: user.id,
        provider: 'google',
        providerId: googleId,
        email,
        name,
        avatar: picture,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: `Welcome, ${user.fullName}!`,
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not provided' });
    }

    const tokenRecord = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ model: User }],
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(tokenRecord.userId);

    res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token: refreshToken } }
      );
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
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