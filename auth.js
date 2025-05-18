// Simple mock authentication system for Maggi Sales Report
const fs = require('fs');
const path = require('path');

// In-memory user store
const mockUsers = {};

// Initialize the auth system
function init() {
  // Load existing users from users.json if it exists
  try {
    if (fs.existsSync(path.join(__dirname, 'users.json'))) {
      const usersData = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8');
      const users = JSON.parse(usersData);
      
      // Add users to in-memory storage
      users.forEach(user => {
        mockUsers[user.email] = user;
        mockUsers[user.uid] = user;
      });
      
      console.log(`Loaded ${users.length} users from users.json`);
    } else {
      // Create users.json if it doesn't exist
      fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify([], null, 2));
      console.log('Created empty users.json file');
    }
  } catch (error) {
    console.error('Error loading users from users.json:', error);
    // Create users.json if there was an error
    try {
      fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify([], null, 2));
      console.log('Created empty users.json file after error');
    } catch (writeError) {
      console.error('Error creating users.json file:', writeError);
    }
  }
  
  return {
    mockUsers,
    authenticateUser,
    createUser,
    signIn,
    getCurrentUser,
    saveUserToFile
  };
}

// Authentication middleware
function authenticateUser(req, res, next) {
  try {
    if (req.session && req.session.userId) {
      // User is authenticated via session
      if (!req.session.user) {
        // If we have userId but not user data, fetch it
        try {
          // Check if user exists in mockUsers
          if (mockUsers[req.session.userId]) {
            const userRecord = mockUsers[req.session.userId];
            req.session.user = {
              uid: userRecord.uid,
              email: userRecord.email,
              displayName: userRecord.displayName || userRecord.email.split('@')[0],
              photoURL: userRecord.photoURL || '/images/avatars/you.png'
            };
          } else {
            // User not found, clear session
            req.session.userId = null;
            req.session.user = null;
          }
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
}

// Create a new user
function createUser(email, password) {
  // Check if user already exists
  if (mockUsers[email]) {
    throw new Error('Email already in use');
  }
  
  // Create a new mock user
  const uid = 'mock-' + Date.now();
  const userData = {
    uid: uid,
    email: email,
    displayName: email.split('@')[0],
    photoURL: '/images/avatars/you.png',
    emailVerified: false,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    loginCount: 1,
    password: password // In a real app, this would be hashed
  };
  
  // Store user in mock database
  mockUsers[uid] = userData;
  mockUsers[email] = userData;
  
  // Save to file
  saveUserToFile(userData);
  
  return userData;
}

// Sign in a user
function signIn(email, password) {
  // Check if user exists
  if (!mockUsers[email]) {
    throw new Error('Invalid email or password');
  }
  
  // Check password
  const user = mockUsers[email];
  if (user.password !== password) {
    throw new Error('Invalid email or password');
  }
  
  // Update user data
  user.lastLogin = new Date().toISOString();
  user.loginCount = (user.loginCount || 0) + 1;
  
  // Save updated user info
  saveUserToFile(user);
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL || '/images/avatars/you.png',
    lastLogin: user.lastLogin,
    loginCount: user.loginCount
  };
}

// Get current user
function getCurrentUser(userId) {
  if (mockUsers[userId]) {
    const user = mockUsers[userId];
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '/images/avatars/you.png'
    };
  }
  return null;
}

// Save user to file
function saveUserToFile(userData) {
  try {
    let users = [];
    if (fs.existsSync(path.join(__dirname, 'users.json'))) {
      users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
    }
    
    // Check if user already exists in file
    const existingUserIndex = users.findIndex(u => u.email === userData.email);
    if (existingUserIndex >= 0) {
      // Update existing user
      users[existingUserIndex] = {
        ...users[existingUserIndex],
        ...userData
      };
    } else {
      // Add new user
      users.push(userData);
    }
    
    fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving user to file:', error);
    return false;
  }
}

module.exports = init();
