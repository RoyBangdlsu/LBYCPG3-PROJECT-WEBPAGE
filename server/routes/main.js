const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const Exercise = require('../../models/exercise');
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

// Registration Route
router.get('/register', (req, res) => {
  const locals = {
    title: "Fitness Tracker - Register"
  };
  res.render('register', { locals });
});

router.post('/register', async (req, res) => {
  const { name, goal, height, weight, gender, username, password } = req.body;
  
  let user = await User.findOne({ username });
  if (user) {
    return res.status(400).send('User already exists');
  }

  user = new User({
    name,
    goal,
    height,
    weight,
    gender,
    username,
    password
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user.save();
  res.redirect('/login');
});

// Login Route
router.get('/login', (req, res) => {
  const locals = {
    title: "Fitness Tracker - Login",
    error: req.query.error
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
  res.redirect('/?login=success');
});

// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Route to handle exercise creation
router.post('/exercise', async (req, res) => {
  const { name, description, calories_burned_per_minute } = req.body;

  let exercise = new Exercise({
    name,
    description,
    calories_burned_per_minute: parseFloat(calories_burned_per_minute) // Ensure it's a number
  });

  await exercise.save();
  res.redirect('/');
});

// Route to handle exercise details
router.get('/exercise/:id', checkAuthenticated, async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  const locals = {
    title: `Exercise - ${exercise.name}`,
    exercise: exercise
  };
  res.render('exercise-details', { locals });
});


// Additional routes
router.get('/about', checkAuthenticated, (req, res) => {
  const locals = {
    title: "Fitness Tracker - About"
  };
  res.render('about', { locals });
});

router.get('/goal-setting', checkAuthenticated, (req, res) => {
  const locals = {
    title: "Fitness Tracker - Goal Setting"
  };
  res.render('goal-setting', { locals });
});

router.get('/view-progress', checkAuthenticated, (req, res) => {
  const locals = {
    title: "Fitness Tracker - View Progress"
  };
  res.render('view-progress', { locals });
});


// Profile Route
router.get('/profile', checkAuthenticated, (req, res) => {
  const locals = {
    title: "Fitness Tracker - Profile",
    user: req.session.user
  };
  res.render('profile', { locals });
});

// Update Profile Route
router.post('/profile', checkAuthenticated, async (req, res) => {
  const { name, goal, height, weight, gender } = req.body;
  const userId = req.session.user._id;

  try {
    await User.findByIdAndUpdate(userId, {
      name,
      goal,
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

module.exports = router;
