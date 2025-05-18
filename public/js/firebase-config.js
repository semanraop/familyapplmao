// Mock Authentication System for Maggi Sales Report

// Current user information
let currentUser = null;

// Check if user is already logged in (from session)
fetch('/api/auth/current-user')
  .then(response => response.json())
  .then(data => {
    if (data.user) {
      // User is logged in
      currentUser = data.user;
      updateUIForLoggedInUser();
    } else {
      // No user logged in
      updateUIForLoggedOutUser();
    }
  })
  .catch(error => {
    console.error('Error checking authentication status:', error);
    updateUIForLoggedOutUser();
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
  return fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Failed to sign in');
      });
    }
    return response.json();
  })
  .then(data => {
    currentUser = data.user;
    updateUIForLoggedInUser();
    return data;
  });
}

// Sign up with email and password
function createUserWithEmailAndPassword(email, password) {
  return fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Failed to create account');
      });
    }
    return response.json();
  })
  .then(data => {
    currentUser = data.user;
    updateUIForLoggedInUser();
    return data;
  });
}

// Sign out
function signOut() {
  return fetch('/api/auth/signout', {
    method: 'POST'
  })
  .then(() => {
    currentUser = null;
    updateUIForLoggedOutUser();
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
