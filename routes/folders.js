'use strict';

const express = require('express');

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const { PORT, MONGODB_URI } = require('../config');

//Schema models
const Note = require('../models/note');
const Folder = require('../models/folder');

const passport = require('passport');

const router = express.Router();

//Authenticate first!
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

// GET all folders
router.get('/', (req,res,next) =>{
  const filter = {userId: req.user.id};

  Folder.find(filter).sort('name')
    .then(results =>{
      res.json(results);
    })
    .catch(err =>{
      next(err);
    });
});

//GET single folder by id
router.get('/:id', (req, res, next) =>{
  const id = req.params.id;
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findOne({_id: id, userId})
    .then(results =>{
      if(results) res.json(results);
      else next();
    })
    .catch(err =>{
      next(err);
    });
});

//POST a new folder
router.post('/', (req,res,next) =>{
  const userId = req.user.id;
  
  const newObj = {userId};
  const validFields = ['name'];

  validFields.forEach(field =>{
    if(field in req.body){
      newObj[field] = req.body[field];
    }
  });

  /***** Users cannot be trusted, validate input ******/
  if(!newObj.name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.findOne({name: newObj.name, userId})
    .then(res =>{
      return Folder.create(newObj);
    })
    .then(results =>{
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err =>{
      if(err.code === 11000){
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//PUT update a folder
router.put('/:id', (req,res,next) =>{
  const id = req.params.id;
  const userId = req.user.id;

  /**** Beware the dreaded user -- validate input ****/
  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  let updateObj = {$set: {}};
  const validFields = ['name'];

  validFields.forEach(field =>{
    if(field in req.body){
      updateObj.$set[field] = req.body[field];
    }
  });

  //Only one thing to update... if there's no name, then why bother?
  if(!updateObj.$set.name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  //Ensure new item is returned, not original
  const query = {_id: id, userId};
  const options = {new: true};

  Folder.findOneAndUpdate(query, updateObj, options)
    .then(results =>{
      if(results) res.json(results);
      else next();
    })
    .catch(err =>{
      if(err.code === 11000){
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//DELETE a folder by id
//Also deletes all notes in folder
router.delete('/:id', (req,res,next) =>{
  const id = req.params.id;
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const query = {_id: id, userId};

  Note.findOneAndRemove(query)
    .then(results =>{
      return Folder.findByIdAndRemove(id);
    })
    .then(results =>{
      if(results)
        res.status(204).end();
      else
        next();
    })
    .catch(err =>{
      next(err);
    });
});

module.exports = router;