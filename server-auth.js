// Authentication routes for Maggi Sales Report
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      // User is authenticated via session
      if (!req.session.user) {
        // If we have userId but not user data, fetch it
        try {
          const userRecord = await admin.auth().getUser(req.session.userId);
          req.session.user = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || userRecord.email.split('@')[0],
            photoURL: userRecord.photoURL || '/images/avatars/you.png'
          };
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Clear invalid session
          req.session.userId = null;
          req.session.user = null;
        }
      }
      req.user = req.session.user;
    }
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next();
  }
};

// Get current user
router.get('/current-user', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// Sign up
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
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 1
      };
      
      // Store user in session
      req.session.userId = userRecord.uid;
      req.session.user = userData;
      
      // Save user to users.json file
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

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // For our mock implementation, we'll verify the password
      // In a real Firebase implementation, we'd use Firebase Authentication
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
        lastLogin: new Date().toISOString()
      };
      
      // Store user in session
      req.session.userId = userRecord.uid;
      req.session.user = userData;
      
      // Update user in users.json file
      try {
        let users = [];
        if (fs.existsSync(path.join(__dirname, 'users.json'))) {
          users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
        }
        
        // Find and update the user in the file
        const existingUserIndex = users.findIndex(u => u.email === email);
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
