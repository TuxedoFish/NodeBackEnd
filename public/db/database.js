//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
var key = JSON.parse(process.env.FIREBASE_PRIVATE_KEY)["key"];

module.exports() = {
	initFirebase: function() {
		//initialises a firebase app with the credential
		admin.initializeApp({
		  credential: admin.credential.cert({
		    "private_key": key,
		    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
		    "project_id": process.env.FIREBASE_PROJECT_ID,
		    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID
		  }),
		  databaseURL: "https://socialapp-575bc.firebaseio.com"
		});
	}
	};
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