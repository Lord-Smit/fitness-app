const mongoose = require('mongoose');

const WaterIntakeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  entries: [{
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['ml', 'oz'],
      default: 'ml'
    },
    time: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  dailyGoal: {
    type: Number,
    default: 2500
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

WaterIntakeSchema.index({ user: 1, date: 1 }, { unique: true });

WaterIntakeSchema.methods.addEntry = async function(amount, unit = 'ml') {
  this.entries.push({ amount, unit });
  this.totalAmount = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
  return this.save();
};

WaterIntakeSchema.methods.removeEntry = async function(entryId) {
  this.entries = this.entries.filter(entry => entry._id.toString() !== entryId);
  this.totalAmount = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
  return this.save();
};

WaterIntakeSchema.methods.resetDay = async function() {
  this.entries = [];
  this.totalAmount = 0;
  return this.save();
};

module.exports = mongoose.model('waterintake', WaterIntakeSchema);
