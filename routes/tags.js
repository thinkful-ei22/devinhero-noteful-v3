'use strict';

const express = require('express');

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const { PORT, MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const Note = require('../models/note');

const passport = require('passport');

const router = express.Router();

//Authenticate first!
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));


// GET all tags
router.get('/', (req,res,next) =>{
  const userId = req.user.id;
  const filter = {userId};

  Tag.find(filter).sort('name')
    .then(results =>{
      res.json(results);
    })
    .catch(err =>{
      next(err);
    });
});

// GET single tag by id
router.get('/:id', (req,res,next) =>{
  const id = req.params.id;
  const userId = req.user.id;
  const filter = {_id: id, userId};

  if(!ObjectId.isValid(id)){
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findOne(filter)
    .then(results =>{
      if(results) res.json(results);
      else next();
    })
    .catch(err =>{
      next(err);
    });
});

//POST a new tag
router.post('/', (req,res,next) =>{
  const userId = req.user.id;
  
  const newObj = {userId};
  const validFields = ['name'];

  validFields.forEach(field =>{
    if(field in req.body) newObj[field] = req.body[field];
  });

  /** Trust not the user blindly, for they will lead you astray **/
  if(!newObj.name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.findOne({name: newObj.name, userId})
    .then(results =>{
      if(results){
        const err = new Error('The tag name already exists');
        err.status = 400;
        return Promise.reject(err);
      }
      return Tag.create(newObj);
    })
    .then(results =>{
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err =>{
      next(err);
    });
});

//PUT update a tag
router.put('/:id', (req,res,next) =>{
  const id = req.params.id;
  const userId = req.user.id;

  /** Trust not the user blindly, for they will lead you astray */
  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateObj = {$set: {}};
  const validFields = ['name'];

  validFields.forEach(field =>{
    if(field in req.body) updateObj.$set[field] = req.body[field];
  });

  //Only one thing to update... if there's no name, why bother?
  if(!updateObj.$set.name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  //Return the new updated item, not the original item
  const query = {_id: id, userId};
  const options = {new: true};

  Tag.findOneAndUpdate(query, updateObj, options)
    .then(results =>{
      if(results) res.json(results);
      else next();
    })
    .catch(err =>{
      if(err.code === 11000){
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//DELET a tag by id
router.delete('/:id', (req,res,next) =>{
  const id = req.params.id;
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const noteQueryObj = {userId, tags: {$all: [id]}};
  const noteUpdateObj = {$pull: {tags: id}};
  let wasTagDeleted = true;

  const query = {_id: id, userId};

  Tag.findOneAndRemove(query)
    .then(results =>{
      if(results) {
        return Note.updateMany(noteQueryObj, noteUpdateObj);
      }
      else {
        //do we error out if the id isn't found...?
        wasTagDeleted = false;
      }
    })
    .then(results =>{
      if(!wasTagDeleted) next(); // this feels janky
      else if(results.n > 0) res.json(results);
      else res.status(204).end();
    })
    .catch(err =>{
      next(err);
    });
});

module.exports = router;