require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const sampleUsers = [
  { name: 'Ab', email: 'AB@example.com', age: 28 },
  { name: 'CD', email: 'CD@example.com', age: 35 },
  { name: 'EF', email: 'EF@example.com', age: 22 },
  { name: 'GH', email: 'GH@example.com', age: 30 },
  { name: 'IJ', email: 'IJ@example.com', age: 40 }
];

async function seedDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/prodigy_bd_02';
    
    await mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    });

    console.log('Connected to MongoDB');

  
    await User.deleteMany({});
    console.log('Cleared existing users');


    await User.insertMany(sampleUsers);
    console.log(`Inserted ${sampleUsers.length} sample users`);


    const users = await User.find().sort('name');
    console.log('\nCurrent users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}, ${user.age} years)`);
    });

    console.log(' Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();