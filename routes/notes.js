'use strict';

const express = require('express');

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const { PORT, MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const passport = require('passport');

const router = express.Router();

//Authenticate
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

const validateFolderId = function(folderId, userId){
  if(!folderId){
    return Promise.resolve();
  }
  if(!ObjectId.isValid(folderId)){
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return Promise.reject(err);
  }
  return Folder.count({_id: folderId, userId})
    .then(count =>{
        if(count === 0){const err = new Error('The `folderId` is not valid');
        err.status = 400;
        return Promise.reject(err);}
    });
};

const validateTags = function(tags, userId){
  if(!tags){
    return Promise.resolve();
  }
  if(!Array.isArray(tags)){
    const err = new Error('The `tags` must be an array');
    err.status = 400;
    return Promise.reject(err);
  }

  for(let i = 0; i < tags.length; ++i){
    if(!ObjectId.isValid(tags[i])){
      const err = new Error('The `tags` array contains an invalid id');
      err.status = 400;
      return Promise.reject(err);
    }
  }
  
  return Tag.find({$and: [{_id: {$in: tags}, userId}] })
    .then(results =>{
      if(tags.length !== results.length){
        const err = new Error('The `tags` array contains an invalid id');
        err.status = 400;
        return Promise.reject(err);
      }
    })
  ;
};


/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;
  let filter = {userId: req.user.id};

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
    // .populate('folderId')
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
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({_id: id, userId})
    // .populate('folderId')
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
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  const newObj = {userId: userId};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

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

  validateTags(newObj.tags, userId)
    .then( () =>{
      return validateFolderId(newObj.folderId, userId);
    })
    .then( () =>{
      return Note.create(newObj);
    })
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
  const userId = req.user.id;

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

  // if(updateObj.$set.folderId && !ObjectId.isValid(updateObj.$set.folderId)){
  //   const err = new Error('The `folderId` is not valid');
  //   err.status = 400;
  //   return next(err);
  // }

  // if(updateObj.$set.tags){
  //   if(!Array.isArray(updateObj.$set.tags)){
  //     const err = new Error('The `tags` is not valid');
  //       err.status = 400;
  //       return next(err);
  //   }

  //   updateObj.$set.tags.forEach(tag =>{
  //     if (!ObjectId.isValid(tag)) {
  //       const err = new Error('A `tagId` is not valid');
  //       err.status = 400;
  //       return next(err);
  //     }
  //   });
  // }

  if(!hasVal){
    const err = new Error('No valid update fields in request body');
    err.status = 400;
    return next(err);
  }

  const query = {_id: id, userId};
  const options = {new: true};

  validateTags(updateObj.$set.tags, userId)
    .then( () =>{
      return validateFolderId(updateObj.$set.folderId, userId);
    })
    .then( () => {
      return Note.findOneAndUpdate(query, updateObj, options);
    })
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
  const userId = req.user.id;

  if (!ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const query = {_id: id, userId};

  Note.findOneAndRemove(query)
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