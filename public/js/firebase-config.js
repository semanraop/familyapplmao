// Firebase Configuration for Client-Side Authentication

// Firebase configuration object for familyig-9a0ae project
const firebaseConfig = {
  apiKey: "AIzaSyA0E09R2p2DAMqgCMqQYpWAB7YrvAzoG28",
  authDomain: "familyig-9a0ae.firebaseapp.com",
  projectId: "familyig-9a0ae",
  storageBucket: "familyig-9a0ae.firebasestorage.app",
  messagingSenderId: "375827685364",
  appId: "1:375827685364:web:a6cc543a250413e9f6a3a1",
  measurementId: "G-1WC81785TM"
};

// Import Firebase modules
// These imports are loaded from the Firebase SDK CDN which should be included in your HTML

// Current user information
let currentUser = null;

// Initialize Firebase when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase if it hasn't been initialized yet
  if (!window.firebase) {
    console.error('Firebase SDK not loaded. Make sure to include the Firebase SDK in your HTML.');
    return;
  }
  
  // Initialize Firebase
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    
    // Initialize Firestore for chat functionality
    if (firebase.firestore) {
      window.firebaseFirestore = firebase.firestore();
      
      // Enable offline persistence if supported
      firebase.firestore().enablePersistence()
        .catch(function(err) {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.log('Firestore persistence not enabled: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required for persistence
            console.log('Firestore persistence not supported by this browser');
          }
        });
    }
  }
  
  // Set up auth state listener
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in
      currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '/images/avatars/you.png'
      };
      updateUIForLoggedInUser();
    } else {
      // User is signed out
      currentUser = null;
      updateUIForLoggedOutUser();
    }
  });
});

// Update UI for logged in user
function updateUIForLoggedInUser() {
  // Show user-specific elements
  document.querySelectorAll('.auth-required').forEach(el => {
    el.style.display = 'block';
  });
  
  // Hide login elements
  document.querySelectorAll('.auth-login').forEach(el => {
    el.style.display = 'none';
  });
  
  // Update user info display
  const userInfoElements = document.querySelectorAll('.user-info');
  userInfoElements.forEach(el => {
    el.innerHTML = `
      <div class="user-avatar" style="background-image: url('${currentUser.photoURL}')"></div>
      <div class="user-name">${currentUser.displayName}</div>
    `;
  });
  
  // Dispatch event for other components to react
  document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: currentUser }));
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
  // Hide user-specific elements
  document.querySelectorAll('.auth-required').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show login elements
  document.querySelectorAll('.auth-login').forEach(el => {
    el.style.display = 'block';
  });
  
  // Dispatch event for other components to react
  document.dispatchEvent(new CustomEvent('userLoggedOut'));
}

// Sign in with email and password
function signInWithEmailAndPassword(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      return { user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '/images/avatars/you.png'
      }};
    })
    .catch((error) => {
      throw new Error(error.message || 'Failed to sign in');
    });
}

// Sign up with email and password
function createUserWithEmailAndPassword(email, password) {
  return firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed up and signed in
      const user = userCredential.user;
      
      // Update profile with display name
      return user.updateProfile({
        displayName: email.split('@')[0]
      }).then(() => {
        return { user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          photoURL: user.photoURL || '/images/avatars/you.png'
        }};
      });
    })
    .catch((error) => {
      throw new Error(error.message || 'Failed to create account');
    });
}

// Sign out
function signOut() {
  return firebase.auth().signOut()
    .catch((error) => {
      console.error('Error signing out:', error);
    });
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// Export Firebase functions
window.firebaseAuth = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getCurrentUser
};
