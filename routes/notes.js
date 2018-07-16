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
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;
  let filter = {};

  if(searchTerm){
    filter.$or = [{title: {$regex: searchTerm, $options: 'i'}}, 
                  {content: {$regex: searchTerm, $options: 'i'}}];
  }

  //Only want the $and array if there's something to put in it
  if(folderId || tagId) filter.$and = [];
  //Push id filters
  if(folderId) filter.$and.push({folderId});
  if(tagId) filter.$and.push({ tags: {$all: [tagId]} });
  
  Note.find(filter).sort({updatedAt: 'desc'})
    .populate('/folderId')
    .populate('tags')
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
    .populate('folderId')
    .populate('tags')
    .then(results =>{
      if(results) res.json(results);
      else next();
    })
    .catch(err =>{
      next(err);
    });

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {


  /***** Never trust users - validate input *****/
  const newObj = {};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      newObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if(newObj.tags){
    if(!Array.isArray(newObj.tags)){
      const err = new Error('The `tags` is not valid');
        err.status = 400;
        return next(err);
    }

    newObj.tags.forEach(tag =>{
      if (!ObjectId.isValid(tag)) {
        const err = new Error('A `tagId` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }
  
  if(newObj.folderId && !ObjectId.isValid(newObj.folderId)){
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  /*TODO?: Verify folderId exists in db
           Verify tags exist in db
   */

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
  const updateableFields = ['title', 'content', 'folderId', 'tags'];
  let hasVal = false;
  updateableFields.forEach(field => {
    if (field in req.body) {
      hasVal = true;
      updateObj.$set[field] = req.body[field];
    }
  });

  if(updateObj.$set.folderId && !ObjectId.isValid(updateObj.$set.folderId)){
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if(updateObj.$set.tags){
    if(!Array.isArray(updateObj.$set.tags)){
      const err = new Error('The `tags` is not valid');
        err.status = 400;
        return next(err);
    }

    updateObj.$set.tags.forEach(tag =>{
      if (!ObjectId.isValid(tag)) {
        const err = new Error('A `tagId` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  /*TODO?: Verify folderId exists in db
           Verify tags exist in db
   */
  if(!hasVal){
    const err = new Error('No valid update fields in request body');
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