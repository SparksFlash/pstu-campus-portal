require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'superadmin@pstu.edu' });
  if (existing) {
    console.log('Superadmin already exists. Updating role...');
    existing.role = 'superadmin';
    existing.isVerified = true;
    await existing.save({ validateBeforeSave: false });
    console.log('Done.');
    process.exit(0);
  }

  const superadmin = new User({
    name: 'Platform Owner',
    email: 'superadmin@pstu.edu',
    password: 'SuperAdmin@123',
    role: 'superadmin',
    phone: '01700000000',
    isVerified: true,
  });
  await superadmin.save();
  console.log('Superadmin created: superadmin@pstu.edu / SuperAdmin@123');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
