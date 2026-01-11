const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Exercise = require('../models/Exercise');
const auth = require('../middleware/auth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', [
  query('type').optional().isString().trim(),
  query('muscle').optional().isString().trim(),
  query('search').optional().isString().trim(),
  validateRequest
], async (req, res) => {
  try {
    const { type, muscle, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (muscle) filter.muscleGroups = { $in: [muscle] };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const exercises = await Exercise.find(filter).limit(100);
    res.json(exercises);
  } catch (err) {
    console.error('Get exercises error:', err);
    res.status(500).send('Server error');
  }
});

// Get exercise by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid exercise ID'),
  validateRequest
], async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.status(500).send('Server error');
  }
});

router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Exercise name is required'),
  body('type').isIn(['strength', 'cardio', 'flexibility', 'balance']).withMessage('Invalid exercise type'),
  body('muscleGroups').isArray({ min: 1 }).withMessage('At least one muscle group required'),
  body('instructions').optional().isString().isLength({ max: 1000 }).withMessage('Instructions too long'),
  validateRequest
], async (req, res) => {
  try {
    const { name, type, muscleGroups, instructions } = req.body;

    const exercise = new Exercise({ name, type, muscleGroups, instructions });
    await exercise.save();

    res.status(201).json(exercise);
  } catch (err) {
    console.error('Create exercise error:', err);
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid exercise ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('type').optional().isIn(['strength', 'cardio', 'flexibility', 'balance']).withMessage('Invalid exercise type'),
  body('muscleGroups').optional().isArray({ min: 1 }).withMessage('At least one muscle group required'),
  validateRequest
], async (req, res) => {
  try {
    let exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }

    const { name, type, muscleGroups, instructions } = req.body;
    if (name !== undefined) exercise.name = name;
    if (type !== undefined) exercise.type = type;
    if (muscleGroups !== undefined) exercise.muscleGroups = muscleGroups;
    if (instructions !== undefined) exercise.instructions = instructions;

    await exercise.save();
    res.json(exercise);
  } catch (err) {
    console.error('Update exercise error:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid exercise ID'),
  validateRequest
], async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);

    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }

    res.json({ msg: 'Exercise removed' });
  } catch (err) {
    console.error('Delete exercise error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
