// Firebase Admin SDK configuration - Server Side Only
// This file should be in the root directory, not in public/js

/**
 * IMPORTANT: This file should not be in the public/js directory as it contains
 * sensitive credentials that should never be exposed to the client.
 * 
 * Move this file to the root directory of your project and rename it to
 * firebase-admin.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
let firebaseAdmin = null;

try {
  // Try to load service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully from environment variable');
  } else {
    // Try to load from service account file
    const serviceAccount = require('../firebase-service-account.json');
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully from service account file');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Using mock authentication for development');
}

module.exports = admin;