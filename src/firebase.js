// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";           // <-- NEW: For our login system
import { getFirestore } from "firebase/firestore"; // <-- NEW: For our product database

const firebaseConfig = {
  apiKey: "AIzaSyBAn40Z21eO1kGYu5T7VFhebRTwjp_ja68",
  authDomain: "knickel-store.firebaseapp.com",
  projectId: "knickel-store",
  storageBucket: "knickel-store.firebasestorage.app",
  messagingSenderId: "1003790212845",
  appId: "1:1003790212845:web:e75c25c6a60e6f809436e4",
  measurementId: "G-HEB73HP8G2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the tools so the rest of your app can use them!
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);