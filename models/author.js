// author.js - author model module

var mongoose = require('mongoose');
// var moment = require('moment');
var moment = require("moment-timezone")

var Schema = mongoose.Schema;

var AuthorSchema = Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

// Virtual for date_of_birth
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function(){
   return this.date_of_birth ? moment(this.date_of_birth).tz('GMT').format('MMMM D, YYYY') : '';
});

// Virtual for date_of_birth
AuthorSchema
.virtual('date_of_death_formatted')
.get(function(){
   return this.date_of_death ? moment(this.date_of_death).tz('GMT').format('MMMM D, YYYY') : '';
});

// virtual for date_of_birth to populate update form
   AuthorSchema
   .virtual('date_of_birth_update_format')
   .get(function(){
      // format must be JavaScript date format (YYYY-MM-DD)
      return this.date_of_birth ? moment(this.date_of_birth).tz('GMT').format('YYYY-MM-DD') : '';
   });

// virtual for date_of_birth to populate update form
AuthorSchema
.virtual('date_of_death_update_format')
.get(function(){
   // format must be JavaScript date format (YYYY-MM-DD)
   return this.date_of_death ? moment(this.date_of_death).tz('GMT').format('YYYY-MM-DD') : '';
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);
