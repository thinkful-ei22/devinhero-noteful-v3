'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', required: true },
  title: { type: String, required: true },
  folderId: {type: mongoose.Schema.Types.ObjectId, 
             ref: 'Folder'},
  content: String,
  tags: [{type: mongoose.Schema.Types.ObjectId,
          ref: 'Tag'}]
});

// Add `createdAt` and `updatedAt` fields
noteSchema.set('timestamps', true);

noteSchema.set('toObject', {
  virtuals: true,     // include built-in virtual `id`
  versionKey: false,  // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
  }
});

module.exports = mongoose.model('Note', noteSchema);