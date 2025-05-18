// Chat functionality for Maggi Sales Report
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  let isAuthenticated = false;
  
  // Listen for auth state changes
  document.addEventListener('userLoggedIn', function(e) {
    isAuthenticated = true;
    updateCurrentUser(e.detail);
  });
  
  document.addEventListener('userLoggedOut', function() {
    isAuthenticated = false;
  });
  // Create chat toggle button - only visible when authenticated
  createChatToggleButton();
  
  // Hide chat button until authenticated
  const chatToggleButton = document.getElementById('chat-toggle-button');
  if (chatToggleButton) {
    chatToggleButton.style.display = 'none';
  }
  // Chat state
  const chatState = {
    // Sample users (will be replaced with real users when user accounts are implemented)
    users: [
      { id: 1, name: 'Ahmad', avatar: 'user1.png', online: true },
      { id: 2, name: 'Sarah', avatar: 'user2.png', online: true },
      { id: 3, name: 'Raj', avatar: 'user3.png', online: false },
      { id: 4, name: 'Mei Ling', avatar: 'user4.png', online: true },
      { id: 5, name: 'Amir', avatar: 'user5.png', online: true },
      { id: 6, name: 'Priya', avatar: 'user6.png', online: false },
      { id: 7, name: 'Zack', avatar: 'user7.png', online: true },
      { id: 8, name: 'Nurul', avatar: 'user8.png', online: true }
    ],
    currentUser: { id: 0, name: 'You', avatar: 'you.png', online: true, authenticated: false },
    selectedUser: null, // Currently selected user for chat
    messages: {},       // Messages organized by user ID
    userContext: {}     // Store user-specific context
  };

  // Create chat container if it doesn't exist
  let chatContainer = document.getElementById('chat-container');
  if (!chatContainer) {
    chatContainer = createChatContainer();
  }

  // Initialize chat UI
  initChatUI();

  // Initialize chat functionality
  function initChatUI() {
    // Render users list
    renderUsersList();
    
    // Setup message form
    setupMessageForm();
    
    // Add welcome message
    addSystemMessage('Welcome to the Maggi Sales Team Chat!');
    addSystemMessage('Select a user from the list to start chatting.');
    addSystemMessage('Note: User accounts will be implemented in a future update.');
  }

  // Render the users list
  function renderUsersList() {
    const usersList = document.getElementById('chat-users-list');
    if (!usersList) return;
    
    // Clear existing users
    usersList.innerHTML = '';
    
    // Add current user first
    const currentUserItem = createUserListItem(chatState.currentUser);
    currentUserItem.classList.add('current-user');
    usersList.appendChild(currentUserItem);
    
    // Add separator
    const separator = document.createElement('div');
    separator.className = 'user-separator';
    usersList.appendChild(separator);
    
    // Add other users
    chatState.users.forEach(user => {
      usersList.appendChild(createUserListItem(user));
    });
  }
  
  // Create a user list item
  function createUserListItem(user) {
    const userItem = document.createElement('div');
    userItem.className = 'chat-user';
    userItem.dataset.userId = user.id;
    
    if (!user.online) userItem.classList.add('offline');
    if (chatState.selectedUser && chatState.selectedUser.id === user.id) {
      userItem.classList.add('selected');
    }
    
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.style.backgroundImage = `url('/images/avatars/${user.avatar}')`;
    
    const name = document.createElement('div');
    name.className = 'user-name';
    name.textContent = user.name;
    
    userItem.appendChild(statusIndicator);
    userItem.appendChild(avatar);
    userItem.appendChild(name);
    
    // Add click event to select this user for chat
    userItem.addEventListener('click', () => selectUserForChat(user));
    
    return userItem;
  }
  
  // Setup message form
  function setupMessageForm() {
    const messageForm = document.getElementById('chat-message-form');
    const messageInput = document.getElementById('chat-message-input');
    
    if (!messageForm || !messageInput) return;
    
    messageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const message = messageInput.value.trim();
      if (!message) return;
      
      // Check if a user is selected
      if (!chatState.selectedUser) {
        addSystemMessage('Please select a user to chat with first.');
        return;
      }
      
      // Add user message to chat
      addCurrentUserMessage(message);
      
      // Clear input
      messageInput.value = '';
      
      // Simulate response from the selected user
      simulateUserResponse(chatState.selectedUser, message);
    });
  }
  
  // Add a message from the current user
  function addCurrentUserMessage(text) {
    addUserMessage(chatState.currentUser, text);
  }
  
  // Add a message from any user
  function addUserMessage(user, text) {
    const message = {
      id: Date.now(),
      user: user,
      text: text,
      timestamp: new Date()
    };
    
    // Initialize messages array for this user if it doesn't exist
    if (!chatState.messages[user.id]) {
      chatState.messages[user.id] = [];
    }
    
    // Add message to the user's message array
    chatState.messages[user.id].push(message);
    
    // Only render if this is the selected user
    if (chatState.selectedUser && chatState.selectedUser.id === user.id) {
      renderMessage(message);
      scrollToBottom();
    }
  }
  
  // Add a system message
  function addSystemMessage(text) {
    const message = {
      id: Date.now(),
      type: 'system',
      text: text,
      timestamp: new Date()
    };
    
    // System messages are shown regardless of selected user
    // Store in a special system messages array
    if (!chatState.messages['system']) {
      chatState.messages['system'] = [];
    }
    
    chatState.messages['system'].push(message);
    renderMessage(message);
    scrollToBottom();
  }
  
  // Add an AI response
  function addAIResponse(text) {
    const message = {
      id: Date.now(),
      ai: true,
      text: text,
      timestamp: new Date()
    };
    
    chatState.messages.push(message);
    renderMessage(message);
    scrollToBottom();
  }
  
  // Add a response from the selected user
  function addSelectedUserResponse(text) {
    if (!chatState.selectedUser) return;
    
    addUserMessage(chatState.selectedUser, text);
  }
  
  // Select a user for chat
  function selectUserForChat(user) {
    // Update selected user
    chatState.selectedUser = user;
    
    // Update UI to show selected user
    const userItems = document.querySelectorAll('.chat-user');
    userItems.forEach(item => item.classList.remove('selected'));
    
    const selectedItem = document.querySelector(`.chat-user[data-user-id="${user.id}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
    
    // Clear messages container
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
    
    // Show system messages
    if (chatState.messages['system']) {
      chatState.messages['system'].forEach(message => renderMessage(message));
    }
    
    // Show messages for this user
    if (chatState.messages[user.id]) {
      chatState.messages[user.id].forEach(message => renderMessage(message));
    }
    
    // Update chat header
    updateChatHeader(user);
    
    scrollToBottom();
  }
  
  // Update chat header with selected user info
  function updateChatHeader(user) {
    const chatHeader = document.querySelector('.chat-header');
    if (!chatHeader) return;
    
    chatHeader.innerHTML = `
      <div class="selected-user-info">
        <div class="user-avatar" style="background-image: url('/images/avatars/${user.avatar}')"></div>
        <h3>${user.name}</h3>
        <span class="status-indicator ${user.online ? 'online' : 'offline'}"></span>
      </div>
    `;
    
    // Add styles for the header
    const headerStyle = document.createElement('style');
    headerStyle.textContent = `
      .chat-header {
        display: flex;
        align-items: center;
      }
      .selected-user-info {
        display: flex;
        align-items: center;
      }
      .selected-user-info .user-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-size: cover;
        margin-right: 10px;
      }
      .selected-user-info h3 {
        margin: 0;
        font-size: 16px;
      }
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-left: 8px;
      }
      .status-indicator.online {
        background-color: #4CAF50;
      }
      .status-indicator.offline {
        background-color: #9E9E9E;
      }
      .chat-user {
        display: flex;
        align-items: center;
        padding: 8px;
        cursor: pointer;
        border-radius: 5px;
        margin-bottom: 5px;
      }
      .chat-user:hover {
        background-color: #f5f5f5;
      }
      .chat-user.selected {
        background-color: #e1f5fe;
      }
    `;
    document.head.appendChild(headerStyle);
  }
  
  // Render a message in the chat
  function renderMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    
    if (message.system) {
      // System message
      messageElement.className = 'chat-message system-message';
      messageElement.innerHTML = `<div class="message-text">${message.text}</div>`;
    } else if (message.ai) {
      // AI message
      messageElement.className = 'chat-message ai-message';
      messageElement.innerHTML = `
        <div class="message-avatar" style="background-image: url('/images/avatars/gemini.png')"></div>
        <div class="message-content">
          <div class="message-sender">Gemini Assistant</div>
          <div class="message-text">${message.text}</div>
          <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
      `;
    } else {
      // User message
      const isCurrentUser = message.user.id === chatState.currentUser.id;
      messageElement.className = `chat-message ${isCurrentUser ? 'current-user-message' : 'other-user-message'}`;
      
      messageElement.innerHTML = `
        <div class="message-avatar" style="background-image: url('/images/avatars/${message.user.avatar}')"></div>
        <div class="message-content">
          <div class="message-sender">${message.user.name}</div>
          <div class="message-text">${message.text}</div>
          <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
      `;
    }
    
    chatMessages.appendChild(messageElement);
  }
  
  // Run AI analysis on the chat conversation
  function runAIAnalysis() {
    // Check if a user is selected
    if (!chatState.selectedUser) {
      addSystemMessage('Please select a user to analyze chat with first.');
      return;
    }
    
    // Show loading indicator
    const aiButton = document.getElementById('ai-analysis-button');
    if (aiButton) {
      const originalText = aiButton.innerHTML;
      aiButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
      aiButton.disabled = true;
      
      // Get all messages for the selected user
      const userMessages = chatState.messages[chatState.selectedUser.id] || [];
      
      // Format messages for analysis
      const conversationHistory = userMessages.map(msg => {
        const sender = msg.user.id === chatState.currentUser.id ? 'You' : msg.user.name;
        return `${sender}: ${msg.text}`;
      }).join('\n');
      
      // Add system message to show we're analyzing
      addSystemMessage('Running AI analysis on your conversation...');
      
      // Make API request to Gemini
      fetch('/api/analyze-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation: conversationHistory,
          user: chatState.selectedUser.name
        })
      })
      .then(response => response.json())
      .then(data => {
        // Add AI analysis as system message
        addSystemMessage(`<strong>AI Analysis:</strong> ${data.analysis}`);
        
        // Reset button
        aiButton.innerHTML = originalText;
        aiButton.disabled = false;
      })
      .catch(error => {
        console.error('Error analyzing chat:', error);
        addSystemMessage('Sorry, there was an error analyzing the chat. Please try again later.');
        
        // Reset button
        aiButton.innerHTML = originalText;
        aiButton.disabled = false;
      });
    }
  }
  
  // Simulate response from another user
  function simulateUserResponse(user, originalMessage) {
    // Check if user is authenticated
    if (!chatState.currentUser.authenticated) {
      addSystemMessage('Please sign in to chat with team members.');
      return;
    }
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate network delay (500-2000ms)
    const delay = 500 + Math.random() * 1500;
    
    setTimeout(() => {
      // Hide typing indicator
      hideTypingIndicator();
      
      // Generate a contextual response based on the original message
      let response;
      
      // Simple response logic based on message content
      if (originalMessage.toLowerCase().includes('hello') || 
          originalMessage.toLowerCase().includes('hi') || 
          originalMessage.toLowerCase().includes('hey')) {
        response = `Hi there! How can I help you today?`;
      } 
      else if (originalMessage.toLowerCase().includes('sales')) {
        response = `Sales have been good this week. The Maggi Hot Cup Kari is our top seller.`;
      }
      else if (originalMessage.toLowerCase().includes('inventory') || 
               originalMessage.toLowerCase().includes('stock')) {
        response = `We're running low on M2MN Kari. Should we order more?`;
      }
      else if (originalMessage.toLowerCase().includes('price') || 
               originalMessage.toLowerCase().includes('pricing')) {
        response = `The current pricing seems competitive. No changes needed right now.`;
      }
      else if (originalMessage.toLowerCase().includes('meeting') || 
               originalMessage.toLowerCase().includes('schedule')) {
        response = `Are you free for a team meeting tomorrow at 10am?`;
      }
      else if (originalMessage.toLowerCase().includes('promotion') || 
               originalMessage.toLowerCase().includes('marketing')) {
        response = `I think we should run a promotion on the Pedas Giler products to boost sales.`;
      }
      else {
        // Generic responses if no keywords match
        const genericResponses = [
          `I'll look into that and get back to you.`,
          `That's a good point. Let me think about it.`,
          `I agree. What do you think we should do next?`,
          `Thanks for the update. Keep me posted on any changes.`,
          `Let's discuss this more in our next team meeting.`
        ];
        
        // Pick a random generic response
        const randomIndex = Math.floor(Math.random() * genericResponses.length);
        response = genericResponses[randomIndex];
      }
      
      // Add the response to the chat
      addSelectedUserResponse(response);
      
    }, delay);
  }
  
  // Extract context information from message
  function extractContextFromMessage(message) {
    // Look for location information
    const locationMatch = message.match(/(?:i am|i'm|im|currently|at|in) (?:at|in) ([a-zA-Z\\s,]+)/i);
    if (locationMatch && locationMatch[1]) {
      chatState.userContext.location = locationMatch[1].trim();
    }
    
    // Look for time information
    const timeMatch = message.match(/(?:it's|its|it is) ([0-9]{1,2}(?::[0-9]{2})? ?(?:am|pm)?)/i);
    if (timeMatch && timeMatch[1]) {
      chatState.userContext.time = timeMatch[1].trim();
    }
    
    // Look for product mentions
    const productMatch = message.match(/(?:maggi|m2mn|pedas giler|hot cup|big|syiok)/i);
    if (productMatch) {
      chatState.userContext.lastProductMention = productMatch[0].trim();
    }
  }
  
  // Show typing indicator
  function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'chat-message ai-message typing-indicator';
    
    typingIndicator.innerHTML = `
      <div class="message-avatar" style="background-image: url('/images/avatars/gemini.png')"></div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
  }
  
  // Hide typing indicator
  function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  // Format time for messages
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Scroll chat to bottom
  function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Create chat toggle button
  function createChatToggleButton() {
    // Only create button if user is authenticated
    if (!isAuthenticated && window.firebaseAuth && !window.firebaseAuth.getCurrentUser()) {
      return;
    }
    // Check if button already exists
    if (document.getElementById('chat-toggle-button')) return;
    
    // Create button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'chat-toggle-button';
    toggleButton.innerHTML = '<i class="fas fa-comments"></i>';
    toggleButton.title = 'Toggle Chat';
    
    // Add styles
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '20px';
    toggleButton.style.right = '20px';
    toggleButton.style.width = '60px';
    toggleButton.style.height = '60px';
    toggleButton.style.borderRadius = '50%';
    toggleButton.style.backgroundColor = '#d32f2f';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.fontSize = '24px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    toggleButton.style.zIndex = '1000';
    
    // Add event listener
    toggleButton.addEventListener('click', toggleChatVisibility);
    
    // Append to body
    document.body.appendChild(toggleButton);
  }

  // Create chat container
  function createChatContainer() {
    // Create main container
    const container = document.createElement('div');
    container.id = 'chat-container';
    
    // Add styles
    container.style.position = 'fixed';
    container.style.bottom = '90px';
    container.style.right = '20px';
    container.style.width = '350px';
    container.style.height = '500px';
    container.style.backgroundColor = 'white';
    container.style.borderRadius = '10px';
    container.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    container.style.display = 'none'; // Hidden by default
    container.style.flexDirection = 'column';
    container.style.overflow = 'hidden';
    container.style.zIndex = '999';
    
    // Create chat header
    const header = document.createElement('div');
    header.className = 'chat-header';
    header.innerHTML = '<h3>Maggi Sales Team Chat</h3>';
    header.style.padding = '10px 15px';
    header.style.backgroundColor = '#d32f2f';
    header.style.color = 'white';
    header.style.borderTopLeftRadius = '10px';
    header.style.borderTopRightRadius = '10px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    
    // Create chat body
    const body = document.createElement('div');
    body.className = 'chat-body';
    body.style.display = 'flex';
    body.style.height = 'calc(100% - 60px)';
    
    // Create users list
    const usersList = document.createElement('div');
    usersList.id = 'chat-users-list';
    usersList.className = 'chat-users-list';
    usersList.style.width = '100px';
    usersList.style.borderRight = '1px solid #eee';
    usersList.style.overflowY = 'auto';
    usersList.style.padding = '10px';
    
    // Create chat content
    const content = document.createElement('div');
    content.className = 'chat-content';
    content.style.flex = '1';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    
    // Create messages container
    const messages = document.createElement('div');
    messages.id = 'chat-messages';
    messages.className = 'chat-messages';
    messages.style.flex = '1';
    messages.style.overflowY = 'auto';
    messages.style.padding = '15px';
    
    // Create message form
    const form = document.createElement('form');
    form.id = 'chat-message-form';
    form.className = 'chat-message-form';
    form.style.display = 'flex';
    form.style.padding = '10px';
    form.style.borderTop = '1px solid #eee';
    
    // Create AI analysis button container
    const aiButtonContainer = document.createElement('div');
    aiButtonContainer.className = 'ai-button-container';
    aiButtonContainer.style.display = 'flex';
    aiButtonContainer.style.justifyContent = 'center';
    aiButtonContainer.style.padding = '5px 0';
    aiButtonContainer.style.borderTop = '1px solid #eee';
    
    // Create AI analysis button
    const aiButton = document.createElement('button');
    aiButton.id = 'ai-analysis-button';
    aiButton.type = 'button';
    aiButton.innerHTML = '<i class="fas fa-robot"></i> AI Analysis';
    aiButton.style.backgroundColor = '#4285f4';
    aiButton.style.color = 'white';
    aiButton.style.border = 'none';
    aiButton.style.borderRadius = '20px';
    aiButton.style.padding = '8px 15px';
    aiButton.style.fontSize = '14px';
    aiButton.style.cursor = 'pointer';
    aiButton.style.display = 'flex';
    aiButton.style.alignItems = 'center';
    aiButton.style.gap = '5px';
    
    // Add event listener to AI button
    aiButton.addEventListener('click', runAIAnalysis);
    
    // Add AI button to container
    aiButtonContainer.appendChild(aiButton);
    
    const input = document.createElement('input');
    input.id = 'chat-message-input';
    input.type = 'text';
    input.placeholder = 'Type a message...';
    input.style.flex = '1';
    input.style.padding = '8px 12px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '20px';
    input.style.marginRight = '10px';
    
    const button = document.createElement('button');
    button.type = 'submit';
    button.innerHTML = '<i class="fas fa-paper-plane"></i>';
    button.style.backgroundColor = '#d32f2f';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50%';
    button.style.width = '36px';
    button.style.height = '36px';
    button.style.cursor = 'pointer';
    
    // Assemble the form
    form.appendChild(input);
    form.appendChild(button);
    
    // Assemble the content
    content.appendChild(messages);
    content.appendChild(aiButtonContainer);
    content.appendChild(form);
    
    // Assemble the body
    body.appendChild(usersList);
    body.appendChild(content);
    
    // Assemble the container
    container.appendChild(header);
    container.appendChild(body);
    
    // Add to document
    document.body.appendChild(container);
    
    return container;
  }

  // Update current user with Firebase user info
  window.updateCurrentUser = function(user) {
    if (!user) return;
    
    chatState.currentUser = {
      id: user.uid || 0,
      name: user.displayName || 'You',
      avatar: user.photoURL || 'you.png',
      email: user.email || '',
      online: true,
      authenticated: true
    };
    
    // Update UI if needed
    const userItems = document.querySelectorAll('.chat-user');
    userItems.forEach(item => {
      if (item.dataset.userId === '0') {
        const nameElement = item.querySelector('.user-name');
        if (nameElement) nameElement.textContent = chatState.currentUser.name;
        
        const avatarElement = item.querySelector('.user-avatar');
        if (avatarElement) avatarElement.style.backgroundImage = `url('${chatState.currentUser.avatar}')`;
      }
    });
  };
  
  // Toggle chat visibility
  function toggleChatVisibility() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    if (chatContainer.style.display === 'none') {
      chatContainer.style.display = 'flex';
      scrollToBottom();
    } else {
      chatContainer.style.display = 'none';
    }
  }
});
