const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
require('dotenv').config();

// Global variable to track MongoDB connection status
global.isMongoDBConnected = false;

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.warn('Warning: Could not connect to MongoDB. Running in memory-only mode.');
  console.error('MongoDB connection error:', err.message);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/products', require('./routes/products'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ msg: 'Welcome to Wishlist API' });
});

// Define port
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});