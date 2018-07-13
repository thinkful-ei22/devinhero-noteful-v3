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
    ['title', 
     'content'];
  const expectedTimestamps = 
    ['createdAt',
     'updatedAt'];

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

    it('returns an array w/ status 200', function(){
      return chai.request(app).get('/api/notes')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
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
    
    it('returns a single object w/ status 200', function(){
      return Note.findOne()
        .then(note =>{
          return chai.request(app).get(`/api/notes/${note.id}`);
        })
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
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
      return chai.request(app).get('/api/notes/invalidIDformat')
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });


    it('returns status 404 when passed nonexistent id', function(){
      return chai.request(app).get('/api/notes/999999999999999999999999')
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

    it('returns a single object w/ status 201', function(){
      return chai.request(app)
        .post('/api/notes')
        .send(validPostObj)
        .then(res =>{
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
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


    xit('posted object can be found in db with correct values', function(){
      //TODO
    });

  });


  describe('PUT /api/notes/:id', function(){
    xit('will be completed later', function(){

    });

  });


  describe('DELETE /api/notes/:id', function(){
    xit('will be completed later', function(){

    });

  });

});