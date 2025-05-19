// Firebase Client SDK configuration - Client Side Only
// This file provides Firebase authentication functions for the application

// Firebase Authentication Functions

// Sign in with email and password
function signInWithEmailAndPassword(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // User signed in successfully
      const user = userCredential.user;
      console.log('User signed in:', user.email);
      
      // Return user data in the format expected by the application
      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '/images/avatars/you.png',
          emailVerified: user.emailVerified
        }
      };
    })
    .catch((error) => {
      console.error('Error signing in:', error.code, error.message);
      throw new Error(error.message || 'Failed to sign in');
    });
}

// Create a new user with email and password
function createUserWithEmailAndPassword(email, password) {
  return firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // User account created successfully
      const user = userCredential.user;
      console.log('User created:', user.email);
      
      // Update the user profile with a display name
      return user.updateProfile({
        displayName: email.split('@')[0]
      }).then(() => {
        // Return user data in the format expected by the application
        return {
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || email.split('@')[0],
            photoURL: user.photoURL || '/images/avatars/you.png',
            emailVerified: user.emailVerified
          }
        };
      });
    })
    .catch((error) => {
      console.error('Error creating user:', error.code, error.message);
      throw new Error(error.message || 'Failed to create account');
    });
}

// Sign out the current user
function signOut() {
  return firebase.auth().signOut()
    .then(() => {
      console.log('User signed out');
    })
    .catch((error) => {
      console.error('Error signing out:', error);
      throw error;
    });
}

// Get the current user
function getCurrentUser() {
  const user = firebase.auth().currentUser;
  
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '/images/avatars/you.png',
      emailVerified: user.emailVerified
    };
  }
  
  return null;
}

// Export Firebase authentication functions
window.firebaseAuth = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getCurrentUser
};
