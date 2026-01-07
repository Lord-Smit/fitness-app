const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  metrics: {
    totalWeightLifted: { type: Number },
    caloriesBurned: { type: Number },
    duration: { type: Number } // in minutes
  }
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);