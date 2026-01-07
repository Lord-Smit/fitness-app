const mongoose = require('mongoose');
require('dotenv').config();
const Exercise = require('./models/Exercise');
const Workout = require('./models/Workout');

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('=== EXERCISES IN DATABASE ===');
    const exercises = await Exercise.find();
    console.log('Total exercises:', exercises.length);
    exercises.forEach((e, i) => {
      console.log(`${i+1}. ${e.name} (ID: ${e._id})`);
    });
    
    console.log('\n=== WORKOUTS IN DATABASE ===');
    const workouts = await Workout.find().populate('exercises.exercise');
    console.log('Total workouts:', workouts.length);
    workouts.forEach((w, i) => {
      console.log(`\nWorkout ${i+1}:`);
      console.log('  Date:', w.date);
      w.exercises.forEach(e => {
        console.log(`    - Exercise: ${e.exercise?.name || 'Unknown'} (ID: ${e.exercise?._id || 'Missing'})`);
        console.log(`      Sets:`, e.sets);
      });
    });
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkData();