require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB().then(() => {
  console.log('Database initialization complete');
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌';
  res.json({
    message: 'PRODIGY_BD_02 - REST API with MongoDB',
    version: '2.0.0',
    database: dbStatus,
    endpoints: {
      users: {
        POST: '/users - Create user',
        GET: '/users - Get all users',
        GET_ONE: '/users/:id - Get specific user',
        PUT: '/users/:id - Update user',
        DELETE: '/users/:id - Delete user',
        HEALTH: '/users/health - Health check'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: ['GET /', 'GET /health', 'POST /users', 'GET /users', 'GET /users/:id', 'PUT /users/:id', 'DELETE /users/:id']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  PRODIGY_BD_02 Server Started
   Port: ${PORT}
   URL: http://localhost:${PORT}
   Time: ${new Date().toLocaleString()}`);
});
