'use strict';


const express = require('express');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

//authentication
const User = require('../models/user');
const passport = require('passport');
const options = {session: false, failWithError: true};
const localAuth = passport.authenticate('local', options);

const {JWT_SECRET, JWT_EXPIRY} = require('../config');
const jwt = require('jsonwebtoken');

//init router
const router = express.Router();

//Auth token generator
function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

//Authenticate user
router.post('/', localAuth, function (req, res) {
  const authToken = createAuthToken(req.user);
  return res.json({authToken});
});

module.exports = router;