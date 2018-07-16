'use strict';

const express = require('express');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

const User = require('../models/user');
const passport = require('passport');


const router = express.Router();


const options = {session: false, failWithError: true};
const localAuth = passport.authenticate('local', options);

router.post('/', localAuth, function (req, res) {
  return res.json(req.user);
});

module.exports = router;