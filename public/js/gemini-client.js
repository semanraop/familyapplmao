// Gemini Client-side JavaScript
// Handles the generation of Gemini AI insights on demand

document.addEventListener('DOMContentLoaded', function() {
  // Get the generate buttons
  const generateInsightsBtn = document.getElementById('generate-insights-btn');
  const generateForecastBtn = document.getElementById('generate-forecast-btn');
  const generateMarketingBtn = document.getElementById('generate-marketing-btn');
  const generateAllBtn = document.getElementById('generate-all-btn');
  const loadingIndicator = document.getElementById('gemini-loading');
  
  // Add event listeners to the buttons
  if (generateInsightsBtn) {
    generateInsightsBtn.addEventListener('click', function() {
      generateInsights('insights');
    });
  }
  
  if (generateForecastBtn) {
    generateForecastBtn.addEventListener('click', function() {
      generateInsights('forecast');
    });
  }
  
  if (generateMarketingBtn) {
    generateMarketingBtn.addEventListener('click', function() {
      generateInsights('marketing');
    });
  }
  
  if (generateAllBtn) {
    generateAllBtn.addEventListener('click', function() {
      generateInsights('all');
    });
  }
  
  // Function to generate insights
  function generateInsights(insightType) {
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    // Disable all buttons while loading
    setButtonsEnabled(false);
    
    // Make API request to generate insights
    fetch('/api/generate-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ insightType })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to generate insights');
        });
      }
      return response.json();
    })
    .then(data => {
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Enable all buttons
      setButtonsEnabled(true);
      
      // Update the UI with the generated insights
      if (insightType === 'all') {
        // Update all insight containers
        updateInsightContainer('insights-container', data.result.insights);
        updateInsightContainer('forecast-container', data.result.forecast);
        updateInsightContainer('marketing-container', data.result.marketingSuggestions);
      } else {
        // Update the specific insight container
        const containerId = insightType + '-container';
        updateInsightContainer(containerId, data.result);
      }
    })
    .catch(error => {
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Enable all buttons
      setButtonsEnabled(true);
      
      // Show error message
      alert('Error generating insights: ' + error.message);
      console.error('Error generating insights:', error);
    });
  }
  
  // Function to update an insight container with new content
  function updateInsightContainer(containerId, content) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = content;
    }
  }
  
  // Function to enable/disable all generate buttons
  function setButtonsEnabled(enabled) {
    const buttons = [
      generateInsightsBtn,
      generateForecastBtn,
      generateMarketingBtn,
      generateAllBtn
    ];
    
    buttons.forEach(button => {
      if (button) {
        button.disabled = !enabled;
        if (enabled) {
          button.classList.remove('disabled');
        } else {
          button.classList.add('disabled');
        }
      }
    });
  }
});
