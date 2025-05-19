// Chat Service - Handles chat functionality using Firebase
document.addEventListener('DOMContentLoaded', function() {
  // Initialize variables
  let currentUser = null;
  let currentChatRoom = 'global'; // Default chat room
  let unsubscribe = null; // Store the Firestore listener to unsubscribe when needed
  let db = null; // Firestore database reference
  
  // Set to track displayed message IDs to avoid duplicates
  const displayedMessageIds = new Set();
  
  // Listen for user login events
  document.addEventListener('userLoggedIn', function(e) {
    currentUser = e.detail;
    initializeChat();
  });
  
  // Listen for user logout events
  document.addEventListener('userLoggedOut', function() {
    currentUser = null;
    if (unsubscribe) {
      unsubscribe(); // Unsubscribe from Firestore listener
      unsubscribe = null;
    }
    hideChatUI();
  });
  
  // Initialize chat when the page loads
  function initializeChat() {
    if (!currentUser) {
      console.error('Cannot initialize chat: No user logged in');
      return;
    }
    
    console.log('Initializing chat for user:', currentUser.displayName);
    
    // Check if Firebase and Firestore are available
    if (!window.firebase) {
      console.error('Firebase not found. Make sure Firebase SDK is loaded.');
      return;
    }
    
    if (!firebase.firestore) {
      console.error('Firestore not found. Make sure Firestore SDK is loaded.');
      return;
    }
    
    // Initialize Firestore if not already initialized
    try {
      console.log('Initializing Firestore');
      db = firebase.firestore();
      console.log('Firestore initialized:', db);
      
      // Set up Firestore settings
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      });
      console.log('Firestore settings applied');
      
      // Create the chats collection if it doesn't exist
      db.collection('chats').doc(currentChatRoom).set({
        name: 'Global Chat',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      .then(() => {
        console.log('Chat room created/updated successfully');
      })
      .catch(error => {
        console.error('Error creating chat room:', error);
      });
    } catch (error) {
      console.error('Error initializing Firestore:', error);
      alert('Could not initialize chat. Please refresh the page and try again.');
    }
    
    // Create or show chat UI
    createChatUI();
    
    // Subscribe to messages
    subscribeToMessages();
    
    // Show the chat UI
    showChatUI();
  }
  
  // Initialize the chat UI in the tabbed interface
  function createChatUI() {
    // No need to create elements as they're already in the HTML
    // Just add event listeners
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    
    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', sendMessage);
    } else {
      console.error('Chat send button not found in the DOM');
    }
    
    if (chatInput) {
      chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
    } else {
      console.error('Chat input not found in the DOM');
    }
    
    // Add click event listener to the chat tab
    const chatTab = document.querySelector('.ai-tab[data-tab="chat"]');
    if (chatTab) {
      chatTab.addEventListener('click', function() {
        // Scroll to bottom of chat when tab is clicked
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
          setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 100);
        }
      });
    }
  }
  
  // Show chat UI by activating the chat tab
  function showChatUI() {
    // Get all tabs and content sections
    const tabs = document.querySelectorAll('.ai-tab');
    const contents = document.querySelectorAll('.ai-content');
    
    // Find the chat tab
    const chatTab = document.querySelector('.ai-tab[data-tab="chat"]');
    
    if (chatTab) {
      // Remove active class from all tabs and contents
      tabs.forEach(tab => tab.classList.remove('active'));
      contents.forEach(content => content.classList.remove('active'));
      
      // Add active class to chat tab
      chatTab.classList.add('active');
      
      // Add active class to chat content
      const chatContent = document.getElementById('chat-content');
      if (chatContent) {
        chatContent.classList.add('active');
      }
      
      // Scroll to bottom of chat
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
      }
    }
  }
  
  // Hide chat UI (not needed for tabbed interface, but kept for compatibility)
  function hideChatUI() {
    // No need to hide in tabbed interface
    // This function is kept for compatibility with existing code
  }
  
  // Subscribe to messages from Firestore
  function subscribeToMessages() {
    if (!currentUser || !db) {
      console.error('Cannot subscribe to messages: User not logged in or Firestore not initialized');
      return;
    }
    
    try {
      console.log('Subscribing to messages in chat room:', currentChatRoom);
      
      // Unsubscribe from previous listener if exists
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      
      // Make sure the chat room exists
      db.collection('chats').doc(currentChatRoom).set({
        name: 'Global Chat',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Clear existing messages in the UI
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.innerHTML = '';
      }
      
      // Reset the displayed message IDs set
      displayedMessageIds.clear();
      
      // Load the last 50 messages first
      db.collection('chats')
        .doc(currentChatRoom)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get()
        .then(function(querySnapshot) {
          const messages = [];
          querySnapshot.forEach(function(doc) {
            const messageData = doc.data();
            // Add document ID if not present
            if (!messageData.id) {
              messageData.id = doc.id;
            }
            messages.push(messageData);
            // Track this message ID
            displayedMessageIds.add(messageData.id || doc.id);
          });
          
          // Display messages in reverse order (oldest first)
          messages.reverse().forEach(function(message) {
            displayMessage(message);
          });
          
          // Scroll to bottom of chat
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
          
          console.log('Loaded', messages.length, 'previous messages');
          
          // Set up listener for new messages
          setupNewMessageListener(chatMessages);
        })
        .catch(function(error) {
          console.error('Error loading previous messages:', error);
          // Still try to subscribe to new messages even if loading fails
          setupNewMessageListener(chatMessages);
        });
    } catch (error) {
      console.error('Error setting up message subscription:', error);
    }
  }
  
  // Set up listener for new messages
  function setupNewMessageListener(chatMessages) {
    console.log('Setting up listener for new messages');
    
    // Subscribe to new messages
    unsubscribe = db.collection('chats')
      .doc(currentChatRoom)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .startAfter(new Date()) // Only get messages after now
      .onSnapshot(function(snapshot) {
        console.log('Received message snapshot, changes:', snapshot.docChanges().length);
        
        snapshot.docChanges().forEach(function(change) {
          if (change.type === 'added') {
            const messageData = change.doc.data();
            console.log('New message received:', messageData);
            
            // Generate a unique ID for this message
            const messageId = messageData.id || change.doc.id;
            
            // Check if this is from the current user (to avoid duplicates with optimistic UI)
            const isFromCurrentUser = messageData.uid === currentUser.uid;
            
            // Only display if we haven't shown it yet and it's not from current user
            // (since we already show current user messages immediately via optimistic UI)
            if (!displayedMessageIds.has(messageId) && !isFromCurrentUser) {
              displayedMessageIds.add(messageId);
              displayMessage(messageData);
              
              // Scroll to bottom of chat
              if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            }
          }
        });
      }, function(error) {
        console.error('Error in message listener:', error);
      });
  }
  
  // Send a message
  function sendMessage() {
    if (!currentUser) {
      console.error('Cannot send message: No user logged in');
      return;
    }
    
    if (!db) {
      console.error('Cannot send message: Firestore not initialized');
      alert('Chat service is not initialized. Please refresh the page and try again.');
      return;
    }
    
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) {
      console.error('Chat input element not found');
      return;
    }
    
    const message = chatInput.value.trim();
    
    if (message === '') return;
    
    console.log('Attempting to send message:', message);
    console.log('Current user:', currentUser);
    console.log('Current chat room:', currentChatRoom);
    console.log('Firestore instance:', db);
    
    // Clear input immediately for better UX
    chatInput.value = '';
    chatInput.focus();
    
    try {
      // Create message object with all required fields
      const messageData = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: currentUser.photoURL || '/images/avatars/you.png',
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString() // Backup timestamp for sorting if serverTimestamp fails
      };
      
      console.log('Message data prepared:', messageData);
      
      // Show a temporary version of the message immediately (optimistic UI)
      const tempTimestamp = new Date();
      const tempId = 'temp-' + tempTimestamp.getTime();
      displayMessage({
        ...messageData,
        timestamp: tempTimestamp,
        _tempId: tempId, // Add a temporary ID to identify this message
        _isLocalMessage: true // Mark as local message to avoid duplication
      });
      
      // Test Firestore connection by checking if we can access the collection
      db.collection('chats').get()
        .then(snapshot => {
          console.log('Successfully connected to Firestore chats collection');
          console.log('Number of chat rooms:', snapshot.size);
          
          // Now proceed with sending the message
          sendMessageToFirestore(messageData, message);
        })
        .catch(error => {
          console.error('Error accessing Firestore chats collection:', error);
          alert('Cannot connect to chat service. Please check your internet connection and try again.');
        });
    } catch (error) {
      console.error('Error in sendMessage function:', error);
      alert('An error occurred while sending your message: ' + error.message);
    }
  }
  
  // Helper function to send message to Firestore
  function sendMessageToFirestore(messageData, message) {
    console.log('Sending message to Firestore...');
    
    // First ensure the chat room exists
    db.collection('chats').doc(currentChatRoom).set({
      name: 'Global Chat',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessage: message,
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageUser: currentUser.displayName || 'Anonymous'
    }, { merge: true })
    .then(() => {
      console.log('Chat room updated successfully, now adding message...');
      
      // Then add the message to Firestore
      return db.collection('chats')
        .doc(currentChatRoom)
        .collection('messages')
        .add(messageData);
    })
    .then((docRef) => {
      console.log('Message sent successfully with ID:', docRef.id);
      
      // Update the message with its Firestore ID for future reference
      return db.collection('chats')
        .doc(currentChatRoom)
        .collection('messages')
        .doc(docRef.id)
        .update({
          id: docRef.id
        });
    })
    .then(() => {
      console.log('Message ID updated successfully');
    })
    .catch(function(error) {
      console.error('Error in sendMessageToFirestore:', error);
      alert('Failed to send message: ' + error.message);
    });
  }
  
  // Display a message in the chat
  function displayMessage(messageData) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
      console.error('Chat messages container not found');
      return;
    }
    
    if (!currentUser) {
      console.error('No current user found when displaying message');
      return;
    }
    
    console.log('Displaying message:', messageData);
    
    const isCurrentUser = messageData.uid === currentUser.uid;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isCurrentUser ? 'chat-message-self' : 'chat-message-other'}`;
    
    // Format timestamp
    let timeString = 'Just now';
    if (messageData.timestamp) {
      try {
        // Check if timestamp is a Firebase timestamp or a Date object
        const timestamp = typeof messageData.timestamp.toDate === 'function' 
          ? messageData.timestamp.toDate() 
          : messageData.timestamp;
          
        timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        console.error('Error formatting timestamp:', error);
      }
    }
    
    // Ensure we have valid values for all properties
    const photoURL = messageData.photoURL || '/images/avatars/you.png';
    const displayName = messageData.displayName || 'Unknown User';
    const message = messageData.message || '';
    
    // Set message content with HTML escaping for security
    const escapedMessage = escapeHtml(message);
    
    messageElement.innerHTML = `
      <div class="chat-message-avatar" style="background-image: url('${photoURL}')"></div>
      <div class="chat-message-content">
        <div class="chat-message-header">
          <span class="chat-message-name">${displayName}</span>
          <span class="chat-message-time">${timeString}</span>
        </div>
        <div class="chat-message-text">${escapedMessage}</div>
      </div>
    `;
    
    // Add message to chat
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom of chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Helper function to escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
