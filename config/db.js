const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
    global.isMongoDBConnected = true;
    return true;
  } catch (error) {
    // Instead of exiting, we'll throw the error to be handled by the caller
    global.isMongoDBConnected = false;
    throw error;
  }
};

module.exports = connectDB;