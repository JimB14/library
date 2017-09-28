// bookController.js - book controller module

var Book         = require('../models/book');
var Author       = require('../models/author');
var Genre        = require('../models/genre');
var BookInstance = require('../models/bookInstance');

var async = require('async');


exports.index = function(req, res, next) {

   // http://caolan.github.io/async/docs.html#parallel
   // parallel - all functions started at the same time, when all completed,
   // argument 2 (final callback - res.render()) is invoked (render view)
   // Note: The callback function from async.parallel() above is a little unusual
   // in that we render the page whether or not there was an error (normally you
   // might use a separate execution path for handling the display of errors).
   async.parallel({
      book_count: function(callback){
         Book.count(callback);
      },
      book_instance_count: function(callback){
         BookInstance.count(callback);
      },
      book_instance_available_count: function(callback){
         BookInstance.count({status: 'Available'}, callback);
      },
      author_count: function(callback){
         Author.count(callback);
      },
      genre_count: function(callback){
         Genre.count(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('home/', {
            title: 'Local Library Home',
            error: err,
            data: results,
            success: false
         });
      }
   });
};


// Display list of all books
exports.book_list = function(req, res, next) {

   // find title & author of all books
   // use populate() http://mongoosejs.com/docs/populate.html
   // Here we also call populate() on Book, specifying the author field -— this
   // will replace the stored book author id with the full author details.
   Book.find({},'title author')
   .populate('author')
   .sort({ title: 'ascending' })
   .exec(function(err, list_books){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('books/', {
            title: 'Book List',
            book_list: list_books
         });
      }
   });
};


// Display detail page for a specific book
exports.book_detail = function(req, res, next) {

   async.parallel({

      book: function(callback){

         // b/c the book model references author & genre models for the author
         // & genre property values, that data must be retrieved from those
         // models by using the populate() method to bring that data into the
         // results of this query
         Book.findById(req.params.id)
         .populate('author') // go get author details from author model
         .populate('genre') // go get genre details from genre model
         .exec(callback);
      },
      book_instance: function(callback){

         BookInstance.find({ book: req.params.id })
         // .populate('book')  // go get book details from book model
         .exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('books/show', {
           title: 'Title:',
           book: results.book,
           book_instances: results.book_instance
        });
      }
   });
};


// Display book create form on GET
exports.book_create_get = function(req, res, next) {

   //Get all authors and genres, which we can use for adding to our book.
   async.parallel({
      authors: function(callback) {
         Author.find(callback); // need to sort this a-z! How?
      },
      genres: function(callback) {
         Genre.find(callback);
      },
   }, function(err, results) {
      if (err) {
         console.log(err)
         return next(err);
      } else {
         res.render('books/create-update', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres
         });
      }
   });
};


// Handle book create on POST
exports.book_create_post = function(req, res, next) {

   // validate
   req.checkBody('title', 'Title is required.').notEmpty();
   req.checkBody('author', 'Author is required').notEmpty();
   req.checkBody('summary', 'Summary is required').notEmpty();
   req.checkBody('isbn', 'ISBN is required').notEmpty();

   // sanitize
   req.sanitize('title').escape();
   req.sanitize('author').escape();
   req.sanitize('summary').escape();
   req.sanitize('isbn').escape();

   // trim
   req.sanitize('title').trim();
   req.sanitize('author').trim();
   req.sanitize('summary').trim();
   req.sanitize('isbn').trim();

   // sanitize
   req.sanitize('genre').escape();

   var book = new Book({
     title: req.body.title,
     author: req.body.author,
     summary: req.body.summary,
     isbn: req.body.isbn,
     genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(",")
   });

   console.log(`NEW BOOK: ${book}`); // no selected genres, yet

   // Run the validators
   var errors = req.validationErrors();
   if (errors) {
      // Some problems so we need to re-render our book

      //Get all authors and genres for form
      async.parallel({
         authors: function(callback) {
            Author.find(callback);
         },
         genres: function(callback) {
            Genre.find(callback);
         },
      }, function(err, results) {
         if (err) {
            return next(err);
         } else {

            // Mark our selected genres as checked when page is rebuilt!
            // The indexOf() method searches an array for an item and returns it's
            // index position in the array. Returns -1 if item not found.
            for (i = 0; i < results.genres.length; i++) {
               if (book.genre.indexOf(results.genres[i]._id) > -1) { // book.genre is array in new book object (line #161)
                  //Current genre is selected. Set "checked" flag.   // indexOf(genre._id) looks int book.genre array for match & returns index position or -1 if match not found
                  results.genres[i].checked='checked';                  // if found, mark checked as true so box is checked
               }
            }

            console.log(`Typeof book: ${typeof book}`);
            console.log(`New book: \n ${book}`);

            console.log(`Typeof errors ${errors}`);
            console.log(`Errors: \n ${errors}`);

            console.log(`Typeof results.authors: ${typeof results.authors}`)
            console.log(`results.authors: \n ${results.authors}`);

            console.log(`Typeof results.genres: ${typeof results.genres}`);
            console.log(`results.genres: \n ${results.genres}`);

            console.log(`results.genres.checked: ${results.genres.checked}`);


            // render Create New Book form again & populate with data already
            // provided by user
            res.render('books/create-update', {
               title: 'Create Book',
               authors: results.authors,
               genres: results.genres,
               book: book,
               errors: errors
            });
         }
      });
   }
   else {
   // Data from form is valid.
   // We could check if book exists already, but lets just save.

      book.save(function (err) {
         if (err) {
            return next(err);
         } else {
            //successful - redirect to new book record.
            res.redirect(book.url);
         }
      });
   }
};



// Display book delete form on GET
exports.book_delete_get = function(req, res, next) {

   //  escape & trim param
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   async.parallel({
      book: function(callback){
         Book.findById(req.params.id)
         .populate('author')
         .populate('genre')
         .exec(callback);
      },
      instances_of_book: function(callback){
         BookInstance.find({ book: req.params.id }).
         populate('book')
         .exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('books/delete', {
            title: 'Delete Book: ',
            book: results.book,
            book_instances: results.instances_of_book
         });
      }
   });
};

// Handle book delete on POST
exports.book_delete_post = function(req, res, next) {

   // validate ID
   req.checkBody('bookinstanceid', 'Book ID is required.').notEmpty();

   // retrieve book and bookinstance data again
   async.parallel({
      book: function(callback){
         Book.findById(req.params.id)
         .populate('author')
         .populate('genre')
         .exec(callback);
      },
      instances_of_book: function(callback){
         BookInstance.find({ book: req.params.id }).
         populate('book')
         .exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      }

      // verify again that no bookinstances of this book exist
      if(results.instances_of_book.length > 0) {
         // if book has instances, render delete page again & pass data
         res.render('books/delete', {
            title: 'Delete Book: ',
            book: results.book,
            book_instances: results.instances_of_book
         });
      } else {
         // no book instances exist, so book can be deleted
         Book.findByIdAndRemove(req.body.bookinstanceid, function deleteBook(err){
            if(err){
               console.log(err);
               return next(err);
            } else {
               // success; redirect to book list
               res.redirect('/catalog/books');
            }
         });
      }
   });
};



// Display book update form on GET
exports.book_update_get = function(req, res, next) {

   // sanitize & trim get variables
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   // Get book, authors and genres for form
   async.parallel({
      book: function(callback) {
         Book.findById(req.params.id)
         .populate('author')
         .populate('genre')
         .exec(callback);
      },
      authors: function(callback) {
         Author.find(callback);
      },
      genres: function(callback) {
         Genre.find(callback);
      },
   }, function(err, results) {
      if (err) {
         console.log(err);
         return next(err);
      } else {
         // Mark our selected genres as checked
         for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
               if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                     results.genres[all_g_iter].checked='checked';
               }
            }
         }

         res.render('books/create-update', {
            title:   'Update Book',
            authors: results.authors,
            genres:  results.genres,
            book:    results.book
         });
      }
   });
};

// Handle book update on POST
exports.book_update_post = function(req, res, next) {

   // sanitize id passed in
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   // check other data
   req.checkBody('title', 'Title must not be empty.').notEmpty();
   req.checkBody('author', 'Author must not be empty').notEmpty();
   req.checkBody('summary', 'Summary must not be empty').notEmpty();
   req.checkBody('isbn', 'ISBN must not be empty').notEmpty();

   // sanitize data
   req.sanitize('title').escape();
   req.sanitize('author').escape();
   req.sanitize('summary').escape();
   req.sanitize('isbn').escape();
   req.sanitize('title').trim();
   req.sanitize('author').trim();
   req.sanitize('summary').trim();
   req.sanitize('isbn').trim();
   req.sanitize('genre').escape();

   // create new book object
   var book = new Book({
         title:   req.body.title,
         author:  req.body.author,
         summary: req.body.summary,
         isbn:    req.body.isbn,
         genre:   (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(","),
         _id:     req.params.id //This is required, or a new ID will be assigned!
      });

   var errors = req.validationErrors();
   if (errors) {
      // Re-render book with error information
      // Get all authors and genres for form
      async.parallel({
         authors: function(callback) {
            Author.find(callback);
         },
         genres: function(callback) {
            Genre.find(callback);
         },
      }, function(err, results) {
         if (err) {
            return next(err);
         } else {
            // Mark selected genres as checked
            for (i = 0; i < results.genres.length; i++) {
               if (book.genre.indexOf(results.genres[i]._id) > -1) {
                     results.genres[i].checked='checked';
               }
            }
            res.render('books/create-update', {
               title:   'Update Book',
               authors: results.authors,
               genres:  results.genres,
               book:    book,
               errors:  errors
            });
         }
      });

   }
   else {
      // Data from form is valid. Update the record.
      Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
         if (err) {
            console.log(err);
            return next(err);
         } else {
            //successful - redirect to book show page. (url is virtual field)
            res.redirect(thebook.url);
         }
      });
   }

};
