const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  exercises: [{
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: [{
      reps: { type: Number, required: true },
      weight: { type: Number } // optional for bodyweight exercises
    }]
  }],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);