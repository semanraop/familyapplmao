// Authentication UI for Maggi Sales Report
document.addEventListener('DOMContentLoaded', function() {
  // Create auth container if it doesn't exist
  createAuthContainer();
  
  // Initialize auth UI
  initAuthUI();
  
  // Listen for user auth events
  document.addEventListener('userLoggedIn', function(e) {
    // Update chat UI with user info
    updateChatWithUserInfo(e.detail);
  });
  
  document.addEventListener('userLoggedOut', function() {
    // Hide chat UI when logged out
    const chatContainer = document.getElementById('chat-container');
    const chatToggleButton = document.getElementById('chat-toggle-button');
    
    if (chatContainer) chatContainer.style.display = 'none';
    if (chatToggleButton) chatToggleButton.style.display = 'none';
  });
  
  // Create auth container
  function createAuthContainer() {
    // Check if container already exists
    if (document.getElementById('auth-container')) return;
    
    // Create main container
    const container = document.createElement('div');
    container.id = 'auth-container';
    
    // Add styles
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.display = 'none';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.zIndex = '1001';
    
    // Create auth form
    const authForm = document.createElement('div');
    authForm.className = 'auth-form';
    authForm.style.backgroundColor = 'white';
    authForm.style.borderRadius = '10px';
    authForm.style.padding = '30px';
    authForm.style.width = '350px';
    authForm.style.maxWidth = '90%';
    authForm.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    
    // Create login form
    const loginForm = document.createElement('form');
    loginForm.id = 'login-form';
    loginForm.innerHTML = `
      <h2 style="color: #d32f2f; margin-top: 0; text-align: center;">Sign In</h2>
      <div id="auth-error" style="color: #d32f2f; margin-bottom: 15px; display: none;"></div>
      
      <div style="margin-bottom: 15px;">
        <label for="email" style="display: block; margin-bottom: 5px;">Email</label>
        <input type="email" id="email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="password" style="display: block; margin-bottom: 5px;">Password</label>
        <input type="password" id="password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      
      <button type="submit" style="width: 100%; padding: 12px; background-color: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Sign In</button>
      
      <div style="margin-top: 20px; text-align: center;">
        <p>Don't have an account? <a href="#" id="show-signup" style="color: #d32f2f; text-decoration: none;">Sign Up</a></p>
      </div>
    `;
    
    // Create signup form
    const signupForm = document.createElement('form');
    signupForm.id = 'signup-form';
    signupForm.style.display = 'none';
    signupForm.innerHTML = `
      <h2 style="color: #d32f2f; margin-top: 0; text-align: center;">Create Account</h2>
      <div id="signup-error" style="color: #d32f2f; margin-bottom: 15px; display: none;"></div>
      
      <div style="margin-bottom: 15px;">
        <label for="signup-email" style="display: block; margin-bottom: 5px;">Email</label>
        <input type="email" id="signup-email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label for="signup-password" style="display: block; margin-bottom: 5px;">Password</label>
        <input type="password" id="signup-password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label for="signup-confirm" style="display: block; margin-bottom: 5px;">Confirm Password</label>
        <input type="password" id="signup-confirm" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      
      <button type="submit" style="width: 100%; padding: 12px; background-color: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Create Account</button>
      
      <div style="margin-top: 20px; text-align: center;">
        <p>Already have an account? <a href="#" id="show-login" style="color: #d32f2f; text-decoration: none;">Sign In</a></p>
      </div>
    `;
    
    // Add forms to auth form container
    authForm.appendChild(loginForm);
    authForm.appendChild(signupForm);
    
    // Add auth form to container
    container.appendChild(authForm);
    
    // Add container to body
    document.body.appendChild(container);
  }
  
  // Initialize auth UI
  function initAuthUI() {
    // Add auth button to header
    addAuthButton();
    
    // Set up form toggle events
    document.getElementById('show-signup').addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('signup-form').style.display = 'block';
    });
    
    document.getElementById('show-login').addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
    });
    
    // Set up login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorElement = document.getElementById('auth-error');
      
      // Clear previous errors
      errorElement.style.display = 'none';
      
      // Sign in with Firebase
      window.firebaseAuth.signInWithEmailAndPassword(email, password)
        .then(() => {
          // Hide auth container on successful login
          document.getElementById('auth-container').style.display = 'none';
        })
        .catch(error => {
          // Show error message
          errorElement.textContent = error.message;
          errorElement.style.display = 'block';
        });
    });
    
    // Set up signup form submission
    document.getElementById('signup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      const errorElement = document.getElementById('signup-error');
      
      // Clear previous errors
      errorElement.style.display = 'none';
      
      // Check if passwords match
      if (password !== confirm) {
        errorElement.textContent = 'Passwords do not match';
        errorElement.style.display = 'block';
        return;
      }
      
      // Create account with Firebase
      window.firebaseAuth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          // Hide auth container on successful signup
          document.getElementById('auth-container').style.display = 'none';
        })
        .catch(error => {
          // Show error message
          errorElement.textContent = error.message;
          errorElement.style.display = 'block';
        });
    });
  }
  
  // Add auth button to header
  function addAuthButton() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    // Create auth button container
    const authButtonContainer = document.createElement('div');
    authButtonContainer.className = 'auth-buttons';
    authButtonContainer.style.marginTop = '10px';
    
    // Create login button (shown when logged out)
    const loginButton = document.createElement('button');
    loginButton.className = 'btn btn-primary auth-login';
    loginButton.textContent = 'Sign In';
    loginButton.addEventListener('click', showAuthModal);
    
    // Create user info display (shown when logged in)
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info auth-required';
    userInfo.style.display = 'none';
    userInfo.style.display = 'flex';
    userInfo.style.alignItems = 'center';
    userInfo.style.gap = '10px';
    
    // Create logout button (shown when logged in)
    const logoutButton = document.createElement('button');
    logoutButton.className = 'btn btn-secondary auth-required';
    logoutButton.textContent = 'Sign Out';
    logoutButton.style.display = 'none';
    logoutButton.addEventListener('click', function() {
      window.firebaseAuth.signOut()
        .then(() => {
          console.log('User signed out');
        })
        .catch(error => {
          console.error('Error signing out:', error);
        });
    });
    
    // Add buttons to container
    authButtonContainer.appendChild(loginButton);
    authButtonContainer.appendChild(userInfo);
    authButtonContainer.appendChild(logoutButton);
    
    // Add container to header
    header.appendChild(authButtonContainer);
  }
  
  // Show auth modal
  function showAuthModal() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
      authContainer.style.display = 'flex';
    }
  }
  
  // Update chat with user info
  function updateChatWithUserInfo(user) {
    // Show chat button
    const chatToggleButton = document.getElementById('chat-toggle-button');
    if (chatToggleButton) chatToggleButton.style.display = 'block';
    
    // Update current user in chat state
    if (window.updateCurrentUser) {
      window.updateCurrentUser(user);
    }
  }
});
