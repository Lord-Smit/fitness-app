const express = require('express');
const { param, body, validationResult } = require('express-validator');
const UserProgram = require('../models/UserProgram');
const Program = require('../models/Program');
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
    const userPrograms = await UserProgram.find({ user: req.user.id })
      .populate('program', 'name difficulty type daysPerWeek durationWeeks image')
      .sort({ startDate: -1 })
      .limit(50);
    
    res.json(userPrograms);
  } catch (err) {
    console.error('Error fetching user programs:', err);
    res.status(500).send('Server error');
  }
});

router.get('/active', auth, async (req, res) => {
  try {
    const activeProgram = await UserProgram.findOne({
      user: req.user.id,
      isCompleted: false
    }).populate('program');
    
    if (!activeProgram) {
      return res.json(null);
    }
    
    res.json(activeProgram);
  } catch (err) {
    console.error('Error fetching active program:', err);
    res.status(500).send('Server error');
  }
});

router.post('/start', auth, [
  body('programId').isMongoId().withMessage('Invalid program ID'),
  validateRequest
], async (req, res) => {
  try {
    const { programId } = req.body;
    
    const existingProgram = await UserProgram.findOne({
      user: req.user.id,
      isCompleted: false
    });
    
    if (existingProgram) {
      return res.status(400).json({ 
        msg: 'You already have an active program. Complete or cancel it first.' 
      });
    }
    
    const program = await Program.findById(programId);
    
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (program.durationWeeks * 7));
    
    const userProgram = new UserProgram({
      user: req.user.id,
      program: programId,
      startDate,
      targetEndDate: endDate,
      currentDay: 1
    });
    
    await userProgram.save();
    
    const populated = await UserProgram.findById(userProgram._id)
      .populate('program', 'name difficulty type daysPerWeek durationWeeks days');
    
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error starting program:', err);
    res.status(500).send('Server error');
  }
});

router.post('/:id/complete-day', auth, [
  param('id').isMongoId().withMessage('Invalid program ID'),
  body('dayNumber').isInt({ min: 1 }).withMessage('Invalid day number'),
  body('skipped').optional().isBoolean().withMessage('Skipped must be boolean'),
  validateRequest
], async (req, res) => {
  try {
    const { dayNumber, skipped = false } = req.body;
    
    const userProgram = await UserProgram.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!userProgram) {
      return res.status(404).json({ msg: 'User program not found' });
    }
    
    if (userProgram.isCompleted) {
      return res.status(400).json({ msg: 'Program already completed' });
    }
    
    const alreadyCompleted = userProgram.completedDays.some(
      d => d.dayNumber === dayNumber
    );
    
    if (alreadyCompleted) {
      return res.status(400).json({ msg: 'Day already completed' });
    }
    
    userProgram.completedDays.push({
      dayNumber,
      completedAt: new Date(),
      skipped
    });
    
    const program = await Program.findById(userProgram.program);
    const totalDays = program?.days?.length || userProgram.targetEndDate;
    const completedCount = userProgram.completedDays.length;
    
    if (dayNumber === userProgram.currentDay) {
      userProgram.currentDay = Math.min(dayNumber + 1, totalDays || 999);
    }
    
    if (completedCount >= totalDays) {
      userProgram.isCompleted = true;
      userProgram.completedAt = new Date();
    }
    
    await userProgram.save();
    
    const updated = await UserProgram.findById(userProgram._id)
      .populate('program', 'name difficulty type daysPerWeek durationWeeks days');
    
    res.json(updated);
  } catch (err) {
    console.error('Error completing day:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid program ID'),
  validateRequest
], async (req, res) => {
  try {
    const userProgram = await UserProgram.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!userProgram) {
      return res.status(404).json({ msg: 'User program not found' });
    }
    
    res.json({ msg: 'Program cancelled' });
  } catch (err) {
    console.error('Error cancelling program:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
