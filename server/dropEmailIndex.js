// Script to drop the problematic email index

const mongoose = require('mongoose');
const config = require('./config/config');

async function dropEmailIndex() {
  try {
    // Connect to MongoDB using the correct path to the URI
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('Connected to MongoDB');

    // Drop the problematic index
    await mongoose.connection.db.collection('users').dropIndex('email_1');
    console.log('Successfully dropped email_1 index');
  } catch (error) {
    if (error.code === 27) {
      console.log('Index email_1 does not exist - already removed');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

dropEmailIndex();