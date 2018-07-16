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

  inputFields.forEach(field =>{
    if(field in req.body)
      newObj[field] = req.body[field];
  });

  /* Trust not the user, for they will lead you astray */

  if(!newObj.username){
    const err = new Error('Missing `username` in request body');
      err.status = 400;
      return next(err);
  }

  if(!newObj.password){
    const err = new Error('Missing `password` in request body');
    err.status = 400;
    return next(err);
  }

  User.create(newObj)
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