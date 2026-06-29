const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    // Connect using Mongoose
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ MongoDB connection successful!');
    console.log('✓ Connected to:', mongoose.connection.name);
    
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Health Check - Verify MongoDB Connection
const checkDatabaseHealth = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 });
    await client.close();
    
    console.log('✓ Pinged your deployment. MongoDB connection verified!');
    return true;
  } catch (error) {
    console.error('✗ Database Health Check Failed:', error.message);
    return false;
  }
};

// Handle Connection Events
mongoose.connection.on('connected', () => {
  console.log('✓ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠ Mongoose disconnected from MongoDB');
});

module.exports = {
  connectDatabase,
  checkDatabaseHealth,
};
