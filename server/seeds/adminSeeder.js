require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

const FACULTIES_DATA = [
  { name: 'CSE', code: 'CSE', description: 'Computer Science & Engineering' },
  { name: 'Agriculture', code: 'AGR', description: 'Agriculture' },
  { name: 'Fisheries', code: 'FSH', description: 'Fisheries' },
  { name: 'NFS', code: 'NFS', description: 'Nutrition & Food Science' },
  { name: 'ESDM', code: 'ESDM', description: 'Environmental Science & Disaster Management' },
  { name: 'Law', code: 'LAW', description: 'Law' }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Create Faculties
    const faculties = await Faculty.insertMany(FACULTIES_DATA);
    console.log(`${faculties.length} faculties created`);

    // Create Admin User
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@pstu.edu',
      password: 'Admin@123',
      role: 'admin',
      faculty: faculties[0]._id,
      profilePicture: 'https://via.placeholder.com/150',
      phone: '01234567890'
    });
    adminUser.isVerified = true;
    await adminUser.save();
    console.log('Admin user created');

    // Create Superadmin (platform owner)
    const superadmin = new User({
      name: 'Platform Owner',
      email: 'superadmin@pstu.edu',
      password: 'SuperAdmin@123',
      role: 'superadmin',
      faculty: faculties[0]._id,
      phone: '01700000000'
    });
    superadmin.isVerified = true;
    await superadmin.save();
    console.log('Superadmin user created');

    // Create Sample Teacher & Student
    const teacher = new User({
      name: 'Dr. Mohammad Ahmed',
      email: 'teacher@pstu.edu',
      password: 'Teacher@123',
      role: 'teacher',
      faculty: faculties[0]._id,
      employeeId: 'T001',
      profilePicture: 'https://via.placeholder.com/150',
      phone: '01987654321'
    });
    teacher.isVerified = true;
    await teacher.save();
    console.log('Teacher user created');

    const student = new User({
      name: 'Ahmed Hassan',
      email: 'student@pstu.edu',
      password: 'Student@123',
      role: 'student',
      faculty: faculties[0]._id,
      registrationNumber: 'S001',
      profilePicture: 'https://via.placeholder.com/150',
      phone: '01555555555'
    });
    student.isVerified = true;
    await student.save();
    console.log('Student user created');

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();