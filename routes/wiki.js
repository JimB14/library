// wiki.js - Wiki route module

var express = require('express')
var router = express.Router()

// Home page route
router.get('/', function (req, res) {
  res.send('Wiki home page')
})

// * : The endpoint may have an arbitrary string where the * character is
// placed. E.g. a route path of 'ab*cd' will match endpoints abcd, abXcd,
// abSOMErandomTEXTcd, and so on.
router.get('/image/cav*/:name', function (req, res, next) {

   console.log(__dirname);
   // return;

   var options = {
    root: '/Users/Jim/Pictures/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = req.params.name + '.jpg';
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });

   // res.json({
   //   success: true,
   //   message: 'You have reached the wiki/about route!'
   // })
})

module.exports = router
