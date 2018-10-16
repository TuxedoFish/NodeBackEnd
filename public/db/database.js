//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
var db;

var lock = false;

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
	console.log("begun search");
	var query = db.collection("USERS").where('status', '==', 2);

	var observer = query.onSnapshot(querySnapshot => {
		if(!lock) {
			//locks the logic from running until the current session is finished going through the users and grabs the documents
			lock=true;
		    var docs = querySnapshot.docs;
		    //purely for debugging purposes!
			console.log(`Received query snapshot of size ${querySnapshot.size}`);

			var finished = true;
			while(docs.length>=5 || !finished) {
				finished=false;
				//We have 5 or more people and therefore we can create at least one group
				//Pick first 5 elements
				var group = docs.splice(0, 5);
				//Set up a document in group
				var groupFileName = generateGroupFileName();
				//Create group file in GROUPS with all the relevant information
				db.collection("GROUPS").doc(groupFileName).set(getGroupDoc(5));
				//Update all of the individual elements
				group.forEach(function(user) {
					//add location of the group data
					//also update the status of the user to finish
					db.collection("USERS").doc(user.get("id")).update(getUserInformation(groupFileName, groupFileName));
					
					var other_id = 0;
					for(var i=0; i<group.length; i++) {
						if(group[i].get("id")!=user.get("id")) {
							console.log("Adding documents at: " + user.get("id") + " --> MATCHES --> " + other_id);
							db.collection("USERS").doc(user.get("id")).collection("MATCHES").doc(other_id.toString()).set(
								getUserProfile(group[i].get("id"), group[i].get("first_name")));
							other_id ++;
						}
					}
				});
				//finished this logic loop so if there is no more multiples of 5 will finish
				finished=true;
			}
			if(docs.size>0) {
				//Logic for if we have got less then 5 users - Put into small groups and add new users to them
			}

			//having completed all of the logic it unlocks the system
			lock=false;
		}
	}, err => {
	  console.log(`Encountered error: ${err}`);
	});
}

/*
Returns data to be accessible by the matched user without clicking on the profile
*/
function getUserProfile(id, firstName) {
	return data = {
		first_name: firstName,
		id: id
	}
}

/*
Returns the map to be added to the "GROUPS" collection
*/
function getGroupDoc(groupSize) {
	return data = {
		group_size: groupSize
	}
}

/*
Returns the information to be updated to the user in "USERS" collection
*/
function getUserInformation(groupName, groupFileLoc) {
	return data = {
		group_name: groupName,
		group_file_loc: groupFileLoc,
		status: 4
	};
}


/*
Creates a function name given the current time and day and a random string of characters
*/
function generateGroupFileName() {
	//Beginning of file name is the date
	var date = new Date();
	var dd = date.getDate();
	var mm = date.getMonth()+1; //January is 0!
	var yyyy = date.getFullYear();
	if(dd<10){
    dd='0'+dd;
	} 
	if(mm<10){
	    mm='0'+mm;
	} 

	var fileName = dd.toString() + "." + mm.toString() + "." + yyyy.toString();
	//Add space in
	fileName += "_";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 10; i++)
		fileName += possible.charAt(Math.floor(Math.random() * possible.length));

	return fileName;
}

module.exports.listenForRequests = listenForRequests;
module.exports.initFirebase = initFirebase;