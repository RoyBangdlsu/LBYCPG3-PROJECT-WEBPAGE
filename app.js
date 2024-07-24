const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const mainRoutes = require('./server/routes/main');

const app = express();

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection URI
const mongoURI = 'mongodb+srv://seungbang:cHg81m9UBOpbXAXo@cluster0.3wqygrl.mongodb.net/LBYCPG3_PROJECT';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Session middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure: true if using HTTPS
}));

// Flash messages middleware
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', mainRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
