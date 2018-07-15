'use strict';

const express = require('express');

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const { PORT, MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const Note = require('../models/note');

const router = express.Router();

// GET all tags
router.get('/', (req,res,next) =>{
  Tag.find().sort('name')
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

  if(!ObjectId.isValid(id)){
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById(id)
    .then(results =>{
      if(results) res.json(results);
      else next();
    });
});

//POST a new tag
router.post('/', (req,res,next) =>{
  const newObj = {};
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

  Tag.create(newObj)
    .then(results =>{
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err =>{
      if(err.code === 11000){
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//PUT update a tag
router.put('/:id', (req,res,next) =>{
  const id = req.params.id;

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
  const options = {new: true};

  Tag.findByIdAndUpdate(id, updateObj, options)
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

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const noteQueryObj = {tags: {$all: [id]}};
  const noteUpdateObj = {$pull: {tags: id}};
  let wasTagDeleted = true;

  console.log('id: ', id);
  Tag.findByIdAndRemove(id)
    .then(results =>{
      console.log('results 1: ', results);
      if(results) {
        return Note.updateMany(noteQueryObj, noteUpdateObj);
      }
      else {
        //do we error out if the id isn't found...?
        wasTagDeleted = false;
      }
    })
    .then(results =>{
      console.log('results 2: ', results);
      if(!wasTagDeleted) next(); // this feels janky
      else if(results.n > 0) res.json(results);
      else res.status(204).end();
    })
    .catch(err =>{
      next(err);
    });
});

module.exports = router;