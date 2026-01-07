const express = require('express');
const { param, query, body, validationResult } = require('express-validator');
const Program = require('../models/Program');
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
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('type').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validateRequest
], async (req, res) => {
  try {
    const { difficulty, type, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const programs = await Program.find(query)
      .select('-days.exercises')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Program.countDocuments(query);
    
    res.json({
      programs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching programs:', err);
    res.status(500).send('Server error');
  }
});

router.get('/types', async (req, res) => {
  try {
    const types = await Program.distinct('type');
    res.json(types);
  } catch (err) {
    console.error('Error fetching types:', err);
    res.status(500).send('Server error');
  }
});

router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid program ID'),
  validateRequest
], async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }
    
    const exercises = await Exercise.find();
    const exerciseMap = new Map(exercises.map(e => [e.name.toLowerCase(), e]));
    
    const fuzzyMatch = (programName) => {
      const normalized = programName.toLowerCase().trim();
      
      if (exerciseMap.has(normalized)) {
        return exerciseMap.get(normalized);
      }
      
      for (const [exName, exData] of exerciseMap.entries()) {
        const exNormalized = exName.toLowerCase().trim();
        
        if (normalized.includes(exNormalized) || exNormalized.includes(normalized)) {
          return exData;
        }
        
        const programWords = normalized.split(/\s+/);
        const exWords = exNormalized.split(/\s+/);
        
        const matchCount = programWords.filter(word => 
          word.length > 2 && exWords.some(exWord => 
            exWord.includes(word) || word.includes(exWord)
          )
        ).length;
        
        if (matchCount >= Math.min(programWords.length, exWords.length) * 0.6) {
          return exData;
        }
      }
      
      return null;
    };
    
    const enrichedDays = program.days.map(day => ({
      ...day.toObject(),
      exercises: day.exercises.map(ex => ({
        ...ex.toObject(),
        matchedExercise: fuzzyMatch(ex.name) || null
      }))
    }));
    
    res.json({
      ...program.toObject(),
      days: enrichedDays
    });
  } catch (err) {
    console.error('Error fetching program:', err);
    res.status(500).send('Server error');
  }
});

router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Program name required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('type').notEmpty().withMessage('Program type required'),
  body('daysPerWeek').isInt({ min: 1, max: 7 }).withMessage('Invalid days per week'),
  body('durationWeeks').isInt({ min: 1, max: 52 }).withMessage('Invalid duration'),
  body('days').isArray({ min: 1 }).withMessage('Program must have at least one day'),
  validateRequest
], async (req, res) => {
  try {
    const program = new Program(req.body);
    await program.save();
    res.status(201).json(program);
  } catch (err) {
    console.error('Error creating program:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid program ID'),
  validateRequest
], async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }
    
    res.json({ msg: 'Program deleted' });
  } catch (err) {
    console.error('Error deleting program:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
