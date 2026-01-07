const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
  const refreshToken = jwt.sign(
    { user: { id: userId } },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  return { accessToken, refreshToken };
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({ 
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({ 
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateRequest
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ msg: 'Refresh token required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production'
    );

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.user.id);

    res.json({ 
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(401).json({ msg: 'Invalid refresh token' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).send('Server error');
  }
});

router.put('/me', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('weight').optional().isFloat({ min: 20, max: 300 }).withMessage('Invalid weight'),
  body('height').optional().isFloat({ min: 100, max: 250 }).withMessage('Invalid height'),
  body('bodyFat').optional().isFloat({ min: 0, max: 60 }).withMessage('Invalid body fat percentage'),
  validateRequest
], async (req, res) => {
  try {
    const { name, email, weight, height, bodyFat } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (weight !== undefined && weight !== null) updateFields['profile.weight'] = weight;
    if (height !== undefined && height !== null) updateFields['profile.height'] = height;
    if (bodyFat !== undefined && bodyFat !== null) updateFields['profile.bodyFat'] = bodyFat;

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).send('Server error');
  }
});

router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/me', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ msg: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
