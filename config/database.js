const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/prodigy_bd_02';
    
    console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    const options = {
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(uri, options);
    
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.log('Make sure MongoDB service is running on Windows:');
    console.log('1. Open PowerShell as Administrator');
    console.log('2. Run: Start-Service MongoDB');
    console.log('3. Or: net start MongoDB (Command Prompt as Admin)');
    throw error; 
  }
};

module.exports = connectDB;
