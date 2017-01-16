var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var request = require('request');

var PassportConfigurator = require('loopback-component-passport').PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

boot(app, __dirname);

app.middleware('parse', bodyParser.json());
app.middleware('parse', bodyParser.urlencoded({
  extended: true,
}));

app.middleware('auth', loopback.token({
  model: app.models.accessToken,
}));

app.middleware('session:before', cookieParser(app.get('cookieSecret')));
app.middleware('session', expressSession({
  resave: true,
  saveUninitialized: true,
  secret: app.get('sessionSecret'),
}));

passportConfigurator.init();
passportConfigurator.setupModels({
  userModel: app.models.user,
  userIdentityModel: app.models.userIdentity,
  userCredentialModel: app.models.userCredential,
});

var config = require('../providers.json');
passportConfigurator.configureProvider('google-login', config['google-login']);
passportConfigurator.configureProvider('twitter-link', config['twitter-link']);

app.get('/auth/account', ensureLoggedIn('/login'), function(req, res, next) {
  res.render('pages/loginProfiles', {
    user: req.user,
  });
});

app.get('/link/account', ensureLoggedIn('/login'), function(req, res, next) {
  res.render('pages/loginProfiles', {
    user: req.user,
  });
});

app.get('/', function(req, res, next) {
  res.render('pages/index', {user:
    req.user,
    url: req.url,
  });
});

app.get('/login', function(req, res, next) {
  res.render('pages/login', {
    user: req.user,
    url: req.url,
  });
});

app.get('/auth/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

app.start = function() {
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

if (require.main === module) {
  app.start();
}
