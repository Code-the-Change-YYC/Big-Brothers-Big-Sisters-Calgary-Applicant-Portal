const functions = require('firebase-functions');
const admin = require('firebase-admin');
const tasks = require('./tasks.json');
const taskFactory = require('./taskFactory');
admin.initializeApp();

const db = admin.firestore();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.
exports.addMessage = functions.https.onCall((data) => {
  // Message text passed from the client.
  const text = data.text;
  // returning result.
  return {
    msg: text
  };
});

// Sets the boolean "isCommunityMentor" in Cloud Firestore based on data passed in
exports.updateApplicantType = functions.https.onCall((data, context) => {
  if (!context.auth.uid) { throw new functions.https.HttpsError("unauthenticated", "User not authenticated"); }
  return new Promise((resolve, reject) => {
    db.collection('users').doc(data.id).update({
      isCommunityMentor: data.isCommunityMentor
    })
      .then(() => resolve()) // Successful, resolve with nothing
      .catch(() => reject(new functions.https.HttpsError("internal", "Could not update user type"))); // Failed, reject promise with HTTP error message
  });
});

/**
 * Gets a user from cloud firestore by their ID 
 * @param { Object } data - The body of the firebase function request
 * @param { String } data.id - The ID of the user being requested
 * @param { Object } context - Object containing metadata about the request 
 */
exports.getUserByID = functions.https.onCall((data, context) => {
  if (!context.auth.uid) { throw new functions.https.HttpsError("unauthenticated", "User not authenticated"); }
  return new Promise((resolve, reject) => {
    db.collection('users').doc(data.id).get()
      .then(doc => resolve(doc.data())) // Successful, resolve with user document
      .catch(() => reject(new functions.https.HttpsError("internal", "Could not get user"))); // Failed, reject promise with HTTP error message
  });
});

/**
 * Gets a user's notifications from cloud firestore by their ID 
 * @param { Object } data - The body of the firebase function request
 * @param { String } data.id - The ID of the user whose notifications being requested
 * @param { Object } context - Object containing metadata about the request 
 */
exports.getAllNotifications = functions.https.onCall((data, context) => {
  if (!context.auth.uid) { throw new functions.https.HttpsError("unauthenticated", "User not authenticated"); }
  return new Promise(async (resolve, reject) => {
    try {
      let snapshot = await db.collection(`users/${data.id}/notifications`).get();
      let notifs = snapshot.docs.map(doc => doc.data());
      resolve(notifs); // Successful, resolve with user document
    } catch (err) {
      reject(new functions.https.HttpsError("internal", "Could not get notifications")); // Failed, reject promise with HTTP error message
    }
  });
});

/**
 * Get all users from the database including applicants and administrators
 * @return {Promise} containing a list of user objects if it resolves or an error upon rejection
 * @param { Object } data - unused
 * @param { Object } context - Object containing metadata about the request 
 */
exports.getAllUsers = functions.https.onCall((data, context) => {
  if (!context.auth.uid) { throw new functions.https.HttpsError("unauthenticated", "User not authenticated"); }
  return new Promise(async (resolve, reject) => {
    try {
      let usersSnapshot = await db.collection('users').get();
      let users = usersSnapshot.docs.map(usersSnapshot => usersSnapshot.data());
      resolve(users);
    } catch (err) {
      reject(new functions.https.HttpsError("internal", "Could not get all users"));
    }
  });
});
/**
 * Creates a user in cloud firestore
 * @param { Object } data - The body of the firebase function request containing the new user's data
 */
exports.createUser = functions.https.onCall(async (data) => {
  let userInfo = data;
  userInfo.tasks = taskFactory.getDefaultTasks();
  userInfo.isAdmin = false;
  userInfo.isCommunityMentor = false;
  userInfo.requiresHomeAssessment = false;
  try {
    await sendNotificationByID(userInfo.id, "Congratulations on making your account!");
  } catch (err) {
    throw new functions.https.HttpsError("internal", "Could not create user (failed to create notifications)"); // Failed, reject promise with HTTP error message
  }
  return new Promise((resolve, reject) => {
    db.collection('users').doc(userInfo.id).set(userInfo)
      .then(() => resolve())
      .catch(() => reject(new functions.https.HttpsError("internal", "Could not create user"))); // Failed, reject promise with HTTP error message
  });
});

/**
 * Update the tasks array of an applicant when they mark a task submitted
 * @param { Object } data - The body of the firebase function request
 * @param { String } data.id - The ID of the applicant whose tasks are being updated
 * @param { String } data.serverTasks - The new tasks to replace the existing tasks in firestore
 * @param { Object } context - Object containing metadata about the request 
 */
exports.updateTasks = functions.https.onCall((data, context) => {
  if (!context.auth.uid) { throw new functions.https.HttpsError("unauthenticated", "User not authenticated"); }
  let sendNotification = data.isAdmin ? sendNotificationByID.bind(null, data.id) : sendNotificationToAdmins;
  return new Promise(async (resolve, reject) => {
    try {
      await db.collection('users').doc(data.id).update({
        "tasks": data.serverTasks
      });
      await sendNotification(data.notification);
      resolve();
    } catch (err) {
      reject(new functions.https.HttpsError("internal", "Could not update status"));
    }
  });
});


// export async function updateResources(name, link, isFile = false) {
//   db.collection('resources').doc(name).set({
//     name,
//     link,
//     isFile,
//     date: new Date().toLocaleDateString("en-ca")
//   }).catch((error) => {
//     throw error;
//   });
// }



// export async function uploadFile(name, data) {
//   return await firebase
//     .storage()
//     .ref(name)
//     .put(data);
// }

/**
 * Produces a list of document snapshots containing admins
 */
function getAllAdmins() {
  return db.collection('users').where("isAdmin", "==", true).get();
}

/**
 * Sends a notification to all admins
 * @param { String } notification - The notification message to all admins
 */
async function sendNotificationToAdmins(notification) {
  let adminsSnapshot = await getAllAdmins();
  let adminIDs = adminsSnapshot.docs.map(doc => doc.data().id);

  adminIDs.forEach(adminID => sendNotificationByID(adminID, notification));
}

/**
 * Sends a notification to a user by ID
 * @param { String } notification - The notification message to the user
 * @param { String } id - The ID of the user receiving the notification
 */
function sendNotificationByID(id, notification) {
  trimNotifications(id);
  let notifIDDate = new Date().toISOString("en-CA", { timeZone: "America/Edmonton" }); //sets notification's ID to a specific time (down to the second for easier sorting)
  return db.collection('users').doc(id).collection("notifications").doc(notifIDDate).set({
    message: notification,
    date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" })
  });
}

/**
 * Trims notifications to be less than 50 notifications
 * @param { String } id - The ID of the user receiving the notification
 */
async function trimNotifications(id) {
  let notifsSnapshot = await db.collection('users').doc(id).collection("notifications").get();
  let notifs = notifsSnapshot.docs.map(doc => doc.id);
  //if too many notifications, then delete the 0th in the collection (earliest)
  //the while loop fixes the issue that it "misses" when traffic is high
  while(notifs.length > 49) {
    db.collection('users').doc(id).collection("notifications").doc(notifs[0]).delete();
    notifs.shift();
  }
  return notifs;
}

 /* Deletes a user by their ID
 * @param { Object } data - The body of the firebase function request
 * @param { String } data.id - The ID of the applicant who is being deleted
 * @param { Object } context - Object containing metadata about the request 
 */
exports.deleteUserByID = functions.https.onCall((data, context) => {
  if (!context.auth.uid) { throw new functions.https.HttpsError("unauthenticated", "User not authenticated"); }
  return new Promise((resolve, reject) => {
    let id = data.id;
    db.collection('users').doc(id).delete()
      .then((id) => {

        try {
          admin.auth().deleteUser(id);
          resolve();
        } catch (err) {
          reject(new functions.https.HttpsError("internal", "Unable to delete user auth"));
        }
      }).catch(() => reject(new functions.https.HttpsError("internal", "Could not delete document")));
  });
});
