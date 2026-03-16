 const firebaseConfig = {
  apiKey: "AIzaSyAPIBH3ZyKjsth-Nk1qbHS6UNR5CVxV79k",
  authDomain: "zenithtail.firebaseapp.com",
  projectId: "zenithtail",
  storageBucket: "zenithtail.firebasestorage.app",
  messagingSenderId: "293020299978",
  appId: "1:293020299978:web:a8a32c67c9839452a0ba33",
  measurementId: "G-1NJ1CS271N"
};
 

// 2. Initialize Firebase (Prevents the "app already exists" error)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Initialize Auth and Firestore so they can be used across your site
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase Engine Started! 🚀");
