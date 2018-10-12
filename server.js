
// where your node app starts

// init project
var express = require('express');
var app = express();
var randomstring = require("randomstring");
const util = require('util');
var moment = require('moment');
const nodeRequest = require('request');

//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
//initialises a firebase app with the credential
admin.initializeApp({
  credential: admin.credential.cert({
    "private_key": JSON.parse(process.env.FIREBASE_PRIVATE_KEY_ID),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID
  }),
  databaseURL: "https://socialapp-575bc.firebaseio.com"
});
//get access to firestore from initialised app
var db = admin.firestore();
//TEST
  var docRef = db.collection('USERS').doc('SOME_ARBITARY_DATA');

  var setAda = docRef.set({
    first: 'Ada',
    last: 'Lovelace',
    born: 1815
  });
//TEST

// server.js
const client_id = process.env.OAUTH_CLIENT_ID;
const client_secret = process.env.OAUTH_CLIENT_SECRET;

var states = { };

var users = [];

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/oauth/authorise", function(request, response) {
  var state = randomstring.generate();
  states[state] = moment();
  var url = util.format('https://uclapi.com/oauth/authorise?client_id=%s&state=%s', client_id, state);
  response.redirect(url);
});

app.get("/oauth/complete", (request, response) => response.sendFile(__dirname + '/views/oauth/complete.html'));

app.get("/oauth/callback", function(request, response) {
  var timeNow = moment();
  if (request.query.state in states) {
    if (moment(states[request.query.state]).add(300, 'seconds') > timeNow) {
      if (request.query.result == "denied") {
        var deniedText = util.format('The login operation for state %s was denied', request.query.state);
        response.send(deniedText);
      } else {
        // Successful login
        var tokenUrl = util.format('https://uclapi.com/oauth/token?client_id=%s&client_secret=%s&code=%s', client_id, client_secret, request.query.code);
        console.log("Token URL: " + tokenUrl);
        var token = "";
        var name = "";
        nodeRequest(tokenUrl, { json: true }, (err, res, body) => {
          if (err) { return console.log(err); }
          token = body.token;
          console.log("Got token: " + token);
          var userDataUrl = util.format('https://uclapi.com/oauth/user/data?client_secret=%s&token=%s', client_secret, token);
          nodeRequest(userDataUrl, {json: true}, (err, res, body) => {
            if (err) { return console.log(err); }
            name = body.full_name;
            var protectionKey = randomstring.generate();
            var user = {
              "first_name": body.given_name,
              "full_name": body.full_name,
              "department": body.department,
              "email": body.email,
              "is_student": body.is_student,
              "token": token,
              "auth_key": protectionKey
            }
            users.push(user);
            var userId = users.length - 1;
            var redirectUrl = util.format('/oauth/complete?id=%s&key=%s', userId, protectionKey);
            response.redirect(redirectUrl);
          });
        });
      }
    } else {
      response.send("Authorisation took more than 5 minutes, so it has failed");
    }
  } else {
    response.send("state does not exist");
  }
});

app.get("/oauth/userdata/:id/:key", function(request, response) {
  if (users[request.params.id]["auth_key"] == request.params.key) {
    response.send(JSON.stringify(
    {
      "ok": true,
      "first_name": users[request.params.id]["first_name"],
      "full_name": users[request.params.id]["full_name"],
      "email": users[request.params.id]["email"],
      "is_student": users[request.params.id]["is_student"],
      "department": users[request.params.id]["department"]
    }));
  }
  else {
    response.send(JSON.stringify(
    {
      "ok": false
    }))
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
