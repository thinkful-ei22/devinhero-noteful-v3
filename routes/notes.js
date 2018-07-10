/* global  MONGODB_URI Note*/

'use strict';

const express = require('express');

const mongoose = require('mongoose');
const { PORT, MONGODB_URI } = require('../config');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  const searchTerm = req.query.searchTerm;
  let filter = {};

  if(searchTerm){
    filter.$or = [{title: {$regex: searchTerm, $options: 'i'}}, {content: {$regex: searchTerm, $options: 'i'}}];
  }

  mongoose.connect(MONGODB_URI)
    .then( ()=>{
      return Note.find(filter).sort({updatedAt: 'desc'});
    })
    .then(results =>{
      res.json(results);
    })
    .then(() =>{
      return mongoose.disconnect();
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  const id = req.params.id;

  mongoose.connect(MONGODB_URI)
    .then(response =>{

      return Note.findById(id);
    })
    .then(results =>{
      res.json(results);
    })
    .then(results =>{
      return mongoose.disconnect();
    })
    .catch(err =>{
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const newObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      newObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!newObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  mongoose.connect(MONGODB_URI)
    .then(results =>{
      return Note.create(newObj);
    })
    .then(results =>{
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .then(results =>{
      return mongoose.disconnect();
    })
    .catch(err =>{
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {$set: {}};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj.$set[field] = req.body[field];
    }
  });

  const options = {new: true};

  mongoose.connect(MONGODB_URI)
    .then(results =>{
      return Note.findByIdAndUpdate(id, updateObj, options);
    })
    .then(results =>{
      res.json(results);
    })
    .then(results =>{
      return mongoose.disconnect();
    })
    .catch(err =>{
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
});


/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const id = req.params.id;

  mongoose.connect(MONGODB_URI)
    .then(results =>{
      return Note.findByIdAndRemove(id);
    })
    .then(results =>{
      if(results)
        res.status(204).end();
      else
        next();
    })
    .then(results =>{
      return mongoose.disconnect();
    })
    .catch(err =>{
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });
  
});

module.exports = router;