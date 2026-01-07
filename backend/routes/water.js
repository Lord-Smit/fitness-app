const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const WaterIntake = require('../models/WaterIntake');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

router.post('/', auth, [
  body('amount').isInt({ min: 1, max: 5000 }).withMessage('Amount must be between 1-5000ml'),
  body('unit').optional().isIn(['ml', 'oz']).withMessage('Invalid unit'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('note').optional().isString().trim().isLength({ max: 200 }).withMessage('Note too long'),
  validateRequest
], async (req, res) => {
  try {
    const { date, amount, unit, note } = req.body;
    const userId = req.user.id;
    
    const startOfDay = getStartOfDay(date ? new Date(date) : new Date());
    
    let waterIntake = await WaterIntake.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: getEndOfDay(startOfDay)
      }
    });

    if (!waterIntake) {
      waterIntake = new WaterIntake({
        user: userId,
        date: startOfDay,
        entries: [],
        dailyGoal: 2500
      });
    }

    waterIntake.entries.push({ amount, unit: unit || 'ml', note });
    waterIntake.totalAmount = waterIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    await waterIntake.save();
    res.status(201).json(waterIntake);
  } catch (err) {
    console.error('Error adding water intake:', err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/', auth, [
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest
], async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;
    
    const startOfDay = getStartOfDay(date ? new Date(date) : new Date());
    
    const waterIntake = await WaterIntake.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: getEndOfDay(startOfDay)
      }
    });

    if (!waterIntake) {
      return res.json({
        date: startOfDay,
        entries: [],
        dailyGoal: 2500,
        totalAmount: 0,
        percentComplete: 0
      });
    }

    res.json({
      ...waterIntake.toObject(),
      percentComplete: Math.round((waterIntake.totalAmount / waterIntake.dailyGoal) * 100)
    });
  } catch (err) {
    console.error('Error fetching water intake:', err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/week', auth, [
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest
], async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const waterIntakes = await WaterIntake.find({
      user: userId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    }).sort({ date: 1 });

    const weekData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const dayData = waterIntakes.find(w => {
        const wDate = new Date(w.date);
        wDate.setHours(0, 0, 0, 0);
        return wDate.getTime() === dayDate.getTime();
      });

      const isFuture = dayDate > today;
      const isToday = dayDate.getTime() === today.getTime();

      weekData.push({
        date: dayDate,
        dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: dayDate.getDate(),
        month: dayDate.toLocaleDateString('en-US', { month: 'short' }),
        totalAmount: dayData ? dayData.totalAmount : 0,
        dailyGoal: dayData ? dayData.dailyGoal : 2500,
        percentComplete: dayData ? Math.round((dayData.totalAmount / dayData.dailyGoal) * 100) : 0,
        entries: dayData ? dayData.entries : [],
        isFuture,
        isToday
      });
    }

    res.json(weekData);
  } catch (err) {
    console.error('Error fetching week water:', err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/goal', auth, [
  body('dailyGoal').isInt({ min: 500, max: 10000 }).withMessage('Goal must be 500-10000ml'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest
], async (req, res) => {
  try {
    const { dailyGoal } = req.body;
    const userId = req.user.id;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const startOfDay = getStartOfDay(date);

    let waterIntake = await WaterIntake.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: getEndOfDay(startOfDay)
      }
    });

    if (!waterIntake) {
      waterIntake = new WaterIntake({
        user: userId,
        date: startOfDay,
        entries: [],
        dailyGoal
      });
    } else {
      waterIntake.dailyGoal = dailyGoal;
    }

    await waterIntake.save();
    res.json(waterIntake);
  } catch (err) {
    console.error('Error updating water goal:', err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:entryId', auth, [
  param('entryId').isMongoId().withMessage('Invalid entry ID'),
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest
], async (req, res) => {
  try {
    const { entryId } = req.params;
    const { date } = req.query;
    const userId = req.user.id;
    
    const startOfDay = getStartOfDay(date ? new Date(date) : new Date());

    const waterIntake = await WaterIntake.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: getEndOfDay(startOfDay)
      }
    });

    if (!waterIntake) {
      return res.status(404).json({ msg: 'Water intake record not found' });
    }

    waterIntake.entries = waterIntake.entries.filter(entry => entry._id.toString() !== entryId);
    waterIntake.totalAmount = waterIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    await waterIntake.save();
    res.json(waterIntake);
  } catch (err) {
    console.error('Error deleting water entry:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
