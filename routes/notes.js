'use strict';

const express = require('express');

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
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
  
  Note.find(filter).sort({updatedAt: 'desc'})
    .then(results =>{
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findById(id)
    .then(results =>{
      if(results){
        res.json(results);
      }
      else{
        next();
      }
    })
    .catch(err =>{
      next(err);
    });

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {


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

  Note.create(newObj)
    .then(results =>{
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err =>{
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  /***** Never trust users - validate input *****/
  const updateObj = {$set: {}};
  const updateableFields = ['title', 'content'];
  let hasVal = false;
  updateableFields.forEach(field => {
    if (field in req.body) {
      hasVal = true;
      updateObj.$set[field] = req.body[field];
    }
  });

  if(!hasVal){
    const err = new Error('No valid update content found');
    err.status = 400;
    return next(err);
  }

  const options = {new: true};

  Note.findByIdAndUpdate(id, updateObj, options)
    .then(results =>{
      if(results) res.json(results);
      else next();
    })
    .catch(err =>{
      next(err);
    });
});


/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndRemove(id)
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