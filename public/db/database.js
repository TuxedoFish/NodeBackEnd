//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
var users = [];
var db;

function initFirebase() {
	//initialises a firebase app with the credential
	admin.initializeApp({
	  credential: admin.credential.cert({
	    "private_key": JSON.parse(process.env.FIREBASE_PRIVATE_KEY)["key"],
	    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
	    "project_id": process.env.FIREBASE_PROJECT_ID,
	    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID
	  }),
	  databaseURL: "https://socialapp-575bc.firebaseio.com"
	});
	db = admin.firestore();
}

/*
Sets up a snapshot listener that waits until the amount of users searching has changed
2 is equal to the integer corresponding to "Constants.STATUS_SEARCHING"
*/
function listenForRequests() {
	var query = db.collection("USERS").where('status', '==', '2')
									  .get().then(snapshot => {
	    snapshot.forEach(doc => {
	    	console.log(doc.first_name, '=>', doc.data());
	    });
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
}

module.exports.listenForRequests = listenForRequests;
module.exports.initFirebase = initFirebase;