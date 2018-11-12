//database.js
//logic to run the back end matching algorithm

//requires firebase module
var admin = require('firebase-admin');
var db;

var spaces = [];

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
			var ID = "id";
			var SPACE_LEFT = "space";

			console.log(docs.length);

			if(docs.length>0) {
				//Logic for if we have got less then 5 users - Put into small groups and add new users to them
				if(spaces.size>0) {
					//We have a group that may be a possible match
					for(var i=0; i<docs.length; i++) {
						//Keeps looking at the amount of spaces remaining until it resolves and finds a fit
						var resolved = false;
						var j = 0;
						while(!resolved) {
							if(spaces[j][SPACE_LEFT]>0) {
								//Tests if there is a strong match between the group and the searching user
								if(isMatchStrong()) {
									//Logic here to add a user to an existing group
									addIntoGroup(docs.get(i), spaces[j][id]);
									resolved = true;
									spaces[j][SPACE_LEFT] --;
								} else {
									//Otherwise carry on to the next element
									j ++;
								}
							} else {
								spaces = spaces.shift;
							}
						}
					}
				} else {
					//Here we do not have any spaces currently in any groups
					//We will only create a group if there is at least 2 users with a significant match
					if(docs.length > 1) {
						console.log("I should make a group");

						//Returns the indexes of the optimal group
						var indexes = getStrengthOfMatches(docs);

						//Creates the group from the indexes
						var group = [];
						indexes.forEach(function(index) { group.push(docs[index]); });

						//Function creates the group in the database
						createGroupFromArray(group, 2);
					}
				}
			}

			//having completed all of the logic it unlocks the system
			lock=false;
		}
	}, err => {
	  console.log(`Encountered error: ${err}`);
	});
}

function createGroupFromArray(group, size) {
	var groupFileName = generateGroupFileName();
	//Create group file in GROUPS with all the relevant information
	db.collection("GROUPS").doc(groupFileName).set(getGroupDoc(size));
	//Add the file locations of the users to the file
	for(var i=0; i<group.length; i++) {
		db.collection("GROUPS").doc(groupFileName).collection("ids").doc(i).set({id: group.get(i).get("id")});
	}
	//Update all of the individual elements
	group.forEach(function(user) {
		//add location of the group data
		//also update the status of the user to finish
		db.collection("USERS").doc(user.get("id")).update(getUserInformation(groupFileName, groupFileName));
		
		var other_id = 0;
		for(var i=0; i<group.length; i++) {
			if(group[i].get("id")!=user.get("id")) {
				console.log("Adding documents at: " + user.get("id") + " --> MATCHES --> " + other_id);
				
				db.collection("USERS").doc(user.get("id")).collection("MATCHES")
				.doc(other_id.toString()).set(getUserProfile(group[i].get("id"), group[i].get("first_name")));
				other_id ++;
			}
		}
	});

	//Add the space in this array to be checked
	spaces.push( { id: groupFileName, space: (5-size) } );
}

/*
Given one element from a querySnapshot this function should update an existing group
*/
function addIntoGroup(user, groupFileName) {
	var groupQuery = db.collection('GROUPS').doc(groupFileName).collection(ids).get()
  		.then(snapshot => {
  			//Obtain the current size of the group 
  			//This will be the next "id" to add into as we start at 0
  			var groupSize = snapshot.size;
  			//Loop through the current users and add into them the new user info
  			snapshot.docs.forEach(function(member) {
  			db.collection("USERS").doc(member.get("id")).collection("MATCHES")
				.doc(groupSize).set(getUserProfile(user.get("id"), user.get("first_name")));
			});
			//Now that we have updated the information for each user
			//Update the info for the group file
			db.collection('GROUPS').doc(groupFileName).set(getGroupDoc(groupSize+1));
	}, err => {
	  console.log(`Encountered error: ${err}`);
	});
}

/*
Will test for the strength between a given user and an existing group
*/
function isMatchStrong() {
	return true;
}

/*
Takes a snapshot of the available users and returns the BEST match of the users
*/
function getStrengthOfMatches(freeUsers) {
	//An optimisation problem to find the largest but strongest match for a given set of users

	//PLACEHOLDER
	//Returns the maximal group from the given snapshot
	return [0, 1];
}

/*
Returns data to be accessible by the matched user without clicking on the profile
*/
function getUserProfile(id, firstName) {
	return data = {
		first_name: firstName,
		id: id
	};
}

/*
Returns the map to be added to the "GROUPS" collection
*/
function getGroupDoc(groupSize) {
	return data = {
		group_size: groupSize
	};
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