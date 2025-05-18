const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Gemini API with better error handling
let genAI;
let isGeminiAvailable = false;

try {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not defined in environment variables');
  } else if (process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('GEMINI_API_KEY is still set to the default placeholder value');
  } else {
    console.log('Initializing Gemini API with provided key');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We'll mark the API as potentially available, but we'll handle errors gracefully
    isGeminiAvailable = true;
    console.log('Gemini API initialized, but availability will be confirmed on first request');
  }
} catch (error) {
  console.error('Error initializing Gemini API:', error);
  isGeminiAvailable = false;
}

// Fallback content for when the API is unavailable
const fallbackInsights = `
<h3>Sales Insights (Demo Data)</h3>
<h4>Top 3 Best-Selling Products by Units</h4>
<ul>
  <li><strong>M2MN Kari</strong> - 55 units</li>
  <li><strong>M2MN Ayam</strong> - 39 units</li>
  <li><strong>Maggi Hot Cup Kari</strong> - 20 units</li>
</ul>

<h4>Top 3 Products by Revenue</h4>
<ul>
  <li><strong>M2MN Kari</strong> - RM 246.95</li>
  <li><strong>M2MN Ayam</strong> - RM 175.11</li>
  <li><strong>Maggi Hot Cup Kari (6)</strong> - RM 175.20</li>
</ul>

<h4>Products with Zero Sales</h4>
<ul>
  <li>Maggi Syiok! Aglio Olio</li>
  <li>Maggi Mi Goreng Laksa Warisan</li>
  <li>Maggi Pedas Giler Tom Yummz</li>
  <li>Maggi Pedas Giler Cheezy Berapi</li>
</ul>

<p>Note: This is demo data as the Gemini API connection is currently unavailable.</p>
`;

const fallbackForecast = `
<h3>Sales Forecast (Demo Data)</h3>
<h4>Next Week's Sales Forecast</h4>
<ul>
  <li><strong>Bag Noodles</strong>: Expected to maintain strong sales with approximately 130-150 units</li>
  <li><strong>Portable Noodles</strong>: Projected to sell 55-65 units</li>
</ul>

<h4>Products Likely to Sell Out Soon</h4>
<ul>
  <li>Maggi Hot Cup Kari - Current stock: 20 units, high demand continues</li>
  <li>Maggi Big Kari - Current stock: 13 units, consistent seller</li>
</ul>

<p>Note: This is demo data as the Gemini API connection is currently unavailable.</p>
`;

const fallbackMarketing = `
<h3>Marketing Suggestions (Demo Data)</h3>
<h4>Promotion Opportunities</h4>
<ul>
  <li><strong>Bundle Deal</strong>: Pair Maggi Pedas Giler products (low sales) with popular M2MN varieties</li>
  <li><strong>Volume Discount</strong>: Offer 10% off when purchasing 3+ units of any Maggi Hot Cup variety</li>
</ul>

<h4>Cross-Selling Opportunities</h4>
<ul>
  <li>Display Maggi Hot Cup products near instant beverages section</li>
  <li>Create meal combo deals with Maggi noodles and complementary products</li>
</ul>

<p>Note: This is demo data as the Gemini API connection is currently unavailable.</p>
`;

// Function to generate sales insights
async function generateSalesInsights(salesData) {
  // If we know the API is not available, return fallback content immediately
  if (!isGeminiAvailable) {
    console.log('Using fallback insights content (Gemini API not available)');
    return fallbackInsights;
  }
  
  try {
    // Check if Gemini API is properly initialized
    if (!genAI) {
      console.error('Gemini API not initialized. Check your API key.');
      isGeminiAvailable = false;
      return fallbackInsights;
    }
    
    // Try different model versions to find one that works
    const modelVersions = ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
    let model;
    let modelError = null;
    
    // Try each model version until one works
    for (const modelVersion of modelVersions) {
      try {
        console.log(`Trying Gemini model version: ${modelVersion}`);
        model = genAI.getGenerativeModel({ model: modelVersion });
        break; // If successful, exit the loop
      } catch (err) {
        console.log(`Model ${modelVersion} not available: ${err.message}`);
        modelError = err;
      }
    }
    
    if (!model) {
      console.error('No compatible Gemini model found:', modelError);
      isGeminiAvailable = false;
      return fallbackInsights;
    }
    
    // Format the sales data for better analysis
    const formattedData = JSON.stringify(salesData, null, 2);
    
    // Create the prompt for Gemini
    const prompt = `
      As a retail analytics expert, analyze the following Maggi noodles sales data and provide insights:
      
      ${formattedData}
      
      Please provide:
      1. Top 3 best-selling products by units
      2. Top 3 products by revenue
      3. Products with zero sales that might need attention
      4. Overall sales trend analysis
      5. Recommendations for inventory management
      
      Format the response in HTML with appropriate headings and bullet points.
    `;
    
    console.log('Sending request to Gemini API...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received response from Gemini API');
    return text;
  } catch (error) {
    console.error('Error generating insights:', error.message);
    isGeminiAvailable = false; // Mark as unavailable for future requests
    
    // Return fallback content instead of error messages
    console.log('Using fallback insights content due to API error');
    return fallbackInsights;
  }
}

// Function to generate sales forecasts
async function generateSalesForecast(salesData) {
  // If we know the API is not available, return fallback content immediately
  if (!isGeminiAvailable) {
    console.log('Using fallback forecast content (Gemini API not available)');
    return fallbackForecast;
  }
  
  try {
    // Check if Gemini API is properly initialized
    if (!genAI) {
      console.error('Gemini API not initialized. Check your API key.');
      isGeminiAvailable = false;
      return fallbackForecast;
    }
    
    // Try different model versions to find one that works
    const modelVersions = ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
    let model;
    let modelError = null;
    
    // Try each model version until one works
    for (const modelVersion of modelVersions) {
      try {
        console.log(`Trying Gemini model version: ${modelVersion}`);
        model = genAI.getGenerativeModel({ model: modelVersion });
        break; // If successful, exit the loop
      } catch (err) {
        console.log(`Model ${modelVersion} not available: ${err.message}`);
        modelError = err;
      }
    }
    
    if (!model) {
      console.error('No compatible Gemini model found:', modelError);
      isGeminiAvailable = false;
      return fallbackForecast;
    }
    
    // Format the sales data for better analysis
    const formattedData = JSON.stringify(salesData, null, 2);
    
    // Create the prompt for Gemini
    const prompt = `
      As a retail forecasting expert, analyze the following Maggi noodles sales data and provide a sales forecast:
      
      ${formattedData}
      
      Please provide:
      1. Forecast for next week's sales by product category (bag noodles vs portable noodles)
      2. Products likely to sell out soon based on current inventory
      3. Recommendations for restocking priorities
      4. Potential seasonal trends to consider
      
      Format the response in HTML with appropriate headings and bullet points.
    `;
    
    console.log('Sending forecast request to Gemini API...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received forecast from Gemini API');
    return text;
  } catch (error) {
    console.error('Error generating forecast:', error.message);
    isGeminiAvailable = false; // Mark as unavailable for future requests
    
    // Return fallback content instead of error messages
    console.log('Using fallback forecast content due to API error');
    return fallbackForecast;
  }
}

// Function to generate marketing suggestions
async function generateMarketingSuggestions(salesData) {
  // If we know the API is not available, return fallback content immediately
  if (!isGeminiAvailable) {
    console.log('Using fallback marketing content (Gemini API not available)');
    return fallbackMarketing;
  }
  
  try {
    // Check if Gemini API is properly initialized
    if (!genAI) {
      console.error('Gemini API not initialized. Check your API key.');
      isGeminiAvailable = false;
      return fallbackMarketing;
    }
    
    // Try different model versions to find one that works
    const modelVersions = ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
    let model;
    let modelError = null;
    
    // Try each model version until one works
    for (const modelVersion of modelVersions) {
      try {
        console.log(`Trying Gemini model version: ${modelVersion}`);
        model = genAI.getGenerativeModel({ model: modelVersion });
        break; // If successful, exit the loop
      } catch (err) {
        console.log(`Model ${modelVersion} not available: ${err.message}`);
        modelError = err;
      }
    }
    
    if (!model) {
      console.error('No compatible Gemini model found:', modelError);
      isGeminiAvailable = false;
      return fallbackMarketing;
    }
    
    // Format the sales data for better analysis
    const formattedData = JSON.stringify(salesData, null, 2);
    
    // Create the prompt for Gemini
    const prompt = `
      As a retail marketing expert, analyze the following Maggi noodles sales data and provide marketing suggestions:
      
      ${formattedData}
      
      Please provide:
      1. Products that could benefit from promotions
      2. Bundle suggestions for slow-moving products
      3. Cross-selling opportunities based on sales patterns
      4. Promotional ideas for high-margin products
      5. Seasonal marketing strategies
      
      Format the response in HTML with appropriate headings and bullet points.
    `;
    
    console.log('Sending marketing suggestions request to Gemini API...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received marketing suggestions from Gemini API');
    return text;
  } catch (error) {
    console.error('Error generating marketing suggestions:', error.message);
    isGeminiAvailable = false; // Mark as unavailable for future requests
    
    // Return fallback content instead of error messages
    console.log('Using fallback marketing content due to API error');
    return fallbackMarketing;
  }
}

// Chat functionality with context memory
async function generateChatResponse(message, userContext = {}) {
  // If we know the API is not available, return fallback content immediately
  if (!isGeminiAvailable) {
    console.log('Using fallback chat response (Gemini API not available)');
    return {
      response: getFallbackChatResponse(message, userContext),
      updatedContext: userContext
    };
  }
  
  try {
    // Check if Gemini API is properly initialized
    if (!genAI) {
      console.error('Gemini API not initialized. Check your API key.');
      isGeminiAvailable = false;
      return {
        response: getFallbackChatResponse(message, userContext),
        updatedContext: userContext
      };
    }
    
    // Try different model versions to find one that works
    const modelVersions = ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
    let model;
    let modelError = null;
    
    // Try each model version until one works
    for (const modelVersion of modelVersions) {
      try {
        console.log(`Trying Gemini model version: ${modelVersion}`);
        model = genAI.getGenerativeModel({ model: modelVersion });
        break; // If successful, exit the loop
      } catch (err) {
        console.log(`Model ${modelVersion} not available: ${err.message}`);
        modelError = err;
      }
    }
    
    if (!model) {
      console.error('No compatible Gemini model found:', modelError);
      isGeminiAvailable = false;
      return {
        response: getFallbackChatResponse(message, userContext),
        updatedContext: userContext
      };
    }
    
    // Build context for the chat
    let contextString = 'You are a helpful assistant for the Maggi sales team.';
    
    // Add user context if available
    if (userContext.location) {
      contextString += ` The user is currently at ${userContext.location}.`;
    }
    if (userContext.time) {
      contextString += ` The local time is ${userContext.time}.`;
    }
    if (userContext.lastProductMention) {
      contextString += ` The user recently mentioned ${userContext.lastProductMention} products.`;
    }
    
    // Create the prompt for Gemini
    const prompt = `
      ${contextString}
      
      You are chatting in a group of 8 Maggi sales representatives. Be friendly, helpful, and concise.
      Remember any information the user shares about their location, time, or preferences.
      
      User message: ${message}
    `;
    
    console.log('Sending chat request to Gemini API...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received chat response from Gemini API');
    
    // Update context based on the message
    const updatedContext = { ...userContext };
    
    // Extract location if mentioned
    const locationMatch = message.match(/(?:i am|i'm|im|currently|at|in) (?:at|in) ([a-zA-Z\s,]+)/i);
    if (locationMatch && locationMatch[1]) {
      updatedContext.location = locationMatch[1].trim();
    }
    
    return {
      response: text,
      updatedContext: updatedContext
    };
  } catch (error) {
    console.error('Error generating chat response:', error.message);
    isGeminiAvailable = false; // Mark as unavailable for future requests
    
    return {
      response: getFallbackChatResponse(message, userContext),
      updatedContext: userContext
    };
  }
}

// Process chat messages from the API endpoint
async function processChatMessage(message, context = {}) {
  // Simply use the existing generateChatResponse function
  return await generateChatResponse(message, context);
}

// Analyze chat conversation with Gemini API
async function analyzeChatConversation(conversation, username) {
  // If we know the API is not available, return fallback content immediately
  if (!isGeminiAvailable) {
    console.log('Using fallback analysis (Gemini API not available)');
    return "I've analyzed your conversation and noticed you're discussing Maggi product sales and inventory. Consider following up on specific product questions and clarifying any action items.";
  }
  
  try {
    // Check if Gemini API is properly initialized
    if (!genAI) {
      console.error('Gemini API not initialized. Check your API key.');
      isGeminiAvailable = false;
      return "I've analyzed your conversation and noticed you're discussing Maggi product sales and inventory. Consider following up on specific product questions and clarifying any action items.";
    }
    
    // Try different model versions to find one that works - prioritize gemini-1.5-pro for faster loading
    const modelVersions = ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
    let model;
    let modelError = null;
    
    // Try each model version until one works
    for (const modelVersion of modelVersions) {
      try {
        console.log(`Trying Gemini model version: ${modelVersion}`);
        model = genAI.getGenerativeModel({ model: modelVersion });
        break; // If successful, exit the loop
      } catch (err) {
        console.log(`Model ${modelVersion} not available: ${err.message}`);
        modelError = err;
      }
    }
    
    if (!model) {
      console.error('No compatible Gemini model found:', modelError);
      isGeminiAvailable = false;
      return "I've analyzed your conversation and noticed you're discussing Maggi product sales and inventory. Consider following up on specific product questions and clarifying any action items.";
    }
    
    // Create the prompt for Gemini
    const prompt = `
      You are an AI assistant for the Maggi sales team. Please analyze the following conversation between a team member and ${username}.
      
      Conversation:
      ${conversation}
      
      Please provide a brief, insightful analysis of this conversation. Focus on:
      1. Key points discussed
      2. Any action items that need follow-up
      3. Suggestions for next steps
      4. Any sales opportunities identified
      
      Keep your analysis concise, professional, and actionable. Limit to 3-4 sentences maximum.
    `;
    
    console.log('Sending chat analysis request to Gemini API...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received chat analysis from Gemini API');
    
    return text;
  } catch (error) {
    console.error('Error generating chat analysis:', error.message);
    isGeminiAvailable = false; // Mark as unavailable for future requests
    
    return "I've analyzed your conversation and noticed you're discussing Maggi product sales and inventory. Consider following up on specific product questions and clarifying any action items.";
  }
}

// Generate fallback chat responses when API is unavailable
function getFallbackChatResponse(message, userContext) {
  // Extract keywords from message
  const keywords = message.toLowerCase().split(/\s+/);
  
  // Check for greetings
  if (keywords.some(word => ['hi', 'hello', 'hey', 'greetings'].includes(word))) {
    return "Hello! How can I help with your Maggi sales today?";
  }
  
  // Check for location mentions
  if (message.match(/(?:i am|i'm|im|currently|at|in) (?:at|in) ([a-zA-Z\s,]+)/i)) {
    const locationMatch = message.match(/(?:i am|i'm|im|currently|at|in) (?:at|in) ([a-zA-Z\s,]+)/i);
    const location = locationMatch[1].trim();
    return `I see you're at ${location}! How are the Maggi sales going there?`;
  }
  
  // Check for product mentions
  if (message.toLowerCase().includes('maggi')) {
    return "Maggi products have been selling really well recently. The Hot Cup Kari is our top seller this month.";
  }
  
  // Default response
  return "Thanks for your message! I'm here to help with any questions about Maggi sales and inventory.";
}

module.exports = {
  generateSalesInsights,
  generateSalesForecast,
  generateMarketingSuggestions,
  generateChatResponse,
  processChatMessage,
  analyzeChatConversation
};
