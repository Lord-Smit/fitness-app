const mongoose = require('mongoose');
require('dotenv').config();
const Workout = require('./models/Workout');
const Exercise = require('./models/Exercise');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const testSave = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get or create test user
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      });
      await user.save();
      console.log('Test user created');
    }
    
    // Generate a test token
    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Token generated');
    
    // Get an exercise
    const exercise = await Exercise.findOne();
    console.log('Using exercise:', exercise.name);
    
    // Create workout data
    const workoutData = {
      exercises: [{
        exercise: exercise._id,
        sets: [
          { reps: 12, weight: 50 },
          { reps: 10, weight: 60 }
        ]
      }],
      notes: 'Test from app simulation',
      date: new Date()
    };
    
    console.log('Workout data:', JSON.stringify(workoutData, null, 2));
    
    // Save workout directly (simulating API)
    const workout = new Workout({
      user: user._id,
      ...workoutData
    });
    
    await workout.save();
    console.log('Workout saved successfully! ID:', workout._id);
    
    // Verify
    const workouts = await Workout.find({ user: user._id }).populate('exercises.exercise');
    console.log('Total workouts for user:', workouts.length);
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

testSave();