'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Folder.insertMany(seedFolders),
      Folder.createIndexes,
      Note.insertMany(seedNotes)
    ]);
  })
  .then(results => {
    console.info('Initialized db with notes, folders');
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });