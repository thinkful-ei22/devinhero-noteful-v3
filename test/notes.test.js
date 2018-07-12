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

    it('will return an array', function(){
      return chai.request(app).get('/api/notes')
        .then(res=>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
      });
    });

    it('will return the correct number of elements', function(){
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

  });

  describe('GET /api/notes/:id', function(){
    it('will be completed later', function(){

    });
  });

  
  describe('POST /api/notes/', function(){
    it('will be completed later', function(){

    });
  });

  describe('PUT /api/notes/:id', function(){
    it('will be completed later', function(){

    });
  });

  describe('DELETE /api/notes/:id', function(){
    it('will be completed later', function(){

    });
  });

});