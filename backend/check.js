const mongoose = require('mongoose');
require('dotenv').config();
const Workout = require('./models/Workout');
require('./models/Exercise');
require('./models/User');

const checkWorkouts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const workouts = await Workout.find().populate('user', 'name email').sort({ date: -1 });
    console.log('=== WORKOUTS IN DATABASE ===');
    console.log('Total workouts:', workouts.length);
    workouts.forEach((w, i) => {
      console.log(`\nWorkout ${i+1}:`);
      console.log('  User:', w.user?.name || 'Unknown');
      console.log('  Date:', w.date);
      console.log('  Exercises:', w.exercises.length);
      w.exercises.forEach(e => {
        console.log(`    - ${e.exercise?.name || 'Unknown'}: ${e.sets.length} sets`);
      });
      console.log('  Notes:', w.notes || 'None');
    });
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkWorkouts();