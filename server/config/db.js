const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quizpulse';
    
    if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
      console.error('❌ CRITICAL ERROR: MONGO_URI environment variable is missing on production server.');
      console.error('Please set MONGO_URI in your Render Environment settings to a cloud database URI (e.g. MongoDB Atlas).');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
