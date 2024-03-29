/* global require, __dirname */

var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

var db = require('./app/config');
var bcrypt = require('bcrypt-nodejs');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
//creates app as new express app.
var app = express();
//links ejs templates
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
//creating session
  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.session());
});

/*** index ****************************************************/

//routes get/ to ejs index
app.get('/', function(req, res) {
  if (req.session.user) {
    res.render('index');
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
});

//routes get/create to ejs index
app.get('/create', function(req, res) {
  res.render('index');
});

/*** signup ***************************************************/

//routes get to ejs signup
app.get('/signup', function(req, res) {
  res.render('signup');
});

//redirect to index after signing up
app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
//check if username is already taken
  Users.query(function(checkLogin) {
      checkLogin.where('username', '=', username);
    }).fetch().then(function(user) {
        if (user.length > 0) {
          console.log('Username is already taken!');
          res.redirect('/signup');
        } else {
          user = new User({username: username});
          user.hashPassword(password);
          Users.add(user);
          req.session.regenerate(function(){
                  req.session.user = username;
                  res.redirect('/index');
                });
        }
      });
});

/*** login ****************************************************/

//routes get to ejs login
app.get('/login', function(req, res) {
  if (req.session.user) {
    res.redirect('/index');
  } else {
    res.render('login');
  }
});

//routes post to ejs login
app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  //check if matches database;



  Users.query(function(checkLogin) {
    checkLogin.where('username', '=', username);
  }).fetch().then(function(user) {
      if (user.length === 0) {
        res.redirect('/login');
      } else {
        var hash = user.models[0].attributes.password;
        bcrypt.compare(password, hash, function(err,response) {
          if (response) {
            req.session.regenerate(function(){
              req.session.user = username;
              res.redirect('/index');
            });
          } else {
            res.redirect('/login');
          }
        });
      }
    });
});

/*** logout ***************************************************/
// app.post('/logout', function(req, res) {
//   req.session.destroy();
//   res.redirect('/login');
// }

//routes get/links to backbone links collection, which fetches all the links, then with promise sends resulting models as response. Research reset.

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  })
});

//routes post/links to check if link is valid, if is, tries to fetch bb model, sends if found, if not, creates and saves to db and adds to bb collection, then sends.
app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/
//routes get/* (wildcard) if not valid, send to index ejs view, else looks in db with knex queries, updates db visits count, returns concordant redirect.

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
