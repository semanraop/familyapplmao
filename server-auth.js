// Authentication routes for Maggi Sales Report
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    // Check for Firebase ID token in the session
    if (req.session && req.session.userId) {
      // User is authenticated via session
      if (!req.session.user) {
        // If we have userId but not user data, fetch it from Firebase
        try {
          const userRecord = await admin.auth().getUser(req.session.userId);
          
          // Create user object from Firebase user record
          req.session.user = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || userRecord.email.split('@')[0],
            photoURL: userRecord.photoURL || '/images/avatars/you.png',
            emailVerified: userRecord.emailVerified
          };
        } catch (error) {
          console.error('Error fetching user data from Firebase:', error);
          // Clear invalid session
          req.session.userId = null;
          req.session.user = null;
        }
      }
      
      // Set user data on request object
      req.user = req.session.user;
    }
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    next();
  }
};

// Get current user
router.get('/current-user', (req, res) => {
  if (req.user) {
    // User is authenticated in the session
    res.json({ user: req.user });
  } else {
    // No authenticated user found in session
    res.json({ user: null });
  }
});

// Verify Firebase ID token and create session
router.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }
  
  try {
    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get the user record
    const userRecord = await admin.auth().getUser(uid);
    
    // Create user data
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || userRecord.email.split('@')[0],
      photoURL: userRecord.photoURL || '/images/avatars/you.png',
      emailVerified: userRecord.emailVerified,
      lastLogin: new Date().toISOString()
    };
    
    // Store user in session
    req.session.userId = userRecord.uid;
    req.session.user = userData;
    
    // Update user in users.json file
    updateUserInFile(userData);
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Sign up - Server-side handler for client-side Firebase signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Check if user already exists
      try {
        await admin.auth().getUserByEmail(email);
        return res.status(400).json({ error: 'Email already in use' });
      } catch (userNotFoundError) {
        // User doesn't exist, we can create it
        if (userNotFoundError.code !== 'auth/user-not-found') {
          throw userNotFoundError;
        }
      }
      
      // Create user with Firebase Admin SDK
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
        displayName: email.split('@')[0]
      });
      
      // Create user data
      const userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || email.split('@')[0],
        photoURL: userRecord.photoURL || '/images/avatars/you.png',
        emailVerified: userRecord.emailVerified,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 1
      };
      
      // Store user in session
      req.session.userId = userRecord.uid;
      req.session.user = userData;
      
      // Save user to users.json file for backup/development purposes
      try {
        let users = [];
        if (fs.existsSync(path.join(__dirname, 'users.json'))) {
          users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
        }
        
        // Add new user
        users.push(userData);
        
        fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
      } catch (error) {
        console.error('Error saving user to file:', error);
        // Continue even if saving to file fails
      }
      
      // Return user data to client
      res.json({ user: userData });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(400).json({ error: error.message || 'Failed to create user' });
    }
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign in - Server-side handler for client-side Firebase signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password, idToken } = req.body;
    
    // If we have an idToken from Firebase client SDK, use that
    if (idToken) {
      try {
        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        // Get the user record
        const userRecord = await admin.auth().getUser(uid);
        
        // Create user data
        const userData = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userRecord.email.split('@')[0],
          photoURL: userRecord.photoURL || '/images/avatars/you.png',
          emailVerified: userRecord.emailVerified,
          lastLogin: new Date().toISOString()
        };
        
        // Store user in session
        req.session.userId = userRecord.uid;
        req.session.user = userData;
        
        // Update user in users.json file
        updateUserInFile(userData);
        
        return res.json({ user: userData });
      } catch (error) {
        console.error('Error verifying ID token:', error);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }
    
    // Fall back to email/password if no idToken
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // For development/mock implementation, verify the password
      if (admin.auth().verifyPassword) {
        const isValid = await admin.auth().verifyPassword(email, password);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      }
      
      // Create user data
      const userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || email.split('@')[0],
        photoURL: userRecord.photoURL || '/images/avatars/you.png',
        emailVerified: userRecord.emailVerified,
        lastLogin: new Date().toISOString()
      };
      
      // Store user in session
      req.session.userId = userRecord.uid;
      req.session.user = userData;
      
      // Update user in users.json file
      updateUserInFile(userData);
      
      res.json({ user: userData });
    } catch (error) {
      console.error('Error signing in:', error);
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error in signin:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Helper function to update user in users.json file
function updateUserInFile(userData) {
  try {
    let users = [];
    if (fs.existsSync(path.join(__dirname, 'users.json'))) {
      users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
    }
    
    // Find and update the user in the file
    const existingUserIndex = users.findIndex(u => u.email === userData.email);
    if (existingUserIndex >= 0) {
      // Update existing user
      users[existingUserIndex].lastLogin = userData.lastLogin;
      if (!users[existingUserIndex].loginCount) {
        users[existingUserIndex].loginCount = 0;
      }
      users[existingUserIndex].loginCount++;
    } else {
      // Add new user if not found
      userData.createdAt = new Date().toISOString();
      userData.loginCount = 1;
      users.push(userData);
    }
    
    fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error updating user in file:', error);
    // Continue even if saving to file fails
  }
}

// Sign out
router.post('/signout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to sign out' });
    }
    res.json({ success: true });
  });
});

module.exports = {
  router,
  authenticateUser
};
