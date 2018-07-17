'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const Folder = require ('../models/folder');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;

chai.use(chaiHttp);



describe('Noteful API - Notes', function () {

  //// Common values
  
  const baseEndpoint = '/api/notes';
  const invalidIdError = 'The `id` is not valid';
  const invalidFolderIdError = 'The `folderId` is not valid';
  const invalidId = 'badlyFormattedId';
  const nonexistentId = '999999999999999999999999';

  const expectedIDs =
    ['id'
    ,'folderId'
  ];
  const expectedInputFields = 
    ['title' 
    ,'content'
    ,'favoritePuppy'
  ];
  const expectedTimestamps = 
    ['createdAt'
    ,'updatedAt'
  ];

  
  //// Helper functions

  const compareAllExpectedIDs = function(resBody, dbRes){
    expectedIDs.forEach(field =>{
      /* THIS FEELS JANKY... why the inconsistent need for .toJSON()? 

         Handling for unknown existence of folderId is good though,
         that's necessary. 
      */
     switch(field){
       case 'folderId':
            if(!resBody.folderId) expect(dbRes.folderId).to.be.undefined;
            else expect(resBody.folderId).to.equal(dbRes.folderId.toJSON());
            break;
        default:
            expect(resBody[field]).to.equal(dbRes[field]);
      }
    });
  };

  const compareAllExpectedUserInputs = function(resBody, dbRes){
    expectedInputFields.forEach(field =>{
      expect(resBody[field]).to.equal(dbRes[field]);
    });
  };

  const compareAllExpectedTimestamps = function(resBody, dbRes){
    expectedTimestamps.forEach(field =>{
      expect(resBody[field]).to.equal(dbRes[field].toJSON());
    });
  };

  const compareAllExpectedFields = function(resBody, dbRes){
    // console.log('ID');
    compareAllExpectedIDs(resBody, dbRes);
    // console.log('Inputs');
    compareAllExpectedUserInputs(resBody, dbRes);
    // console.log('Timestamps');
    compareAllExpectedTimestamps(resBody, dbRes);
  };

  //// Before/After functions

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true});
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes)
      .then(res =>{
        return Folder.insertMany(seedFolders);
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {

    it('returns a populated array w/ status 200', function(){
      return chai.request(app).get(`${baseEndpoint}`)
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.not.be.empty;
      });
    });


    it('returns the correct number of elements', function(){
      let res;
      return chai.request(app).get(`${baseEndpoint}`)
        .then(_res=>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          return Note.countDocuments();
        })
        .then(count =>{
          expect(res.body).to.have.length(count);
      });
    });


    it('contains elements with expected field values from db', function(){
      let res;
      return chai.request(app).get(`${baseEndpoint}`)
        .then(_res=>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          return Note.find().sort({updatedAt: 'desc'});
      })
      .then(dbRes =>{
        for(let i = 0; i < res.body.length; ++i)
          compareAllExpectedFields(res.body[i], dbRes[i]);
      });
    });

    
    xit('returns expected items when passed a searchTerm in query', function(){
      //TODO
    });


    it('returns expected items when passed a valid folderId in query', function(){
      const folderId = '111111111111111111111100';
      let res;
      return chai.request(app)
        .get(`${baseEndpoint}?folderId=${folderId}`)
        .then(_res =>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.not.be.empty;
          return Note.find({folderId});
        })
        .then(dbRes =>{
          for(let i = 0; i < dbRes.length; ++i)
            compareAllExpectedFields(res.body[i], dbRes[i]);
        });
    });

    xit('returns empty array if query has no matches', function(){

    });

  });

  //// GET /notes/:id
  describe('GET /api/notes/:id', function(){
    
    it('returns a single populated object w/ status 200', function(){
      return Note.findOne()
        .then(note =>{
          return chai.request(app).get(`${baseEndpoint}/${note.id}`);
        })
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.not.be.empty;
      });
    });
    

    it('returns an object with expected field values', function(){
      let dbRes;
      return Note.findOne()
        .then(note =>{
          dbRes = note;
          return chai.request(app).get(`${baseEndpoint}/${note.id}`);
        })
        .then(res =>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          compareAllExpectedFields(res.body, dbRes);
        });
    });


    it('returns status 400 w/ msg when passed invalid id format', function(){
      return chai.request(app).get(`${baseEndpoint}/${invalidId}`)
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal(invalidIdError);
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      return chai.request(app).get(`${baseEndpoint}/${nonexistentId}`)
        .then(res =>{
          expect(res).to.have.status(404);
        });
    });

  });

  //// POST /notes
  describe('POST /api/notes/', function(){
    const validPostObj = {
      title: 'The Tragedy of Darth Plagueis the Wise',
      content: 'Ironic. He could save others from death, but not himself.',
      folderId: '111111111111111111111100'
    };

    const noTitlePostObj = {
      content: 'This is missing a title, and that is no bueno'
    };

    const invalidFolderIdPostObj = {
      title: 'Bad folder!',
      folderId: invalidId
    };

    it('returns a single populated object w/ status 201', function(){
      return chai.request(app)
        .post(`${baseEndpoint}`)
        .send(validPostObj)
        .then(res =>{
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.not.be.empty;
        });
    });


    it('returns the correct location header', function(){
      return chai.request(app)
        .post(`${baseEndpoint}`)
        .send(validPostObj)
        .then(res =>{
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          const expLocation = `${baseEndpoint}/${res.body.id}`;
          expect(res.header.location).to.equal(expLocation);
        });
    });


    it('returns an object with expected field values', function(){
      return chai.request(app)
        .post(`${baseEndpoint}`)
        .send(validPostObj)
        .then(res =>{
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          compareAllExpectedUserInputs(res.body, validPostObj);
          //Don't know these values from return object alone
          expect(res.body.id).to.exist;
          expectedTimestamps.forEach(field =>{
            expect(res.body[field]).to.exist;  
          });
        });
    });


    xit('can be found in the db with the correct values', function(){
      //TODO
    });


    it('returns status 400 w/ msg if posted with invalid folderId format', function(){
      return chai.request(app)
        .post(`${baseEndpoint}`)
        .send(invalidFolderIdPostObj)
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal(invalidFolderIdError);
        });
    });
    

    xit('returns status 400 w/ msg if posted with nonexistent folderId', function(){
      //TODO
      //Should this case be handled?
    });
    
    
    it('returns status 400 w/ msg if posted without title', function(){
      return chai.request(app)
        .post(`${baseEndpoint}`)
        .send(noTitlePostObj)
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  //// PUT /notes/:id
  describe('PUT /api/notes/:id', function(){
    const validPutObj = {
              title: 'Obi-Wan Greeting'
              ,content: 'Hello there!' 
            };

    const validPutObjContentOnly = {content: 'Wow, only content'};

    const invalidFolderIdPutObj = {folderId: invalidId};

    it('returns a single populated object w/ status 200', function(){
      const updateObj = validPutObj;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`${baseEndpoint}/${dbRes.id}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.not.be.empty;
        });
    });


    it('returns an object with the expected user inputs', function(){
      let dbRes;
      const updateObj = validPutObj;
      return Note.findOne()
        .then(_dbRes =>{
          dbRes = _dbRes;
          return chai.request(app)
            .put(`${baseEndpoint}/${dbRes.id}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expectedInputFields.forEach(field =>{
            if(field in updateObj) expect(res.body[field]).to.equal(updateObj[field]);
            else expect(res.body[field]).to.equal(dbRes[field]);
          });
          expectedTimestamps.forEach(field =>{
            if(field === 'updatedAt') expect(res.body.updatedAt).to.not.be.null;
            else expect(res.body[field]).to.equal(dbRes[field].toJSON());
          });
        });
    });

    
    it('returns expected values ', function(){
      let dbRes;
      const updateObj = validPutObjContentOnly;
      return Note.findOne()
        .then(_dbRes =>{
          dbRes = _dbRes;
          return chai.request(app)
            .put(`${baseEndpoint}/${dbRes.id}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expectedInputFields.forEach(field =>{
            if(field in updateObj) expect(res.body[field]).to.equal(updateObj[field]);
            else expect(res.body[field]).to.equal(dbRes[field]);
          });
          expectedTimestamps.forEach(field =>{
            if(field === 'updatedAt') expect(res.body.updatedAt).to.not.be.null;
            else expect(res.body[field]).to.equal(dbRes[field].toJSON());
          });
        });
    });

    
    xit('correct values are found in db if all user input fields modified', function(){
      //TODO
    });
    
    
    xit('correct values are found in db if finite user input fields modified', function(){
      //TODO
    });
    

    it('returns status 400 w/ msg if put without any valid fields', function(){
      const updateObj = {};
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`${baseEndpoint}/${dbRes.id}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal('No valid update fields in request body');
        });
    });


    it('returns status 400 w/ msg if put with invalid folderId format', function(){
      const updateObj = invalidFolderIdPutObj;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`${baseEndpoint}/${dbRes.id}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal(invalidFolderIdError);
        });
    });


    xit('returns status 400 w/ msg if put with nonexistent folderId', function(){
      //TODO
      //should this case be handled?
    });


    it('returns status 400 w/ msg when passed invalid id format', function(){
      const updateObj = validPutObj;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`${baseEndpoint}/${invalidId}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal(invalidIdError);
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      const updateObj = validPutObj;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`${baseEndpoint}/${nonexistentId}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(404);
          expect(res).to.be.json;  
        });
    });

  });

  //// DELETE /notes/:id
  describe('DELETE /api/notes/:id', function(){

    it('returns status 204', function(){
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app).delete(`${baseEndpoint}/${dbRes.id}`);
        })
        .then(res =>{
          expect(res).to.have.status(204);
        });
    });

    it('removes item from db', function(){
      let dbRes;
      return Note.findOne()
        .then(_dbRes =>{
          dbRes = _dbRes;
          return chai.request(app).delete(`${baseEndpoint}/${dbRes.id}`);
        })
        .then(res =>{
          expect(res).to.have.status(204);
          return Note.findById(dbRes.id);
        })
        .then(results =>{
          expect(results).to.be.null;
        });
    });


    it('returns status 400 w/ msg when passed invalid id format', function(){
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app).delete(`${baseEndpoint}/${invalidId}`);
        })
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal(invalidIdError);
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app).delete(`${baseEndpoint}/${nonexistentId}`);
        })
        .then(res =>{
          expect(res).to.have.status(404);
          expect(res).to.be.json;
        });
    });

  });

});