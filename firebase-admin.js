// Firebase Admin SDK configuration - Server Side Only

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Store users in memory for the mock implementation
const mockUsers = {};

// Create a mock implementation for development
const createMockFirebaseAdmin = () => {
  console.log('Using mock authentication for development');
  
  // Create mock auth functions
  admin.auth = function() {
    return {
      createUser: async (userData) => {
        console.log('Mock create user:', userData);
        const uid = 'mock-' + Date.now();
        const user = {
          uid: uid,
          email: userData.email,
          emailVerified: userData.emailVerified || false,
          displayName: userData.displayName || userData.email.split('@')[0],
          photoURL: userData.photoURL || '/images/avatars/you.png',
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
          password: userData.password // In a real implementation, this would be hashed
        };
        
        // Store the user in our mock database
        mockUsers[uid] = user;
        mockUsers[userData.email] = user; // Also index by email for getUserByEmail
        
        // Save to users.json file
        try {
          const usersFilePath = path.join(__dirname, 'users.json');
          let users = [];
          
          if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            users = JSON.parse(usersData);
          }
          
          // Add the new user
          users.push({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            creationTime: user.creationTime,
            lastSignInTime: user.lastSignInTime,
            loginCount: 1
          });
          
          // Save the updated users list
          fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        } catch (error) {
          console.error('Error saving user to users.json:', error);
        }
        
        return user;
      },
      getUserByEmail: async (email) => {
        console.log('Mock get user by email:', email);
        
        // Check if the user exists in our mock database
        if (mockUsers[email]) {
          // Update last sign in time
          mockUsers[email].lastSignInTime = new Date().toISOString();
          return mockUsers[email];
        }
        
        // Try to find user in users.json
        try {
          const usersFilePath = path.join(__dirname, 'users.json');
          if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            const users = JSON.parse(usersData);
            const foundUser = users.find(u => u.email === email);
            
            if (foundUser) {
              // Load user into memory
              mockUsers[foundUser.uid] = foundUser;
              mockUsers[email] = foundUser;
              
              // Update login count and last sign in time
              foundUser.loginCount = (foundUser.loginCount || 0) + 1;
              foundUser.lastSignInTime = new Date().toISOString();
              
              // Save updated user info
              fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
              
              return foundUser;
            }
          }
        } catch (error) {
          console.error('Error reading users.json:', error);
        }
        
        // User not found
        const error = new Error('User not found');
        error.code = 'auth/user-not-found';
        throw error;
      },
      getUser: async (uid) => {
        console.log('Mock get user by uid:', uid);
        
        // Check if the user exists in our mock database
        if (mockUsers[uid]) {
          return mockUsers[uid];
        }
        
        // Try to find user in users.json
        try {
          const usersFilePath = path.join(__dirname, 'users.json');
          if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            const users = JSON.parse(usersData);
            const foundUser = users.find(u => u.uid === uid);
            
            if (foundUser) {
              // Load user into memory
              mockUsers[uid] = foundUser;
              mockUsers[foundUser.email] = foundUser;
              return foundUser;
            }
          }
        } catch (error) {
          console.error('Error reading users.json:', error);
        }
        
        // User not found
        const error = new Error('User not found');
        error.code = 'auth/user-not-found';
        throw error;
      },
      // Add a method to verify password (for mock implementation)
      verifyPassword: async (email, password) => {
        // In development, any password is valid for registered users
        try {
          await this.getUserByEmail(email);
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  };
  
  return admin;
};

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  let serviceAccount;
  
  // Try to load from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      // Fix the private key format if needed
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully from environment variable');
    } catch (parseError) {
      console.error('Error parsing Firebase service account from environment variable:', parseError);
      throw parseError;
    }
  } else {
    // Fall back to service account file if it exists
    try {
      if (fs.existsSync(path.join(__dirname, 'firebase-service-account.json'))) {
        serviceAccount = require('./firebase-service-account.json');
        
        // Fix the private key format if needed
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully from service account file');
      } else {
        throw new Error('Service account file not found');
      }
    } catch (fileError) {
      console.error('Error loading service account file:', fileError.message);
      createMockFirebaseAdmin();
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  createMockFirebaseAdmin();
}

module.exports = admin;
