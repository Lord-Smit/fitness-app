const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');
const Program = require('./models/Program');
require('dotenv').config();

const exercises = [
  { name: 'Push-ups', type: 'strength', muscleGroups: ['chest', 'triceps'], instructions: 'Bodyweight chest exercise. Keep core tight, lower until chest nearly touches floor.' },
  { name: 'Squats', type: 'strength', muscleGroups: ['legs', 'glutes'], instructions: 'Fundamental leg exercise. Keep back straight, descend until thighs parallel to floor.' },
  { name: 'Pull-ups', type: 'strength', muscleGroups: ['back', 'biceps'], instructions: 'Classic back exercise. Pull until chin clears bar, lower with control.' },
  { name: 'Bench Press', type: 'strength', muscleGroups: ['chest', 'triceps'], instructions: 'Classic chest exercise. Lower bar to mid-chest, press up explosively.' },
  { name: 'Deadlifts', type: 'strength', muscleGroups: ['back', 'legs', 'core'], instructions: 'Full body compound lift. Keep back flat, drive through heels.' },
  { name: 'Planks', type: 'strength', muscleGroups: ['core'], instructions: 'Core isometric hold. Keep body in straight line, engage abs.' },
  { name: 'Bicep Curls', type: 'strength', muscleGroups: ['biceps'], instructions: 'Isolation exercise for biceps. Keep elbows fixed, curl weight up.' },
  { name: 'Lunges', type: 'strength', muscleGroups: ['legs', 'glutes'], instructions: 'Unilateral leg exercise. Step forward, lower until back knee nearly touches floor.' },
  { name: 'Overhead Press', type: 'strength', muscleGroups: ['shoulders', 'triceps'], instructions: 'Press barbell overhead. Keep core tight, press straight up.' },
  { name: 'Dumbbell Rows', type: 'strength', muscleGroups: ['back', 'biceps'], instructions: 'Single arm row. Keep back flat, pull dumbbell to hip.' },
  { name: 'Lateral Raises', type: 'strength', muscleGroups: ['shoulders'], instructions: 'Shoulder isolation. Raise arms to sides until parallel to floor.' },
  { name: 'Tricep Dips', type: 'strength', muscleGroups: ['triceps'], instructions: 'Bodyweight tricep exercise. Lower body by bending elbows, press up to straighten.' },
  { name: 'Face Pulls', type: 'strength', muscleGroups: ['shoulders', 'back'], instructions: 'Pull rope to face level. Externally rotate at end of movement.' },
  { name: 'Romanian Deadlifts', type: 'strength', muscleGroups: ['hamstrings', 'glutes', 'back'], instructions: 'Hip hinge movement. Soft bend in knees, lower along legs.' },
  { name: 'Leg Press', type: 'strength', muscleGroups: ['legs', 'glutes'], instructions: 'Machine leg exercise. Lower platform until knees at 90 degrees.' },
  { name: 'Leg Curls', type: 'strength', muscleGroups: ['hamstrings'], instructions: 'Machine isolation for hamstrings. Curl weight toward glutes.' },
  { name: 'Calf Raises', type: 'strength', muscleGroups: ['calves'], instructions: 'Calf isolation. Rise up on toes, lower with control.' },
  { name: 'Incline Dumbbell Press', type: 'strength', muscleGroups: ['chest', 'shoulders'], instructions: 'Upper chest focus. Set bench to 30-45 degrees.' },
  { name: 'Cable Flyes', type: 'strength', muscleGroups: ['chest'], instructions: 'Chest isolation. Bring cables together in front, slight elbow bend.' },
  { name: 'Hammer Curls', type: 'strength', muscleGroups: ['biceps', 'forearms'], instructions: 'Bicep curl with neutral grip. Targets brachialis.' },
  { name: 'Cable Tricep Pushdowns', type: 'strength', muscleGroups: ['triceps'], instructions: 'Tricep isolation. Push cable down by extending elbows.' },
  { name: 'Lat Pulldowns', type: 'strength', muscleGroups: ['back', 'biceps'], instructions: 'Machine pull exercise. Pull bar to chest, squeeze lats.' },
  { name: 'Seated Cable Rows', type: 'strength', muscleGroups: ['back', 'biceps'], instructions: 'Pull cable to abdomen. Squeeze shoulder blades together.' },
  { name: 'Glute Bridges', type: 'strength', muscleGroups: ['glutes', 'hamstrings'], instructions: 'Hip thrust movement. Squeeze glutes at top.' },
  { name: 'Goblet Squats', type: 'strength', muscleGroups: ['legs', 'glutes', 'core'], instructions: 'Front squat with dumbbell. Keep chest up, descend deep.' },
  { name: 'Mountain Climbers', type: 'cardio', muscleGroups: ['core', 'legs'], instructions: 'Dynamic core exercise. Alternate driving knees to chest.' },
  { name: 'Burpees', type: 'cardio', muscleGroups: ['full body'], instructions: 'Full body explosive movement. Jump, squat, push-up, repeat.' },
  { name: 'Jump Rope', type: 'cardio', muscleGroups: ['legs', 'shoulders'], instructions: 'Classic cardio. Jump with both feet, keep elbows close.' },
  { name: 'Side Planks', type: 'strength', muscleGroups: ['core', 'obliques'], instructions: 'Lateral core hold. Keep body in straight line.' },
  { name: 'Russian Twists', type: 'strength', muscleGroups: ['core', 'obliques'], instructions: 'Rotational core exercise. Lean back, rotate side to side.' },
  { name: 'Hyperextensions', type: 'strength', muscleGroups: ['back', 'glutes'], instructions: 'Back extension. Rise until body is in straight line.' },
  { name: 'Skull Crushers', type: 'strength', muscleGroups: ['triceps'], instructions: 'Lying tricep extension. Lower weight to forehead, extend.' },
  { name: 'Preacher Curls', type: 'strength', muscleGroups: ['biceps'], instructions: 'Bicep isolation on preacher bench. Curl weight up.' },
  { name: 'Ab Wheel Rollouts', type: 'strength', muscleGroups: ['core'], instructions: 'Core exercise. Roll out until body extended, return with control.' },
  { name: 'Good Mornings', type: 'strength', muscleGroups: ['back', 'hamstrings'], instructions: 'Hip hinge with barbell. Keep back flat, fold at hips.' },
  { name: 'Bicycle Crunches', type: 'strength', muscleGroups: ['core', 'obliques'], instructions: 'Dynamic ab exercise. Opposite elbow to knee.' },
  { name: 'Flutter Kicks', type: 'strength', muscleGroups: ['core'], instructions: 'Core hold with alternating leg movement.' },
  { name: 'Jump Squats', type: 'cardio', muscleGroups: ['legs', 'glutes'], instructions: 'Explosive squat. Jump up, land softly.' },
];

const programs = [
  {
    name: "Fitness Foundation",
    description: "Perfect for beginners. Build a strong base with fundamental exercises focusing on proper form and consistency.",
    difficulty: "easy",
    type: "full-body",
    daysPerWeek: 3,
    durationWeeks: 6,
    totalDays: 18,
    benefits: ["Learn proper exercise form", "Build workout consistency", "Develop baseline strength"],
    requirements: ["Basic gym equipment", "2-3 hours per week"],
    days: [
      { dayNumber: 1, dayName: "Full Body A", dayType: "workout", exercises: [
        { name: "Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Push-ups", sets: 3, reps: "8-10", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Lunges", sets: 2, reps: "10 each", rest: "60s" }
      ]},
      { dayNumber: 2, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 3, dayName: "Full Body B", dayType: "workout", exercises: [
        { name: "Goblet Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Bench Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Lunges", sets: 2, reps: "10 each", rest: "60s" }
      ]},
      { dayNumber: 4, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 5, dayName: "Full Body C", dayType: "workout", exercises: [
        { name: "Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Push-ups", sets: 3, reps: "8-10", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Glute Bridges", sets: 2, reps: "12", rest: "60s" }
      ]},
      { dayNumber: 6, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 7, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 8, dayName: "Full Body A", dayType: "workout", exercises: [
        { name: "Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Push-ups", sets: 3, reps: "8-10", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Lunges", sets: 2, reps: "10 each", rest: "60s" }
      ]},
      { dayNumber: 9, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 10, dayName: "Full Body B", dayType: "workout", exercises: [
        { name: "Goblet Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Bench Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Lunges", sets: 2, reps: "10 each", rest: "60s" }
      ]},
      { dayNumber: 11, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 12, dayName: "Full Body C", dayType: "workout", exercises: [
        { name: "Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Push-ups", sets: 3, reps: "8-10", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Glute Bridges", sets: 2, reps: "12", rest: "60s" }
      ]},
      { dayNumber: 13, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 14, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 15, dayName: "Full Body A", dayType: "workout", exercises: [
        { name: "Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Push-ups", sets: 3, reps: "8-10", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Lunges", sets: 2, reps: "10 each", rest: "60s" }
      ]},
      { dayNumber: 16, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 17, dayName: "Full Body B", dayType: "workout", exercises: [
        { name: "Goblet Squats", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Bench Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Planks", sets: 3, reps: "30s", rest: "60s" },
        { name: "Lunges", sets: 2, reps: "10 each", rest: "60s" }
      ]},
      { dayNumber: 18, dayName: "Rest Day", dayType: "rest", exercises: [] }
    ]
  },
  {
    name: "Classic Push-Pull-Leg",
    description: "The gold standard split. Train each muscle group twice per week with optimal volume and recovery.",
    difficulty: "medium",
    type: "push-pull-leg",
    daysPerWeek: 6,
    durationWeeks: 12,
    totalDays: 72,
    benefits: ["Train each muscle twice weekly", "Optimal volume distribution", "Great for muscle growth"],
    requirements: ["Full gym access", "4-5 hours per week"],
    days: [
      { dayNumber: 1, dayName: "Push Day", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Overhead Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "75s" },
        { name: "Lateral Raises", sets: 4, reps: "15-20", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 2, dayName: "Pull Day", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Pull-ups", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Seated Cable Rows", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Bicep Curls", sets: 3, reps: "10-12", rest: "60s" }
      ]},
      { dayNumber: 3, dayName: "Legs Day", dayType: "workout", exercises: [
        { name: "Squats", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
        { name: "Leg Curls", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 4, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 5, dayName: "Push Day", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Overhead Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "75s" },
        { name: "Lateral Raises", sets: 4, reps: "15-20", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 6, dayName: "Pull Day", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Pull-ups", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Seated Cable Rows", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Bicep Curls", sets: 3, reps: "10-12", rest: "60s" }
      ]},
      { dayNumber: 7, dayName: "Legs Day", dayType: "workout", exercises: [
        { name: "Squats", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
        { name: "Leg Curls", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 8, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 9, dayName: "Push Day", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Overhead Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "75s" },
        { name: "Lateral Raises", sets: 4, reps: "15-20", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 10, dayName: "Pull Day", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Pull-ups", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Seated Cable Rows", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Bicep Curls", sets: 3, reps: "10-12", rest: "60s" }
      ]},
      { dayNumber: 11, dayName: "Legs Day", dayType: "workout", exercises: [
        { name: "Squats", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
        { name: "Leg Curls", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 12, dayName: "Rest Day", dayType: "rest", exercises: [] }
    ]
  },
  {
    name: "Upper/Lower Split",
    description: "Efficient 4-day split focusing on upper and lower body for balanced development.",
    difficulty: "medium",
    type: "upper-lower",
    daysPerWeek: 4,
    durationWeeks: 10,
    totalDays: 40,
    benefits: ["Balanced development", "Adequate recovery", "Efficient training"],
    requirements: ["Gym access", "3-4 hours per week"],
    days: [
      { dayNumber: 1, dayName: "Upper Body A", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Pull-ups", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Overhead Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Lateral Raises", sets: 3, reps: "15-20", rest: "60s" },
        { name: "Bicep Curls", sets: 2, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 2, dayName: "Lower Body A", dayType: "workout", exercises: [
        { name: "Squats", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
        { name: "Leg Curls", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 3, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 4, dayName: "Upper Body B", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "75s" },
        { name: "Seated Cable Rows", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Face Pulls", sets: 3, reps: "15-20", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 2, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 5, dayName: "Lower Body B", dayType: "workout", exercises: [
        { name: "Goblet Squats", sets: 4, reps: "10-12", rest: "90s" },
        { name: "Lunges", sets: 3, reps: "12 each", rest: "60s" },
        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
        { name: "Glute Bridges", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 6, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 7, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 8, dayName: "Upper Body A", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Pull-ups", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Overhead Press", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Lateral Raises", sets: 3, reps: "15-20", rest: "60s" },
        { name: "Bicep Curls", sets: 2, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 9, dayName: "Lower Body A", dayType: "workout", exercises: [
        { name: "Squats", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90s" },
        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
        { name: "Leg Curls", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 10, dayName: "Rest Day", dayType: "rest", exercises: [] }
    ]
  },
  {
    name: "Powerbuilding Pro",
    description: "Advanced program combining strength and hypertrophy for serious lifters.",
    difficulty: "hard",
    type: "push-pull-leg",
    daysPerWeek: 6,
    durationWeeks: 16,
    totalDays: 96,
    benefits: ["Maximum strength gains", "Muscle hypertrophy", " Elite performance"],
    requirements: ["Advanced gym access", "5-6 hours per week", "2+ years lifting"],
    days: [
      { dayNumber: 1, dayName: "Push Day", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 5, reps: "5-7", rest: "2min" },
        { name: "Overhead Press", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rest: "60s" },
        { name: "Tricep Dips", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 2, dayName: "Pull Day", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 5, reps: "5", rest: "3min" },
        { name: "Pull-ups", sets: 4, reps: "6-10", rest: "90s" },
        { name: "Lat Pulldowns", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Seated Cable Rows", sets: 4, reps: "10-12", rest: "90s" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60s" },
        { name: "Hammer Curls", sets: 4, reps: "10-12", rest: "60s" }
      ]},
      { dayNumber: 3, dayName: "Legs Day", dayType: "workout", exercises: [
        { name: "Squats", sets: 5, reps: "5", rest: "3min" },
        { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s" },
        { name: "Leg Curls", sets: 4, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 4, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 5, dayName: "Push Day", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 5, reps: "5-7", rest: "2min" },
        { name: "Overhead Press", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rest: "60s" },
        { name: "Tricep Dips", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 6, dayName: "Pull Day", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 5, reps: "5", rest: "3min" },
        { name: "Pull-ups", sets: 4, reps: "6-10", rest: "90s" },
        { name: "Lat Pulldowns", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Seated Cable Rows", sets: 4, reps: "10-12", rest: "90s" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60s" },
        { name: "Hammer Curls", sets: 4, reps: "10-12", rest: "60s" }
      ]},
      { dayNumber: 7, dayName: "Legs Day", dayType: "workout", exercises: [
        { name: "Squats", sets: 5, reps: "5", rest: "3min" },
        { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s" },
        { name: "Leg Curls", sets: 4, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 8, dayName: "Rest Day", dayType: "rest", exercises: [] },
      { dayNumber: 9, dayName: "Push Day", dayType: "workout", exercises: [
        { name: "Bench Press", sets: 5, reps: "5-7", rest: "2min" },
        { name: "Overhead Press", sets: 4, reps: "6-8", rest: "2min" },
        { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rest: "60s" },
        { name: "Tricep Dips", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Cable Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60s" }
      ]},
      { dayNumber: 10, dayName: "Pull Day", dayType: "workout", exercises: [
        { name: "Deadlifts", sets: 5, reps: "5", rest: "3min" },
        { name: "Pull-ups", sets: 4, reps: "6-10", rest: "90s" },
        { name: "Lat Pulldowns", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Seated Cable Rows", sets: 4, reps: "10-12", rest: "90s" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60s" },
        { name: "Hammer Curls", sets: 4, reps: "10-12", rest: "60s" }
      ]},
      { dayNumber: 11, dayName: "Legs Day", dayType: "workout", exercises: [
        { name: "Squats", sets: 5, reps: "5", rest: "3min" },
        { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2min" },
        { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s" },
        { name: "Leg Curls", sets: 4, reps: "12-15", rest: "60s" },
        { name: "Calf Raises", sets: 4, reps: "15-20", rest: "60s" }
      ]},
      { dayNumber: 12, dayName: "Rest Day", dayType: "rest", exercises: [] }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Exercise.deleteMany({});
    await Program.deleteMany({});

    await Exercise.insertMany(exercises);
    console.log('Exercises seeded');

    await Program.insertMany(programs);
    console.log('Programs seeded');

    console.log(`Total exercises: ${exercises.length}`);
    console.log(`Total programs: ${programs.length}`);

    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
