const express = require('express');
const mongoose = require('mongoose');
const body_parser = require('body-parser');
const passport = require('passport');

const app = express()
const cors = require('cors')
app.use(cors())

// Passport middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport);

app.use(body_parser.urlencoded());
app.use(body_parser.json());
 

const profileApi = require('./routesBS/apiBS/profile');
const registerApi = require('./routesBS/apiBS/register');
const batteryApi = require('./routesBS/apiBS/battery');
const stationApi = require('./routesBS/apiBS/station');

app.use('/profile',profileApi);
app.use('/register',registerApi);
app.use('/battery',batteryApi);
app.use('/station', stationApi);


// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose
  .connect(db)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.listen(5000, () => {
    console.log(`Server is Running on port 5000`)
  })