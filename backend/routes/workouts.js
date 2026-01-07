const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Workout = require('../models/Workout');
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
    const skip = parseInt(req.query.skip) || 0;
    
    const workouts = await Workout.find({ user: req.user.id })
      .populate('exercises.exercise')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Workout.countDocuments({ user: req.user.id });
    
    res.json({ workouts, total, limit, skip });
  } catch (err) {
    console.error('Get workouts error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/', auth, [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('exercises').optional().isArray().withMessage('Exercises must be an array'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  validateRequest
], async (req, res) => {
  try {
    const { date, exercises, notes } = req.body;
    
    const workout = new Workout({ 
      user: req.user.id, 
      date: date || new Date(),
      exercises: exercises || [],
      notes: notes || ''
    });
    
    await workout.save();
    await workout.populate('exercises.exercise');
    
    res.status(201).json(workout);
  } catch (err) {
    console.error('Create workout error:', err);
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid workout ID'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('exercises').optional().isArray().withMessage('Exercises must be an array'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  validateRequest
], async (req, res) => {
  try {
    let workout = await Workout.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!workout) {
      return res.status(404).json({ msg: 'Workout not found' });
    }

    const { date, exercises, notes } = req.body;
    if (date !== undefined) workout.date = date;
    if (exercises !== undefined) workout.exercises = exercises;
    if (notes !== undefined) workout.notes = notes;
    
    await workout.save();
    await workout.populate('exercises.exercise');
    
    res.json(workout);
  } catch (err) {
    console.error('Update workout error:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid workout ID'),
  validateRequest
], async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!workout) {
      return res.status(404).json({ msg: 'Workout not found' });
    }
    
    res.json({ msg: 'Workout removed' });
  } catch (err) {
    console.error('Delete workout error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
