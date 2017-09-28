var express          = require('express');
var path             = require('path');
// var favicon          = require('serve-favicon');
var logger           = require('morgan');
var cookieParser     = require('cookie-parser');
var bodyParser       = require('body-parser');
var mongoose         = require('mongoose');
var expressValidator = require('express-validator'); // https://www.npmjs.com/package/express-validator
var compression      = require('compression');
var helmet           = require('helmet');

// routes
var index   = require('./routes/index');
var users   = require('./routes/users');
var catalog = require('./routes/catalog');
// var wiki = require('./routes/wiki');

var app = express();

const port = process.env.PORT || 4000;

// set up default connection
// var url = 'mongodb://localhost/library';
var url = 'mongodb://jburns:123456@ds155684.mlab.com:55684/library';
mongoose.connect(url);

// get the default connectiotn
var db =  mongoose.connection;

// bind connection to error event
db.on('error', console.error.bind(console,'MongoDB connection error'));

// verify connection works
db.once('open', function(){
   console.log("MongoDB connection established!");
});

// fix to eliminate error message
mongoose.Promise = global.Promise;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// must be below bodyParser
app.use(expressValidator()); // https://www.npmjs.com/package/express-validator
app.use(express.static(path.join(__dirname, 'public')));

// compresses http response sent back to client, reducing time for client to get
// & load the page
// Note: For a high-traffic website in production you wouldn't use this
// middleware. Instead you would use a reverse proxy like Nginx.
app.use(compression());

// Helmet is a middleware package that can help protect your app from some
// well-known web vulnerabilities by setting appropriate HTTP headers
// The command below adds the subset of available headers that makes sense for
// most sites. You can add/disable specific headers as needed by following
// the instructions on npm.
app.use(helmet());

// The paths specified below ('/', '/users', etc) define prefixes to routes
// defined in the imported files. So, if, for example, the imported catalog
// routes module defines a route as /books, to access that data, the url
// is /catalog/books. This eliminates having '/catalog/' included in every route.
app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog);
// app.use('/wiki', wiki);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.listen(port, function(){
   console.log(`Server running on port ${port}`);
})

// The Express application object (app) is now fully configured. This last step is
// to add it to the module exports (this is what allows it to be imported by /bin/www).
// module.exports = app;
