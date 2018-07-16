'use strict';

const express = require('express');

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
// const {PORT, MONGODB_URI} = require('../config');

const User = require('../models/user');

const router = express.Router();

router.post('/', (req,res,next) =>{
  const newObj = {};
  const inputFields = ['fullname', 'username', 'password'];
  const authFields = ['username', 'password'];

  inputFields.forEach(field =>{
    if(field in req.body)
      newObj[field] = req.body[field];
  });

  /* Trust not the user, for they will lead you astray */

  inputFields.forEach(field =>{
    if(typeof newObj[field] !== 'string' && newObj[field]){
      const err = new Error(`Field '${field}' is not a string`);
      err.status = 400;
      return next(err);
    }
  });

  authFields.forEach(field =>{
    if(!newObj[field]){
      const err = new Error(`Missing '${field}' in request body`);
      err.status = 400;
      return next(err);
    }

    if(newObj[field].charAt(0) === ' ' || newObj[field].charAt(newObj[field].length-1) === ' '){
      const err = new Error(`Leading or trailing whitespace in '${field}'`);
      err.status = 400;
      return next(err);
    }
  });

  if(newObj.username < 1){
    const err = new Error('`username` must contain at least 1 character)');
      err.status = 400;
      return next(err);
  }

  if(newObj.password.length < 8 || newObj.password.length > 72){
    const err = new Error('`password` must be between 8 and 72 characters');
      err.status = 400;
      return next(err);    
  }

  return User.hashPassword(newObj.password)
    .then(digest => {
      const newUser = {
        username: newObj.username,
        password: digest,
        fullname: newObj.fullname
      };
      return User.create(newUser);
    })
    .then(results =>{
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err =>{
      if(err.code === 11000){
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });

});





module.exports = router;