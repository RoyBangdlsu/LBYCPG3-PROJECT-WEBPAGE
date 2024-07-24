const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const Exercise = require('../../models/exercise');
const Workout = require('../../models/workout');
const bcrypt = require('bcryptjs');

// Middleware to check if user is logged in
function checkAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
router.get('', checkAuthenticated, async (req, res) => {
  let exercises = [];
  try {
    exercises = await Exercise.find();
  } catch (err) {
    console.error('Error fetching exercises:', err);
  }
  
  const locals = {
    title: "Fitness Tracker - Home",
    description: "Simple Fitness tracker",
    query: req.query,
    exercises: exercises
  };
  res.render('index', { locals });
});

// About Route
router.get('/about', (req, res) => {
  const locals = {
    title: "Fitness Tracker - About",
    query: req.query
  };
  res.render('about', { locals });
});

// Registration Route
router.get('/register', (req, res) => {
  const locals = {
    title: "Fitness Tracker - Register",
    query: req.query
  };
  res.render('register', { locals });
});

router.post('/register', async (req, res) => {
  const { name, goal, goalType, height, weight, gender, username, password } = req.body;
  
  let user = await User.findOne({ username });
  if (user) {
    return res.redirect('/register?error=User already exists');
  }

  user = new User({
    name,
    goal,
    goalType,
    height,
    weight,
    gender,
    username,
    password
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user.save();
  res.redirect('/login?success=Registration successful. You can now log in.');
});

// Login Route
router.get('/login', (req, res) => {
  const locals = {
    title: "Fitness Tracker - Login",
    query: req.query
  };
  res.render('login', { locals });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.redirect('/login?error=Invalid username or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.redirect('/login?error=Invalid username or password');
  }

  req.session.user = user;
  res.redirect('/?success=Login successful');
});

// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login?success=You are logged out');
  });
});


// Route to display add exercise form
router.get('/exercise', checkAuthenticated, (req, res) => {
  const locals = {
    title: "Fitness Tracker - Add Exercise"
  };
  res.render('add-exercise', { locals });
});

// Route to handle adding new exercise
router.post('/add-exercise', checkAuthenticated, async (req, res) => {
  const { name, description, calories_burned_per_minute, met } = req.body;

  try {
    const newExercise = new Exercise({
      name,
      description,
      calories_burned_per_minute: parseFloat(calories_burned_per_minute), // Ensure it's a number
      met: parseFloat(met) // Ensure it's a number     met: Math.round(parseFloat(met)) // Round to nearest integer
    });

    await newExercise.save();
    console.log('Exercise added successfully:', newExercise);
    res.redirect('/?success=Exercise added successfully');
  } catch (err) {
    console.error('Error adding exercise:', err.message);
    res.status(500).send('Server Error');
  }
});


// Route to handle exercise details
router.get('/exercise/:id', checkAuthenticated, async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  const locals = {
    title: `Exercise - ${exercise.name}`,
    exercise: exercise,
    query: req.query
  };
  res.render('exercise-details', { locals });
});

// Profile Route
router.get('/profile', checkAuthenticated, (req, res) => {
  const goalTypes = ["Lose Weight", "Gain Muscle", "Improve Stamina", "Enhance Flexibility", "General Fitness"];
  const locals = {
    title: "Fitness Tracker - Profile",
    user: req.session.user,
    goalTypes: goalTypes
  };
  res.render('profile', { locals });
});

router.post('/profile', checkAuthenticated, async (req, res) => {
  const { name, goal, goalType, height, weight, gender } = req.body;
  const userId = req.session.user._id;

  try {
    await User.findByIdAndUpdate(userId, {
      name,
      goal,
      goalType,
      height,
      weight,
      gender
    });

    // Update session user data
    const updatedUser = await User.findById(userId);
    req.session.user = updatedUser;

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Server Error');
  }
});


// Goal Setting Route
router.get('/goal-setting', checkAuthenticated, (req, res) => {
  const goalTypes = ["Lose Weight", "Gain Muscle", "Improve Stamina", "Enhance Flexibility", "General Fitness"];
  const locals = {
    title: "Fitness Tracker - Goal Setting",
    user: req.session.user,
    goalTypes: goalTypes
  };
  res.render('goal-setting', { locals });
});

router.post('/goal-setting', checkAuthenticated, async (req, res) => {
  const { goal, goalType } = req.body;
  const userId = req.session.user._id;

  try {
    await User.findByIdAndUpdate(userId, { goal, goalType });

    // Update session user data
    const updatedUser = await User.findById(userId);
    req.session.user = updatedUser;

    res.redirect('/goal-setting');
  } catch (err) {
    console.error('Error setting goal:', err);
    res.status(500).send('Server Error');
  }
});


// View Progress Route
router.get('/view-progress', checkAuthenticated, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.session.user._id }).populate('exerciseId');

    // Aggregate data by date
    const aggregatedData = workouts.reduce((acc, workout) => {
      const date = new Date(workout.date).toISOString().split('T')[0]; // Use ISO date string
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += workout.caloriesBurned;
      return acc;
    }, {});

    // Ensure today's date is included in the data
    const today = new Date().toISOString().split('T')[0];
    if (!aggregatedData[today]) {
      aggregatedData[today] = 0;
    }

    // Convert aggregated data to arrays of labels and data
    const labels = Object.keys(aggregatedData).sort((a, b) => new Date(a) - new Date(b));
    const data = labels.map(label => aggregatedData[label]);

    const locals = {
      title: "Fitness Tracker - View Progress",
      user: req.session.user,
      labels: labels,
      data: data,
      workouts: workouts,
      query: req.query
    };
    res.render('view-progress', { locals });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    res.redirect('/view-progress?error=Error fetching workouts');
  }
});









router.post('/log-workout', checkAuthenticated, async (req, res) => {
  const { exerciseId, hours, sets, trials } = req.body;
  const userId = req.session.user._id;

  try {
    const user = await User.findById(userId);
    const exercise = await Exercise.findById(exerciseId);

    // Calculate BMI
    const bmi = (user.weight / ((user.height / 100) ** 2)).toFixed(2);

    // Calculate calories burned using MET value, weight, and duration
    const met = exercise.met;
    let caloriesBurned;

    if (user.gender === 'Male') {
      caloriesBurned = (met * user.weight * hours * 1.05).toFixed(2);
    } else {
      caloriesBurned = (met * user.weight * hours * 0.95).toFixed(2);
    }

    const workout = new Workout({
      userId,
      exerciseId,
      hours,
      sets,
      trials,
      caloriesBurned,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      bmi
    });

    await workout.save();

    res.redirect('/view-progress?success=Workout logged successfully');
  } catch (err) {
    console.error('Error logging workout:', err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
