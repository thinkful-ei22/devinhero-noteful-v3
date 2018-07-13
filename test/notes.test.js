'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Notes', function () {
  const expectedFields = 
    ['title' 
    ,'content'
  ];
  const expectedTimestamps = 
    ['createdAt'
    ,'updatedAt'
  ];

  const baseEndpoint = '/api/notes';

  const badlyFormattedId = 'badlyFormattedId';
  const invalidIdError = 'The `id` is not valid';
  const nonexistentId = '999999999999999999999999';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true});
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes);
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


    it('contains elements with expected field values', function(){
      let res;
      return chai.request(app).get(`${baseEndpoint}`)
        .then(_res=>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          return Note.find().sort({updatedAt: 'desc'});
      })
      .then(dbRes =>{
        for(let i = 0; i < res.body.length; ++i){
          expectedTimestamps.forEach(field =>{
            expect(res.body[0][field]).to.equal(dbRes[0][field].toJSON());
          });
          expectedFields.forEach(field =>{
            expect(res.body[0][field]).to.equal(dbRes[0][field]);
          });
        }
      });
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
          expectedTimestamps.forEach(field =>{
            expect(res.body[field]).to.equal(dbRes[field].toJSON());
          });
          expectedFields.forEach(field =>{
            expect(res.body[field]).to.equal(dbRes[field]);
          });
        });
    });


    it('returns status 400 w/ msg when passed invalid id format', function(){
      return chai.request(app).get(`${baseEndpoint}/${badlyFormattedId}`)
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
      content: 'Ironic. He could save others from death, but not himself.'
    };

    const noTitlePostObj = {
      content: 'This is missing a title, and that is no bueno'
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
          expectedFields.forEach(field =>{
            expect(res.body[field]).to.equal(validPostObj[field]);
          });
          //Don't know these values from return object alone
          expect(res.body.id).to.not.be.null;
          expectedTimestamps.forEach(field =>{
            expect(res.body[field]).to.not.be.null;  
          });
        });
    });


    xit('can be found in the db with the correct values', function(){
      //TODO
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
    const validPutObjAllFields = {
              title: 'Obi-Wan Greeting'
              ,content: 'Hello there!' 
            };

    const validPutObjContentOnly = {content: 'Wow, only content'};

    it('returns a single populated object w/ status 200', function(){
      const updateObj = validPutObjAllFields;
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


    it('returns an object with the expected field values', function(){
      let dbRes;
      const updateObj = validPutObjAllFields;
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
          expectedFields.forEach(field =>{
            if(field in updateObj) expect(res.body[field]).to.equal(updateObj[field]);
            else expect(res.body[field]).to.equal(dbRes[field]);
          });
          expectedTimestamps.forEach(field =>{
            if(field === 'updatedAt') expect(res.body.updatedAt).to.not.be.null;
            else expect(res.body[field]).to.equal(dbRes[field].toJSON());
          });
        });
    });

    
    it('returns expected values if limited fields are modified', function(){
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
          expectedFields.forEach(field =>{
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


    it('returns status 400 w/ msg when passed invalid id format', function(){
      const updateObj = validPutObjAllFields;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`${baseEndpoint}/${badlyFormattedId}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;  
          expect(res.body.message).to.equal(invalidIdError);
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      const updateObj = validPutObjAllFields;
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
          return chai.request(app).delete(`${baseEndpoint}/${badlyFormattedId}`);
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