const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
const geminiService = require('./gemini-service');
const session = require('express-session');
const admin = require('firebase-admin');
const authModule = require('./server-auth');
require('dotenv').config();

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

// Try to initialize Firebase Admin SDK
try {
  // Use the service account file that exists in the project
  const serviceAccountPath = path.join(__dirname, 'familyig-9a0ae-firebase-adminsdk-fbsvc-a274e1ba7f.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require('./familyig-9a0ae-firebase-adminsdk-fbsvc-a274e1ba7f.json');
      
      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully from service account file');
    } catch (fileError) {
      console.error('Error loading service account file:', fileError.message);
      createMockFirebaseAdmin();
    }
  } else {
    console.error('Service account file not found at:', serviceAccountPath);
    createMockFirebaseAdmin();
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  createMockFirebaseAdmin();
}

// Create a mock implementation for development
function createMockFirebaseAdmin() {
  console.log('Using mock authentication for development');
  
  // Store users in memory for the mock implementation
  const mockUsers = {};
  
  // Load existing users from users.json if it exists
  try {
    if (fs.existsSync(path.join(__dirname, 'users.json'))) {
      const usersData = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8');
      const users = JSON.parse(usersData);
      
      // Add users to in-memory storage
      users.forEach(user => {
        mockUsers[user.email] = user;
        mockUsers[user.uid] = user;
      });
      
      console.log(`Loaded ${users.length} users from users.json`);
    } else {
      // Create users.json if it doesn't exist
      fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify([], null, 2));
      console.log('Created empty users.json file');
    }
  } catch (error) {
    console.error('Error loading users from users.json:', error);
  }
  
  // Create mock auth functions
  admin.auth = function() {
    return {
      createUser: async (userData) => {
        console.log('Mock create user:', userData);
        const uid = 'mock-' + Date.now();
        const user = {
          uid: uid,
          email: userData.email,
          emailVerified: userData.emailVerified || false,
          displayName: userData.displayName || userData.email.split('@')[0],
          photoURL: userData.photoURL || '/images/avatars/you.png',
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
          password: userData.password // In a real implementation, this would be hashed
        };
        
        // Store the user in our mock database
        mockUsers[uid] = user;
        mockUsers[userData.email] = user; // Also index by email for getUserByEmail
        
        // Save to users.json file
        try {
          let users = [];
          if (fs.existsSync(path.join(__dirname, 'users.json'))) {
            const usersData = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8');
            users = JSON.parse(usersData);
          }
          
          // Add the new user
          users.push({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            creationTime: user.creationTime,
            lastSignInTime: user.lastSignInTime,
            loginCount: 1
          });
          
          // Save the updated users list
          fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
        } catch (error) {
          console.error('Error saving user to users.json:', error);
        }
        
        return user;
      },
      getUserByEmail: async (email) => {
        console.log('Mock get user by email:', email);
        
        // Check if the user exists in our mock database
        if (mockUsers[email]) {
          // Update last sign in time
          mockUsers[email].lastSignInTime = new Date().toISOString();
          return mockUsers[email];
        }
        
        // Try to find user in users.json
        try {
          const usersFilePath = path.join(__dirname, 'users.json');
          if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            const users = JSON.parse(usersData);
            const foundUser = users.find(u => u.email === email);
            
            if (foundUser) {
              // Load user into memory
              mockUsers[foundUser.uid] = foundUser;
              mockUsers[email] = foundUser;
              
              // Update login count and last sign in time
              foundUser.loginCount = (foundUser.loginCount || 0) + 1;
              foundUser.lastSignInTime = new Date().toISOString();
              
              // Save updated user info
              fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
              
              return foundUser;
            }
          }
        } catch (error) {
          console.error('Error reading users.json:', error);
        }
        
        // User not found
        const error = new Error('User not found');
        error.code = 'auth/user-not-found';
        throw error;
      },
      getUser: async (uid) => {
        console.log('Mock get user by uid:', uid);
        
        // Check if the user exists in our mock database
        if (mockUsers[uid]) {
          return mockUsers[uid];
        }
        
        // Try to find user in users.json
        try {
          const usersFilePath = path.join(__dirname, 'users.json');
          if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            const users = JSON.parse(usersData);
            const foundUser = users.find(u => u.uid === uid);
            
            if (foundUser) {
              // Load user into memory
              mockUsers[uid] = foundUser;
              mockUsers[foundUser.email] = foundUser;
              return foundUser;
            }
          }
        } catch (error) {
          console.error('Error reading users.json:', error);
        }
        
        // User not found
        const error = new Error('User not found');
        error.code = 'auth/user-not-found';
        throw error;
      },
      // Add a method to verify password (for mock implementation)
      verifyPassword: async (email, password) => {
        // In development, any password is valid for registered users
        try {
          const user = mockUsers[email];
          return user && user.password === password;
        } catch (error) {
          return false;
        }
      }
    };
  };
}

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'maggi-sales-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use authentication middleware from server-auth.js
const authenticateUser = authModule.authenticateUser;

// Apply authentication middleware to all routes
app.use(authenticateUser);

// Store settings
let settings = {
  outlet: 'LOTUS MUTIARA RINI',
  activationDate: '18/5/2025'
};

// Try to load settings if they exist
try {
  if (fs.existsSync(path.join(__dirname, 'settings.json'))) {
    settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8'));
  }
} catch (err) {
  console.error('Error loading settings:', err);
}

// Product data
const products = {
  bagNoodles: [
    { name: 'M2MN Kari', price: 4.49, units: 55 },
    { name: 'M2MN Ayam', price: 4.49, units: 39 },
    { name: 'M2MN Tom Yam', price: 5.75, units: 4 },
    { name: 'M2MN Asam Laksa', price: 5.75, units: 2 },
    { name: 'Maggi Big Kari', price: 6.35, units: 13 },
    { name: 'Maggi Big Ayam', price: 6.35, units: 5 },
    { name: 'Maggi Big Tom Yam', price: 6.75, units: 2 },
    { name: 'Maggi Syiok! Tom Yam Kaw', price: 7.79, units: 2 },
    { name: 'Maggi Syiok! Kari Kaw', price: 7.79, units: 1 },
    { name: 'Maggi Syiok! Mi Goreng Cili Ala Kampung', price: 7.55, units: 2 },
    { name: 'Maggi Syiok! Aglio Olio', price: 7.79, units: 0 },
    { name: 'Maggi Mi Goreng Laksa Warisan', price: 0, units: 0 },
    { name: 'Maggi Pedas Giler Ayam Bakar', price: 8.29, units: 6 },
    { name: 'Maggi Pedas Giler Tom Yummz', price: 8.29, units: 0 },
    { name: 'Maggi Pedas Giler Cheezy Berapi', price: 10.49, units: 0 }
  ],
  portableNoodles: [
    { name: 'Maggi Pedas Giler Ayam Bakar Bowl', price: 3.85, units: 1 },
    { name: 'Maggi Pedas Giler Tom Yumzz Bowl', price: 3.85, units: 0 },
    { name: 'Maggi Pedas Giler Cheezy Berapi Bowl', price: 4.65, units: 3 },
    { name: 'Maggi Syiok! Hot Mealz Cili Ala Kampung', price: 4.15, units: 0 },
    { name: 'Maggi Syiok! Hot Mealz Kari Kaw', price: 4.15, units: 3 },
    { name: 'Maggi Syiok! Hot Mealz Tom Yam Kaw', price: 4.15, units: 2 },
    { name: 'Maggi Syiok! Aglio Olio Bowl', price: 4.15, units: 0 },
    { name: 'Maggi Hot Cup Kari', price: 2.25, units: 20 },
    { name: 'Maggi Hot Cup Kari (6)', price: 10.95, units: 16 },
    { name: 'Maggi Hot Cup Sup Ayam', price: 2.25, units: 3 },
    { name: 'Maggi Hot Cup Sup Ayam (6)', price: 10.95, units: 0 },
    { name: 'Maggi Hot Cup Tom Yam', price: 2.25, units: 1 },
    { name: 'Maggi Hot Cup Tom Yam (6)', price: 10.95, units: 8 },
    { name: 'Maggi Hot Cup Asam Laksa', price: 2.25, units: 0 },
    { name: 'Maggi Hot Cup Asam Laksa (6)', price: 0, units: 0 },
    { name: 'Maggi Mug Kari', price: 7.95, units: 1 },
    { name: 'Maggi Mug Ayam', price: 0, units: 0 }
  ]
};

// Calculate totals
function calculateTotals() {
  let bagNoodlesTotal = 0;
  let portableNoodlesTotal = 0;
  let totalSalesValue = 0;
  let totalSalesUnits = 0;

  // Calculate bag noodles totals
  products.bagNoodles.forEach(product => {
    bagNoodlesTotal += product.units;
    totalSalesValue += product.price * product.units;
  });

  // Calculate portable noodles totals
  products.portableNoodles.forEach(product => {
    portableNoodlesTotal += product.units;
    totalSalesValue += product.price * product.units;
  });

  totalSalesUnits = bagNoodlesTotal + portableNoodlesTotal;

  return {
    bagNoodlesTotal,
    portableNoodlesTotal,
    totalSalesValue: totalSalesValue.toFixed(2),
    totalSalesUnits
  };
}

// Admin route to view registered users
app.get('/admin/users', (req, res) => {
  // Check if user is admin (in a real app, you would check user role)
  if (req.user && req.user.email) {
    try {
      let users = [];
      if (fs.existsSync(path.join(__dirname, 'users.json'))) {
        users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
      }
      
      res.render('admin-users', { 
        users,
        currentUser: req.user,
        title: 'User Management'
      });
    } catch (error) {
      console.error('Error reading users file:', error);
      res.status(500).send('Error loading users');
    }
  } else {
    // Redirect to login if not authenticated
    res.redirect('/');
  }
});

// Main route - redirect to homepage if logged in, otherwise to login page
app.get('/', (req, res) => {
  // Check if user has a valid session
  if (req.session && req.session.userId) {
    res.redirect('/homepage');
  } else {
    res.redirect('/login');
  }
});

// Login page route
app.get('/login', (req, res) => {
  res.render('login');
});

// Homepage route
app.get('/homepage', (req, res) => {
  // Calculate totals for dashboard stats
  const totals = {
    totalSalesUnits: products.reduce((sum, product) => sum + product.units, 0),
    totalSalesValue: products.reduce((sum, product) => sum + (product.price * product.units), 0).toFixed(2)
  };
  
  res.render('homepage', { totals });
});

// Sales report route - this will be loaded in an iframe from the homepage
app.get('/sales-report', (req, res) => {
  const editMode = false;
  const bagNoodles = products.filter(p => p.category === 'bag');
  const portableNoodles = products.filter(p => p.category === 'portable');
  
  // Calculate totals
  const totals = {
    totalSalesUnits: products.reduce((sum, product) => sum + product.units, 0),
    totalSalesValue: products.reduce((sum, product) => sum + (product.price * product.units), 0).toFixed(2)
  };
  
  res.render('index', { 
    products, 
    bagNoodles, 
    portableNoodles, 
    totals, 
    editMode,
    insights: null,
    forecast: null,
    marketingSuggestions: null,
    geminiApiEnabled: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  });
});

// API endpoint for generating Gemini insights on demand
app.post('/api/generate-insights', async (req, res) => {
  try {
    // Check if Gemini API key is set
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(400).json({ error: 'Gemini API key not set' });
    }
    
    const totals = calculateTotals();
    
    // Prepare data for Gemini
    const salesData = {
      outlet: settings.outlet,
      date: settings.activationDate,
      products,
      totals
    };
    
    // Generate insights based on requested type
    const { insightType } = req.body;
    let result;
    
    switch (insightType) {
      case 'insights':
        result = await geminiService.generateSalesInsights(salesData);
        break;
      case 'forecast':
        result = await geminiService.generateSalesForecast(salesData);
        break;
      case 'marketing':
        result = await geminiService.generateMarketingSuggestions(salesData);
        break;
      case 'all':
        const [insights, forecast, marketingSuggestions] = await Promise.all([
          geminiService.generateSalesInsights(salesData),
          geminiService.generateSalesForecast(salesData),
          geminiService.generateMarketingSuggestions(salesData)
        ]);
        result = { insights, forecast, marketingSuggestions };
        break;
      default:
        return res.status(400).json({ error: 'Invalid insight type' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error generating Gemini insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.get('/edit', (req, res) => {
  const totals = calculateTotals();
  res.render('index', { 
    products, 
    totals,
    outlet: settings.outlet,
    activationDate: settings.activationDate,
    editMode: true,
    insights: null,
    forecast: null,
    marketingSuggestions: null
  });
});

app.post('/save-settings', (req, res) => {
  settings.outlet = req.body.outlet;
  settings.activationDate = req.body.activationDate;
  
  // Save settings to file
  fs.writeFileSync(path.join(__dirname, 'settings.json'), JSON.stringify(settings, null, 2));
  
  res.redirect('/');
});

app.post('/update-products', (req, res) => {
  // Update bag noodles
  products.bagNoodles.forEach((product, index) => {
    const priceKey = `bagNoodlesPrice_${index}`;
    const unitsKey = `bagNoodlesUnits_${index}`;
    
    if (req.body[priceKey]) {
      product.price = parseFloat(req.body[priceKey]);
    }
    
    if (req.body[unitsKey]) {
      product.units = parseInt(req.body[unitsKey], 10);
    }
  });
  
  // Update portable noodles
  products.portableNoodles.forEach((product, index) => {
    const priceKey = `portableNoodlesPrice_${index}`;
    const unitsKey = `portableNoodlesUnits_${index}`;
    
    if (req.body[priceKey]) {
      product.price = parseFloat(req.body[priceKey]);
    }
    
    if (req.body[unitsKey]) {
      product.units = parseInt(req.body[unitsKey], 10);
    }
  });
  
  // Save products to file
  fs.writeFileSync(path.join(__dirname, 'products.json'), JSON.stringify(products, null, 2));
  
  res.redirect('/');
});

// Use authentication routes from server-auth.js
app.use('/api/auth', authModule.router);

// API routes for Chat and Gemini features
app.post('/api/analyze-chat', async (req, res) => {
  try {
    const { conversation, user } = req.body;
    
    // Process the conversation with Gemini API
    const analysis = await geminiService.analyzeChatConversation(conversation, user);
    
    res.json({
      analysis: analysis
    });
  } catch (error) {
    console.error('Error analyzing chat conversation:', error);
    res.status(500).json({ error: 'Failed to analyze chat conversation' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Process the message with Gemini API
    const response = await geminiService.processChatMessage(message, context);
    
    res.json({
      response: response.text,
      updatedContext: response.updatedContext || {}
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Group Chat API endpoints
app.get('/api/chat/users', authenticateUser, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get all users from users.json file
    let users = [];
    if (fs.existsSync(path.join(__dirname, 'users.json'))) {
      users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
    }
    
    // Filter out sensitive information
    const safeUsers = users.map(user => ({
      uid: user.uid,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '/images/avatars/you.png',
      lastLogin: user.lastLogin
    }));
    
    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Error getting chat users:', error);
    res.status(500).json({ error: 'Failed to get chat users' });
  }
});

// Middleware to authenticate WebSocket connections
const authenticateSocket = (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (!sessionID) {
    return next(new Error('Authentication required'));
  }
  
  // You would typically validate the session here
  // For simplicity, we'll just accept any session ID
  next();
};

app.get('/api/insights', async (req, res) => {
  try {
    const totals = calculateTotals();
    const salesData = {
      outlet: settings.outlet,
      date: settings.activationDate,
      products,
      totals
    };
    
    const insights = await geminiService.generateSalesInsights(salesData);
    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.get('/api/forecast', async (req, res) => {
  try {
    const totals = calculateTotals();
    const salesData = {
      outlet: settings.outlet,
      date: settings.activationDate,
      products,
      totals
    };
    
    const forecast = await geminiService.generateSalesForecast(salesData);
    res.json({ forecast });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

app.get('/api/marketing', async (req, res) => {
  try {
    const totals = calculateTotals();
    const salesData = {
      outlet: settings.outlet,
      date: settings.activationDate,
      products,
      totals
    };
    
    const suggestions = await geminiService.generateMarketingSuggestions(salesData);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating marketing suggestions:', error);
    res.status(500).json({ error: 'Failed to generate marketing suggestions' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Check if Gemini API key is set
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('\x1b[33mWARNING: Gemini API key not set. AI features will be disabled.\x1b[0m');
    console.log('\x1b[33mPlease set your API key in the .env file.\x1b[0m');
  } else {
    console.log('\x1b[32mGemini API integration enabled.\x1b[0m');
  }
});
