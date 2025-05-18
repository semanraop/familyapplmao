document.addEventListener('DOMContentLoaded', function() {
  // Tab switching for AI insights
  const tabs = document.querySelectorAll('.ai-tab');
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all content
        const contents = document.querySelectorAll('.ai-content');
        contents.forEach(content => content.classList.remove('active'));
        
        // Show selected content
        const tabId = this.getAttribute('data-tab');
        document.getElementById(`${tabId}-content`).classList.add('active');
      });
    });
  }
  
  // Speech recognition status indicator
  const speechStatus = document.getElementById('speechStatus');
  
  // Function to show speech status
  window.showSpeechStatus = function(message) {
    speechStatus.textContent = message;
    speechStatus.classList.add('visible');
  };
  
  // Function to hide speech status
  window.hideSpeechStatus = function() {
    speechStatus.classList.remove('visible');
  };
  
  // Format currency values
  function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
  }
  
  // Update calculated values when prices or units change in edit mode
  const priceInputs = document.querySelectorAll('input[name^="bagNoodlesPrice_"], input[name^="portableNoodlesPrice_"]');
  const unitInputs = document.querySelectorAll('input[name^="bagNoodlesUnits_"], input[name^="portableNoodlesUnits_"]');
  
  function updateCalculatedValues(event) {
    // Get the input element that triggered the event
    const input = event.target;
    
    // Find the row this input belongs to
    const row = input.closest('tr');
    if (!row) return;
    
    // Find the price and units inputs in this row
    let priceInput, unitsInput;
    
    if (input.name.startsWith('bagNoodlesPrice_') || input.name.startsWith('portableNoodlesPrice_')) {
      // If price was changed, find the corresponding units input
      priceInput = input;
      const index = input.name.split('_')[1];
      const prefix = input.name.startsWith('bagNoodlesPrice_') ? 'bagNoodlesUnits_' : 'portableNoodlesUnits_';
      unitsInput = document.querySelector(`input[name="${prefix}${index}"]`);
    } else {
      // If units were changed, find the corresponding price input
      unitsInput = input;
      const index = input.name.split('_')[1];
      const prefix = input.name.startsWith('bagNoodlesUnits_') ? 'bagNoodlesPrice_' : 'portableNoodlesPrice_';
      priceInput = document.querySelector(`input[name="${prefix}${index}"]`);
    }
    
    if (!priceInput || !unitsInput) return;
    
    // Calculate the value
    const price = parseFloat(priceInput.value) || 0;
    const units = parseInt(unitsInput.value) || 0;
    const value = (price * units).toFixed(2);
    
    // Update the value cell
    const valueCell = row.querySelector('td:last-child');
    if (valueCell) {
      valueCell.textContent = value;
      
      // Highlight the cell to indicate it was updated
      valueCell.classList.add('updated-value');
      setTimeout(() => {
        valueCell.classList.remove('updated-value');
      }, 1000);
    }
  }
  
  if (priceInputs.length > 0 && unitInputs.length > 0) {
    priceInputs.forEach(input => {
      input.addEventListener('input', updateCalculatedValues);
    });
    
    unitInputs.forEach(input => {
      input.addEventListener('input', updateCalculatedValues);
    });
  }
  
  // Add CSS for updated values
  const style = document.createElement('style');
  style.textContent = `
    .updated-value {
      background-color: #e8f5e9;
      transition: background-color 1s ease;
    }
  `;
  document.head.appendChild(style);
});
