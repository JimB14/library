// users.js - users route module

var express = require('express');
var router = express.Router();

// Note: all users routes have prefix '/users' added per app.js

/**
 * The route defines a callback that will be invoked whenever an HTTP GET request
 * with the correct pattern is detected. The matching pattern is the route
 * specified when the module is imported ('/users') plus whatever is defined
 * in this file ('/'). In other words, this route will be used when a URL
 * of /users/ is received, because in app.js this code --  app.use('/users', users) --
 * adds the prefix '/user' to the routes in routes/users.js. This allows shorter
 * routes to be used in the route files, making the code more parsimonious. This
 * shows how crucial the app.js file is to an application, acting as a controller
 * and configurations file.
 *
 * Note that the 'next' argument in the callback function is optional
 *
 */
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Cool route ( accessible @ http://localhost:3300/users/cool )
router.get('/cool', function(req, res){
   res.render('cool', {
      message:'You\'re so cool!'
   });
});


// lastly exports the router from the module (this is what allows the file to
// be imported into app.js).
module.exports = router;
