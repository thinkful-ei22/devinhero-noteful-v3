'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');


// console.log('GET notes/');

// mongoose.connect(MONGODB_URI)
//   .then( ()=>{
//     const searchTerm = 'Sunlight';
//     let filter = {};

//     if(searchTerm){
//       filter.$or = [{title: {$regex: searchTerm}}, {content: {$regex: searchTerm}}];
//       // filter.title={$regex: searchTerm};
//     }

//     return Note.find(filter).sort({updatedAt: 'desc'});
//   })
//   .then(results =>{
//     console.log(results);
//   })
//   .then(() =>{
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });


// // console.log('GET notes/:id');

// mongoose.connect(MONGODB_URI)
//   .then(response =>{
//     const id = '000000000000000000000001';     //replace this

//     return Note.findById(id);
//   })
//   .then(results =>{
//     console.log(results);
//   })
//   .then(results =>{
//     return mongoose.disconnect();
//   })
//   .catch(err =>{
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });


// console.log('CREATE notes/');

// mongoose.connect(MONGODB_URI)
//   .then(results =>{
//     //get data
//     const newObj = {title: 'A NEW ITEM!', content: 'WOW, IT\'S SO NEW!'};

//     return Note.create(newObj);
//   })
//   .then(results =>{
//       console.log(results);
//     })
//     .then(results =>{
//       return mongoose.disconnect();
//     })
//     .catch(err =>{
//       console.error(`ERROR: ${err.message}`);
//       console.error(err);
//     });


// console.log('UPDATE note/:id');

mongoose.connect(MONGODB_URI)
  .then(results =>{
    const id = '000000000000000000000008';
    const title = 'WOWWW';
    const content = '';
    let updateObj = {$set: {}};

    if(title)
      updateObj.$set['title'] = title;
    if(content)
      updateObj.$set['content'] = content;

    const options = {new: true};
    //console.log('updateObj:', updateObj);
    return Note.findByIdAndUpdate(id, updateObj, options );
  })
  .then(results =>{
      console.log(results);
    })
    .then(results =>{
      return mongoose.disconnect();
    })
    .catch(err =>{
      console.error(`ERROR: ${err.message}`);
      console.error(err);
    });

// mongoose.connect(MONGODB_URI)
//   .then(results =>{

//     const id = '000000000000000000000007';

//     return Note.findByIdAndRemove(id);
//   })
//   .then(results =>{
//     console.log(results);
//   })
//   .then(results =>{
//     return mongoose.disconnect();
//   })
//   .catch(err =>{
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });