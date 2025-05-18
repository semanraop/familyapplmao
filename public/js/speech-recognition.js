// Speech recognition for Maggi Sales Report
document.addEventListener('DOMContentLoaded', function() {
  // Add CSS for browser notification
  const notificationStyle = document.createElement('style');
  notificationStyle.textContent = `
    .browser-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      color: #856404;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 9999;
      text-align: center;
      max-width: 80%;
      transition: opacity 0.5s ease;
    }
    .browser-notification button {
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #856404;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(notificationStyle);
  
  // Check if browser supports the Web Speech API
  const isSpeechRecognitionSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  
  if (!isSpeechRecognitionSupported) {
    console.error('Speech recognition not supported in this browser');
    
    // Show a notification to the user
    const notification = document.createElement('div');
    notification.className = 'browser-notification';
    notification.innerHTML = `
      <strong>Speech Recognition Not Available</strong><br>
      Your browser does not support the Speech Recognition API.<br>
      For voice input, please use Chrome, Edge, or Safari.<br>
      You can still use manual input for all fields.
      <br>
      <button id="dismiss-notification">Dismiss</button>
    `;
    document.body.appendChild(notification);
    
    // Add dismiss button functionality
    document.getElementById('dismiss-notification').addEventListener('click', function() {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    });
    
    // Still setup the UI but with disabled microphones
    setupDisabledMicrophoneUI();
    return;
  }

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure speech recognition
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  // Keep track of the currently active input field
  let activeInputField = null;
  let isListening = false;
  
  // Create speech recognition buttons for all unit input fields
  function setupSpeechButtons() {
    // Only setup in edit mode
    if (!document.querySelector('.products-form')) {
      return;
    }
    
    // Get all unit input fields
    const unitInputs = document.querySelectorAll('input[name^="bagNoodlesUnits_"], input[name^="portableNoodlesUnits_"]');
    
    unitInputs.forEach(input => {
      // Create a container for the input and button
      const container = document.createElement('div');
      container.className = 'speech-input-container';
      
      // Get the parent cell
      const parentCell = input.parentElement;
      
      // Create the microphone button
      const micButton = document.createElement('button');
      micButton.type = 'button';
      micButton.className = 'mic-button';
      micButton.innerHTML = '<i class="fas fa-microphone"></i>';
      micButton.setAttribute('title', 'Speak to enter value');
      
      // Replace the input with the container
      parentCell.removeChild(input);
      container.appendChild(input);
      container.appendChild(micButton);
      parentCell.appendChild(container);
      
      // Add event listener to the button
      micButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Stop any ongoing recognition
        if (isListening) {
          recognition.stop();
        }
        
        // Set the active input field
        activeInputField = input;
        
        // Start listening
        setTimeout(() => {
          recognition.start();
          isListening = true;
          
          // Update button appearance
          micButton.classList.add('listening');
        }, 100);
      });
    });
  }
  
  // Handle speech recognition results
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.trim();
    console.log('Speech recognized:', transcript);
    
    // Show what was recognized
    if (window.showSpeechStatus) {
      window.showSpeechStatus(`Recognized: "${transcript}"`);
    }
    
    // Try to convert the transcript to a number
    let value = parseNumberFromSpeech(transcript);
    
    // Update the active input field if a valid number was recognized
    if (value !== null && activeInputField) {
      // Show success message
      if (window.showSpeechStatus) {
        window.showSpeechStatus(`Updated: ${value} units`);
        setTimeout(() => window.hideSpeechStatus(), 2000);
      }
      
      activeInputField.value = value;
      
      // Trigger an input event to update calculations
      const inputEvent = new Event('input', { bubbles: true });
      activeInputField.dispatchEvent(inputEvent);
      
      // Add visual feedback
      activeInputField.classList.add('speech-updated');
      setTimeout(() => {
        activeInputField.classList.remove('speech-updated');
      }, 1500);
      
      // Announce the change for accessibility
      announceChange(`Updated to ${value} units`);
    } else {
      // Show error if the speech couldn't be converted to a number
      if (window.showSpeechStatus) {
        window.showSpeechStatus(`Error: Could not recognize a number`);
        setTimeout(() => window.hideSpeechStatus(), 3000);
      }
      
      if (activeInputField) {
        activeInputField.classList.add('speech-error');
        setTimeout(() => {
          activeInputField.classList.remove('speech-error');
        }, 1500);
      }
      console.error('Could not convert speech to a number:', transcript);
      
      // Announce the error for accessibility
      announceChange('Could not recognize a number. Please try again.');
    }
  };
  
  // Handle speech recognition end
  recognition.onend = function() {
    isListening = false;
    
    // Update button appearance for all mic buttons
    document.querySelectorAll('.mic-button').forEach(button => {
      button.classList.remove('listening');
    });
    
    // Hide the speech status after a short delay
    setTimeout(() => {
      if (window.hideSpeechStatus) {
        window.hideSpeechStatus();
      }
    }, 1000);
  };
  
  // Handle speech recognition errors
  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    
    // Update button appearance
    document.querySelectorAll('.mic-button').forEach(button => {
      button.classList.remove('listening');
    });
    
    // Show error message
    if (window.showSpeechStatus) {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        case 'network':
          errorMessage = 'Network error occurred.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }
      
      window.showSpeechStatus(errorMessage);
      setTimeout(() => window.hideSpeechStatus(), 3000);
    }
  };
  
  // Helper function to parse numbers from speech
  function parseNumberFromSpeech(transcript) {
    // Convert words to numbers (e.g., "twenty five" to 25)
    const wordsToNumbers = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
      'eighty': 80, 'ninety': 90, 'hundred': 100
    };
    
    // First, try to extract a direct number
    const directNumber = transcript.match(/^(\d+)$/);
    if (directNumber) {
      return parseInt(directNumber[1], 10);
    }
    
    // Try to handle spoken numbers like "twenty five"
    const words = transcript.toLowerCase().split(' ');
    let result = 0;
    let temp = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (word in wordsToNumbers) {
        const value = wordsToNumbers[word];
        
        if (value === 100) {
          temp = temp === 0 ? 100 : temp * 100;
        } else if (value < 10) {
          temp += value;
        } else {
          temp += value;
        }
      }
    }
    
    result += temp;
    
    // Return the result if it's a valid number, otherwise null
    return result > 0 ? result : (transcript === 'zero' ? 0 : null);
  }
  
  // Function to announce changes for accessibility
  function announceChange(message) {
    // Create an aria-live region if it doesn't exist
    let ariaLive = document.getElementById('aria-live-region');
    if (!ariaLive) {
      ariaLive = document.createElement('div');
      ariaLive.id = 'aria-live-region';
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.className = 'sr-only';
      document.body.appendChild(ariaLive);
      
      // Add style for screen reader only content
      const style = document.createElement('style');
      style.textContent = `
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set the message
    ariaLive.textContent = message;
  }
  
  // Initialize speech recognition buttons
  setupSpeechButtons();
  
  // Function to setup disabled microphone UI for unsupported browsers
  function setupDisabledMicrophoneUI() {
    // Only setup in edit mode
    if (!document.querySelector('.products-form')) {
      return;
    }
    
    // Get all unit input fields
    const unitInputs = document.querySelectorAll('input[name^="bagNoodlesUnits_"], input[name^="portableNoodlesUnits_"]');
    
    unitInputs.forEach(input => {
      // Create a container for the input and button
      const container = document.createElement('div');
      container.className = 'speech-input-container';
      
      // Get the parent cell
      const parentCell = input.parentElement;
      
      // Create the disabled microphone button
      const micButton = document.createElement('button');
      micButton.type = 'button';
      micButton.className = 'mic-button disabled';
      micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      micButton.setAttribute('title', 'Speech recognition not supported in this browser');
      micButton.disabled = true;
      
      // Replace the input with the container
      parentCell.removeChild(input);
      container.appendChild(input);
      container.appendChild(micButton);
      parentCell.appendChild(container);
      
      // Add tooltip functionality
      micButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Show browser compatibility message
        const speechStatus = document.getElementById('speechStatus');
        if (speechStatus) {
          speechStatus.textContent = 'Speech recognition not supported in this browser';
          speechStatus.classList.add('visible');
          setTimeout(() => speechStatus.classList.remove('visible'), 3000);
        }
      });
    });
    
    // Add CSS for disabled microphone
    const style = document.createElement('style');
    style.textContent = `
      .mic-button.disabled {
        background-color: #f2f2f2;
        color: #999;
        cursor: not-allowed;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }
});
