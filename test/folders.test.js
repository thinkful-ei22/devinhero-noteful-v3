'use strict';

const app = require('../server');
const chai = require ('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Folder = require ('../models/folder');
const seedFolders = require('../db/seed/folders');

const Note = require ('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

chai.use(chaiHttp);


////Tests
describe('Noteful API - Folders', function(){
  const expectedFields = 
          ['id', 
           'name'];
  const expectedTimestamps = 
          ['createdAt',
           'updatedAt'];

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true});
  });

  beforeEach(function () {
    return Folder.insertMany(seedFolders);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  //// GET /folders
  describe('GET /folders', function() {
    it('will return an array', function(){
      return chai.request(app).get('/api/folders')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
      });
    });

    it('will return the correct number of elements', function(){
      let res;
      return chai.request(app).get('/api/folders')
        .then(_res=>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          return Folder.countDocuments();
        })
        .then(count =>{
          expect(res.body).to.have.length(count);
      });
    });

    it('will contain elements with the expected field values', function(){
      let res;
      return chai.request(app).get('/api/folders')
        .then(_res=>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          return Folder.find().sort('name');
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
  
  //// GET /folders/:id
  describe('GET /folders/:id', function() {
    it('will return a single object', function(){
      return Folder.findOne()
        .then(folder =>{
          return chai.request(app).get(`/api/folders/${folder.id}`);
        })
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
      });
    });

    it('will return an object with the expected fields', function(){
      let dbRes;
      return Folder.findOne()
        .then(folder =>{
          dbRes = folder;
          return chai.request(app).get(`/api/folders/${folder.id}`);
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

    it('will return status 400 w/ msg when passed invalid id format', function(){
      return chai.request(app).get('/api/folders/invalidIDformat')
        .then(res =>{
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('will return status 404 when passed nonexistent id', function(){
      return chai.request(app).get('/api/folders/999999999999999999999999')
        .then(res =>{
          expect(res).to.have.status(404);
        });
    });
  });
  
  //// POST /folders
  describe('POST /folders', function() {
    it('will have tests coming soon', function(){
    });


  });
  
  //// PUT /folders/:id
  describe('PUT /folders/:id', function() {
    it('will have tests coming soon', function(){
    });


  });
  
  ////DELETE /folders/:id
  describe('DELETE /folders/:id', function() {
    it('will have tests coming soon', function(){
    });


  });
  
  



});