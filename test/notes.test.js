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

  const badlyFormattedId = '${badlyFormattedId}';
  const invalidIdError = 'The `id` is not valid';
  const nonexistentId = '999999999999999999999999';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true});
  });

  beforeEach(function () {
    return mongoose.connection.db.dropDatabase()
      .then(() =>{
        return Note.insertMany(seedNotes);
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
      return chai.request(app).get('/api/notes')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.not.be.empty;
      });
    });


    it('returns the correct number of elements', function(){
      let res;
      return chai.request(app).get('/api/notes')
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
      return chai.request(app).get('/api/notes')
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

  describe('GET /api/notes/:id', function(){
    
    it('returns a single populated object w/ status 200', function(){
      return Note.findOne()
        .then(note =>{
          return chai.request(app).get(`/api/notes/${note.id}`);
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
          return chai.request(app).get(`/api/notes/${note.id}`);
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
      return chai.request(app).get(`/api/notes/${badlyFormattedId}`)
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal(invalidIdError);
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      return chai.request(app).get(`/api/notes/${nonexistentId}`)
        .then(res =>{
          expect(res).to.have.status(404);
        });
    });

  });

  
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
        .post('/api/notes')
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
        .post('/api/notes')
        .send(validPostObj)
        .then(res =>{
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          const expLocation = `/api/notes/${res.body.id}`;
          expect(res.header.location).to.equal(expLocation);
        });
    });


    it('returns an object with expected field values', function(){
      return chai.request(app)
        .post('/api/notes')
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
        .post('/api/notes')
        .send(noTitlePostObj)
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });


  describe('PUT /api/notes/:id', function(){
    const validPutAllFields = {
              title: 'Obi-Wan Greeting'
              ,content: 'Hello there!' 
            };

    const validPutContentOnly = {content: 'Wow, only content'};

    it('returns a single populated object w/ status 200', function(){
      const updateObj = validPutAllFields;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`/api/notes/${dbRes.id}`)
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
      const updateObj = validPutAllFields;
      return Note.findOne()
        .then(_dbRes =>{
          dbRes = _dbRes;
          return chai.request(app)
            .put(`/api/notes/${dbRes.id}`)
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
      const updateObj = validPutContentOnly;
      return Note.findOne()
        .then(_dbRes =>{
          dbRes = _dbRes;
          return chai.request(app)
            .put(`/api/notes/${dbRes.id}`)
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

    
    xit('correct values are found in db if many fields modified', function(){
      //TODO
    });
    
    
    xit('correct values are found in db if limited fields modified', function(){
      //TODO
    });
    

    it('returns status 400 w/ msg if put without content', function(){
      const updateObj = {};
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`/api/notes/${dbRes.id}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body.message).to.equal('No valid update content found');
        });
    });


    it('returns status 400 w/ msg when passed invalid id format', function(){
      const updateObj = validPutAllFields;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`/api/notes/${badlyFormattedId}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res).to.be.json;  
          expect(res.body.message).to.equal(invalidIdError);
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      const updateObj = validPutAllFields;
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app)
            .put(`/api/notes/${nonexistentId}`)
            .send(updateObj);
        }) 
        .then(res =>{
          expect(res).to.have.status(404);
          expect(res).to.be.json;  
        });
    });

  });


  describe('DELETE /api/notes/:id', function(){

    it('returns status 204', function(){
      return Note.findOne()
        .then(dbRes =>{
          return chai.request(app).delete(`/api/notes/${dbRes.id}`);
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
          return chai.request(app).delete(`/api/notes/${dbRes.id}`);
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
          return chai.request(app).delete(`/api/notes/${badlyFormattedId}`);
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
          return chai.request(app).delete(`/api/notes/${nonexistentId}`);
        })
        .then(res =>{
          expect(res).to.have.status(404);
          expect(res).to.be.json;
        });
    });

  });

});