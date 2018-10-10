//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
//initialises a firebase app with the credential
admin.initializeApp({
  credential: admin.credential.cert({
    "private_key": process.env.FIREBASE_CLIENT_SECRET,
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
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