const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const progress = await Progress.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(limit);
    res.json(progress);
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).send('Server error');
  }
});

router.post('/', auth, [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('weight').optional().isFloat({ min: 20, max: 300 }).withMessage('Invalid weight'),
  body('bodyFat').optional().isFloat({ min: 0, max: 60 }).withMessage('Invalid body fat'),
  validateRequest
], async (req, res) => {
  try {
    const { date, weight, bodyFat } = req.body;
    const progress = new Progress({ 
      user: req.user.id, 
      date: date || new Date(),
      metrics: { weight, bodyFat }
    });
    await progress.save();
    res.status(201).json(progress);
  } catch (err) {
    console.error('Error creating progress:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid progress ID'),
  validateRequest
], async (req, res) => {
  try {
    const progress = await Progress.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!progress) {
      return res.status(404).json({ msg: 'Progress not found' });
    }
    
    res.json({ msg: 'Progress removed' });
  } catch (err) {
    console.error('Error deleting progress:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
