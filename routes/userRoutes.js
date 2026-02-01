const express = require('express');
const router = express.Router();
const User = require('../models/User');

//create user
router.post('/', async (req, res) => {
  try {
    const { name, email, age } = req.body;

    // REMOVED the early duplicate check - it was causing validation issues

    // Create new user
    const user = new User({ name, email, age });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        ageGroup: user.ageGroup,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Handle duplicate email error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Email already registered',
        suggestion: 'Please use a different email address'
      });
    }
    
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Could not create user'
    });
  }
});

// GET /users
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = '-createdAt' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      select: '_id name email age status createdAt'
    };

    const users = await User.paginate(query, options);

    res.status(200).json({
      success: true,
      data: users.docs,
      pagination: {
        total: users.totalDocs,
        limit: users.limit,
        page: users.page,
        pages: users.totalPages,
        hasNext: users.hasNextPage,
        hasPrev: users.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Could not fetch users'
    });
  }
});

//GET users
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('_id name email age status ageGroup createdAt updatedAt');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID format',
        message: 'Please provide a valid user ID'
      });
    }
    
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Could not fetch user'
    });
  }
});

// UPDATE USER 
router.put('/:id', async (req, res) => {
  try {
    const { name, email, age, status } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `Cannot update non-existent user with ID: ${req.params.id}`
      });
    }

    // Check for email conflict only if email is being changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email conflict',
          message: 'Email already registered to another user'
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (age !== undefined) updateData.age = age;
    if (status !== undefined) updateData.status = status;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).select('_id name email age status ageGroup createdAt updatedAt');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID format',
        message: 'Please provide a valid user ID'
      });
    }
    
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Could not update user'
    });
  }
});

// DELETE users
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `Cannot delete non-existent user with ID: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID format',
        message: 'Please provide a valid user ID'
      });
    }
    
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Could not delete user'
    });
  }
});

// GET users health
router.get('/health/status', async (req, res) => {
  try {
    const db = require('../config/database');
    const stats = db.getStats();
    
    const userCount = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      service: 'User API',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: db.isConnected(),
        stats: stats,
        userCount: userCount
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

//GET /users/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageAge: { $avg: '$age' },
          minAge: { $min: '$age' },
          maxAge: { $max: '$age' }
        }
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          averageAge: { $round: ['$averageAge', 2] },
          minAge: 1,
          maxAge: 1
        }
      }
    ]);

    const statusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {},
        statusDistribution,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Could not fetch statistics'
    });
  }
});

module.exports = router;