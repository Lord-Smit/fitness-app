const mongoose = require('mongoose');

const exerciseRefSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  name: { type: String, required: true },
  sets: { type: Number, required: true },
  reps: { type: String, required: true },
  rest: { type: String, default: '60s' },
  notes: { type: String },
  order: { type: Number, default: 0 }
});

const programDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  dayName: { type: String, required: true },
  dayType: { type: String, enum: ['workout', 'rest'], default: 'workout' },
  exercises: [exerciseRefSchema],
  notes: { type: String }
});

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  type: { type: String, required: true },
  daysPerWeek: { type: Number, required: true },
  durationWeeks: { type: Number, required: true },
  totalDays: { type: Number, required: true },
  days: [programDaySchema],
  image: { type: String },
  benefits: [{ type: String }],
  requirements: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

programSchema.index({ difficulty: 1, type: 1 });
programSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Program', programSchema);
