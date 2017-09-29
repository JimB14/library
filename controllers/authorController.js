// authorController.js - author controller module
var async = require('async');
var expressValidator = require('express-validator');
var debug = require('debug')('author');
var Author = require('../models/author');
var Book = require('../models/book');
var functions = require('../funcLibrary');

// Display list of all Authors
exports.author_list = function(req, res, next) {

   Author.find({})
   .sort({ 'family_name': 'ascending' })
   .exec(function(err, list_authors){
      if(err){
         // send flash message
         console.log(err);
         return next(err);
      } else  {
         res.render('authors/', {
            title: "Author List",
            author_list: list_authors
         })
      }
   });

};

// Display detail page for a specific Author
exports.author_detail = function(req, res, next) {

   async.parallel({

      author: function(callback){
         Author.findById(req.params.id)
            .exec(callback);
      },

      authors_books: function(callback){
         Book.find({ author: req.params.id }, 'title summary') // return only selected field (title, summary)
         .exec(callback);
      },

   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('authors/show', {
            title: 'Author: ',
            author: results.author,
            authors_books: results.authors_books
         });
      }
   });

};

// Display Author create form on GET
exports.author_create_get = function(req, res) {

   res.render('authors/create-update', {
      title: 'Create Author'
   });
};


// Handle Author create on POST
exports.author_create_post = function(req, res, next) {

   // validate data
   req.checkBody('first_name', 'First name is required.').notEmpty(); //We won't force Alphanumeric, because people might have spaces.
   req.checkBody('family_name', 'Last name is required.').notEmpty();
   req.checkBody('family_name', 'Last name must be letters only.').isAlpha();
   req.checkBody('date_of_birth', 'Invalid date').optional({ checkFalsy: true });
   req.checkBody('date_of_death', 'Invalid date').optional({ checkFalsy: true });

   // sanitize
   req.sanitize('first_name').escape();
   req.sanitize('family_name').escape();

   // trim
   req.sanitize('first_name').trim();
   req.sanitize('family_name').trim();

   // cast to proper JS types
   req.sanitize('date_of_birth').toDate();
   req.sanitize('date_of_death').toDate();

   // Run the validators
   var errors = req.validationErrors();

   // capitalize first letter of first and family names
   if(req.body.name){
      req.body.name = functions.capitalizeEachWord(req.body.first_name);
   }
   if(req.body.family_name){
      req.body.name = functions.capitalizeEachWord(req.body.family_name);
   }
   console.log (req.body.first_name);
   console.log (req.body.family_name);

   // Create an Author object with escaped and trimmed data.
   var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death
   });

   if (errors) {
      res.render('authors/create-update', {
         title: 'Create Author',
         author: author,
         errors: errors
      });
      return;
   }
   else {
   // Data from form is valid

      author.save(function (err) {
         if (err) {
            return next(err);
         } else {
            //successful - redirect to new author record.
            res.redirect(author.url);
         }
      });
   }
};


// Display Author delete form on GET
exports.author_delete_get = function(req, res) {

   //  escape & trim param
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   async.parallel({
      author: function(callback) {
         Author.findById(req.params.id)
         .exec(callback);
      },
      authors_books: function(callback) {
         Book.find({ 'author': req.params.id })
         .exec(callback);
      },
   }, function(err, results) {
         if (err) {
         return next(err);
      } else {
         // Successful, so render
         res.render('authors/delete', {
            title: 'Delete Author: ',
            author: results.author,
            author_books: results.authors_books
         });
      }
   });
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res, next) {

   // validate
   req.checkBody('authorid', 'Author ID must exist').notEmpty();

   async.parallel({

      author: function(callback){
         Author.findById(req.params.id).exec(callback);
      },
      authors_books: function(callback){
         Book.find({ author: req.params.id }).exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      }
      // check if author to be deleted has books
      if(results.authors_books.length > 0){
         // author has books; cannot be deleted until books deleted
         res.render('authors/delete', {
            title: 'Delete Author: ',
            author: results.author,
            author_books: results.authors_books
         });
      } else {
         // author has no books & can be deleted (authorid from hidden field in form)
         // works as anonymous function without deleteAuthor() and also with it
         // but where is deleteAuthor()? Must be a built-in Mongoose function?
         Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){
            if(err){
               console.log(err);
               return next(err);
            } else {
               // success - go to authors list
               res.redirect('/catalog/authors')
            }
         });
      }
   });

};

// Display Author update form on GET
exports.author_update_get = function(req, res, next) {

   //  escape & trim param
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   // single line option for above: req.sanitize('id').escape().trim();

   // get author data
   Author.findById(req.params.id)
   .exec(function(err, author){
      if(err) {
         // console.log(err);
         debug(`Update error: ${err}`);
         return next(err);
      } else {

         console.log(author);
         // return;

         res.render('authors/create-update', {
            title: 'Update Author',
            author: author
         });
      }
   });

};



// Handle Author update on POST
exports.author_update_post = function(req, res, next) {

   // validate data
   req.checkBody('first_name', 'First name is required').notEmpty();
   req.checkBody('family_name', 'Last name is required').notEmpty();
   req.checkBody('date_of_birth', 'Date of birth is required').notEmpty();

   // sanitize data
   req.sanitize('first_name').escape();
   req.sanitize('last_name').escape();
   req.sanitize('date_of_birth').escape();
   if(req.body.date_of_death != ''){
      req.sanitize('date_of_death').escape();
   }

   // trim data
   req.sanitize('first_name').trim();
   req.sanitize('last_name').trim();
   req.sanitize('date_of_birth').trim();
   if(req.body.date_of_death != ''){
      req.sanitize('date_of_death').trim();
   }

   // create new author object
   var author = new Author({
      first_name:    req.body.first_name,
      family_name:   req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id:           req.params.id    // new author object MUST have same ID
   });

   console.log(`UPDATED AUTHOR: ${author}`);

   // check for errors & store in errors
   var errors = req.validationErrors();
   if(errors){
      // re-render update form and pass objects to populate values in form
      res.render('authors/create-update', {
         title: 'Update Author',
         author: author,
         errors: errors
      });
   } else {
      // check ID
      console.log(req.params.id);

      // data okay, update document in collection
      Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor){
         if(err){
            console.log(err);
            return next(err);
         } else {
            // success; redirect to author.url (virtual field in author model)
            res.redirect(theauthor.url);
         }
      })
   }
};
