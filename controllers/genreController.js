// genreController.js - genre controller module

var Genre     = require('../models/genre');
var Book      = require('../models/book');
var functions = require('../funcLibrary');
var async     = require('async');
// if error "Cast to ObjectId failed occurs, require Mongoose to correct."
// var mongoose = require('mongoose');
// then add var id = mongoose.Types.ObjectId(req.params.id.trim());
// then replace req.params.id with id whereever req.params.id occurs

// Display list of all Genre
exports.genre_list = function(req, res, next) {

   Genre.find({})
   .sort({ name: 'ascending'})
   .exec(function(err, list_genres){
      if(err){
         // flash message
         console.log(err);
         return next(err);
      } else {
         res.render('genres/', {
            title: 'Genre List',
            genre_list: list_genres
         });
      }
   });


};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res, next) {

   // trim any whitespace around ID
   req.params.id = req.params.id.trim();

   // what is "callback"? the 2nd argument in parallel(1st, 2nd) method
   async.parallel({
      // 1st argument
      genre: function(callback){
         Genre.findById(req.params.id)
         .sort({ name: 'ascending' })
         .exec(callback);
      },

      genre_books: function(callback){
         Book.find({ 'genre': req.params.id })
         .sort({ title: 'ascending' })
         .exec(callback);
      },

      // 2nd argument (= callback function passed above in genre & genre_books)
   }, function(err, results){ // results holds results from Genre & Book queries
      if(err){
         console.log(err);
         return next(err);
      } else {
         res.render('genres/show', {
            title: 'Genre: ',
            genre: results.genre,
            genre_books: results.genre_books
         });
      }
   });
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res, next) {

   res.render('genres/create-update', {
      title: 'Create Genre'
   });
};


// Handle Genre create on POST
exports.genre_create_post = function(req, res, next) {

   // Check that the name field is not empty
   req.checkBody('name', 'Genre name required').notEmpty();

   // Trim and escape the name field.
   req.sanitize('name').escape();
   req.sanitize('name').trim();

   // Run the validators
   var errors = req.validationErrors();

   // capitalize first letter of word or words
   req.body.name = functions.capitalizeEachWord(req.body.name);
   console.log (req.body.name);

   // Create a genre object with escaped and trimmed data.
   var genre = new Genre(
      {
         name: req.body.name
      }
   );

   if (errors) {
      // If there are errors, render the form again, passing the previously
      // entered values and errors
      res.render('genres/create-update', {
         title:  'Create Genre',
         genre:  genre,
         errors: errors
      });
      return;
   }
   else {
      // Data from form is valid.
      // Check if Genre with same name already exists
      Genre.findOne({ 'name' : req.body.name } )
         .exec(function(err, found_genre){
         console.log('found_genre: ' + found_genre);
         if(err){
            console.log(err);
            return next(err);
         } else {
            if(found_genre){
               // Genre exists, redirect to its detail page
               res.redirect(found_genre.url);
            }
            else {

               genre.save(function(err) {
                  if (err) {
                     console.log(err);
                     return next(err);
                  } else {
                     // flash success message
                     // Genre saved. Redirect to genre detail page
                    res.redirect(genre.url);
                  }
               });
            }
         }
      });
   }
};


// Display Genre delete form on GET
exports.genre_delete_get = function(req, res) {

   //  escape & trim param
   req.sanitize('id').escape();
   req.sanitize('id').trim();

   async.parallel({
      genre: function(callback){
         Genre.findById(req.params.id)
         .exec(callback);
      },
      books: function(callback){
         Book.find({ genre: req.params.id })
         .populate('author') // populates author field with all data from authors collection
         .exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      } else {

         // re-render form & pass values
         res.render('genres/delete', {
            title: 'Delete Genre: ',
            genre: results.genre,
            books: results.books
         });
      }
   });
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next) {

   // validate data from hidden input
   req.checkBody('genreid', 'Genre ID is required.').notEmpty();

   async.parallel({
      genre: function(callback){
         Genre.findById(req.params.id)
         .exec(callback);
      },
      books: function(callback){
         Book.find({ genre: req.params.id })
         .populate('author') // populates author field with all data from authors collection
         .exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      }

      if(results.books.length > 0){
         // genre has books that must be deleted before deleting genre to
         // preserve data integrity

         // re-render form & pass values
         res.render('genres/delete', {
            title: 'Delete Genre: ',
            genre: results.genre,
            books: results.books
         });

      } else {
         // no books to delete, therefore, delete genre
         Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err){
            if(err){
               console.log(err);
               return next(err);
            } else {
               // success
               res.redirect('/catalog/genres');
            }
         });
      }
   });
};



// Display Genre update form on GET
exports.genre_update_get = function(req, res, next) {

   // sanitize & trim query string
   req.sanitize('name').escape();
   req.sanitize('name').trim();

   async.parallel({
      genre: function(callback){
         Genre.findById(req.params.id)
         .exec(callback);
      },
      books: function(callback){
         Book.find({ genre: req.params.id })
         .exec(callback);
      },
   }, function(err, results){
      if(err){
         console.log(err);
         return next(err);
      } else {

         console.log(results.genre);

         res.render('genres/create-update', {
            title: `Update Genre: ${results.genre.name}`,
            genre: results.genre,
            books: results.books
         });
      }
   });
};

// Handle Genre update on POST
exports.genre_update_post = function(req, res, next) {

   // validate
   req.checkBody('name', 'Name is required.').notEmpty();

   // sanitize & trim
   req.sanitize('name').escape();
   req.sanitize('name').trim();

   // create new genre object with same ID
   var genre = new Genre({
      name: req.body.name,
      _id: req.params.id
   });

   // retrieve errors
   var errors = req.validationErrors();
   if(errors){
      console.log(errors);

      // re-render the update form
      async.parallel({

         genre: function(callback){
            Genre.find({ _id: req.params.id })
            .exec(callback);
         },
         books: function(callback){
            Book.find({ genre: req.params.id })
            .exec(callback);
         },

      }, function(err, results){
         if(err){
            console.log(err);
            return next(err);
         } else {
            res.render('genres/create-update', {
               title: `Update Genre: ${results.genre.name}`,
               genre: results.genre,
               books: results.books,
               errors: errors
            });
         }
      });
   } else {
      // no errors
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre){
         if(err){
            console.log(err);
            return next(err);
         } else {
            // success
            res.redirect(thegenre.url);
         }
      });
   }
};
