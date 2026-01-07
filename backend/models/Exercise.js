const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['strength', 'cardio', 'flexibility'], required: true },
  muscleGroups: [{ type: String }], // e.g., ['chest', 'triceps']
  instructions: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Exercise', exerciseSchema);