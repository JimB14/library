// bookInstance.js - bookInstance model module
var moment = require('moment');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookInstanceSchema = Schema({
  book:
  {
     type: Schema.ObjectId,
     ref: 'Book',           // reference to the associated book
     required: true
  },
  imprint:
  {
     type: String,
     required: true
  },
  status:
  {
     type: String,
     required: true,
     enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
     default: 'Maintenance'
  },
  due_back:
  {
     type: Date,
     default: Date.now
  }
});

// Virtual for BookInstance's URL
BookInstanceSchema
.virtual('url')
.get(function () {
  return '/catalog/bookinstance/' + this._id;
});

// Virtual for formatted date
BookInstanceSchema
.virtual('due_back_formatted')
.get(function(){
   return moment(this.due_back).format('MMMM DD, YYYY');
});

//Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
