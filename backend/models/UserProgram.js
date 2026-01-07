const mongoose = require('mongoose');

const userProgramSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  startDate: { type: Date, default: Date.now },
  targetEndDate: { type: Date },
  currentDay: { type: Number, default: 1 },
  completedDays: [{
    dayNumber: Number,
    completedAt: { type: Date, default: Date.now },
    skipped: { type: Boolean, default: false }
  }],
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  notes: { type: String }
});

userProgramSchema.index({ user: 1, isCompleted: 1 });
userProgramSchema.index({ user: 1, startDate: -1 });

module.exports = mongoose.model('UserProgram', userProgramSchema);
