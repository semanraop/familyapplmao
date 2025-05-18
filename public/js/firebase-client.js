// Firebase Client SDK configuration - Client Side Only
// This file is for browser use and contains only the public Firebase configuration

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0E09R2p2DAMqgCMqQYpWAB7YrvAzoG28",
  authDomain: "familyig-9a0ae.firebaseapp.com",
  projectId: "familyig-9a0ae",
  storageBucket: "familyig-9a0ae.firebasestorage.app",
  messagingSenderId: "375827685364",
  appId: "1:375827685364:web:a6cc543a250413e9f6a3a1",
  measurementId: "G-1WC81785TM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
