// bookInstanceController.js - bookInstance controller module
var expressValidator = require('express-validator');
var BookInstance = require('../models/bookInstance');
var Book = require('../models/book');


// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {
   BookInstance.find({})
   .populate('book')
   .sort({ title: 'ascending' })  // this does not work
   .exec(function(err, list_bookinstances){
      if(err){
         return next(err);
      } else {
         res.render('bookinstances/', {
            title: 'Book Instance List',
            bookinstance_list: list_bookinstances
         });
      }
   })
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next) {

   BookInstance.findById(req.params.id)
   .populate('book')  // populate BookInstance w/ referenced content in the book model
   .exec(function(err, bookinstance){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('bookinstances/show', {
            title: 'ID: ',
            bookinstance: bookinstance
         });
      }
   });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {

   // retrieve books
   Book.find({}, 'title')
   .sort({ title: 'ascending' })
   .exec(function(err, books){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('bookinstances/create-update', {
            title: 'Create BookInstance',
            books: books
         });
      }
   });
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = function(req, res, next) {

   // validate data
   req.checkBody('book', 'Book title required').notEmpty();
   req.checkBody('imprint', 'Imprint is required').notEmpty();
   req.checkBody('due_back', 'Date is required').notEmpty();

   // sanitize data
   req.sanitize('book').escape();
   req.sanitize('imprint').escape();
   req.sanitize('due_back').escape();
   req.sanitize('status').escape();

   // trim data
   req.sanitize('book').trim();
   req.sanitize('imprint').trim();
   req.sanitize('due_back').toDate();
   req.sanitize('status').trim();

   // create new bookinstance object
   var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      due_back: req.body.due_back,
      status: req.body.status
   });

   var errors = req.validationErrors();
   if(errors){

      Book.find({}, 'title')
      .sort({ title: 'ascending' })
      .exec(function(err, books){
         if(err){
            console.log(err);
            return next(err);
         } else {

            // console.log(`Status: ${bookinstance.status}`);
            // console.log(typeof bookinstance);
            // return;

            // render form & pass data
            res.render('bookinstances/create-update', {
               title: 'Create BookInstance',
               books: books,
               selected_book: bookinstance.book._id, // id of new instance just created
               errors: errors,
               bookinstance: bookinstance
            });
            return;
         }
      });
   } else {
   // Data from form is valid

      bookinstance.save(function(err){
         if(err){
            return next(err);
         } else {
            res.redirect(bookinstance.url);
         }
      });
   }
};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next) {

   //  escape & trim param
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   // retrieve bookinstance data
   BookInstance.findById(req.params.id)
   .populate('book')
   .exec(function(err, bookinstance){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('bookinstances/delete', {
            title: 'Delete Book Instance (copy): ',
            bookinstance: bookinstance
         });
      }
   });
};



// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next) {

   // validate hidden input data
   req.checkBody('bookinstanceid', 'Book instance ID is required.').notEmpty();

   // delete book instance
   BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err){
      if(err){
         console.log(err);
         return next(err);
      } else {
         // success
         res.redirect('/catalog/bookinstances');
      }
   });
};



// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};
