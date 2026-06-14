require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to:', mongoose.connection.db.databaseName);

  const result = await User.updateMany(
    { isVerified: { $ne: true } },
    { $set: { isVerified: true }, $unset: { verificationToken: 1, verificationTokenExpires: 1 } }
  );

  console.log(`✓ ${result.modifiedCount} users verified`);

  const total = await User.countDocuments();
  console.log(`Total users in DB: ${total}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => { console.error(err.message); process.exit(1); });
