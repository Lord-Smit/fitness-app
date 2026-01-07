const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    age: { type: Number },
    weight: { type: Number }, // in kg
    height: { type: Number }, // in cm
    goals: { type: String } // e.g., "lose weight", "gain muscle"
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);