//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
//loads in the account key password
var serviceAccount = require('path/to/serviceAccountKey.json');
//initialises a firebase app with the credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});