require('dotenv').config();
const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');

const FACULTIES_DATA = [
  { name: 'CSE', code: 'CSE', description: 'Computer Science & Engineering', totalSemesters: 8 },
  { name: 'Agriculture', code: 'AGR', description: 'Agriculture', totalSemesters: 8 },
  { name: 'Fisheries', code: 'FSH', description: 'Fisheries', totalSemesters: 8 },
  { name: 'NFS', code: 'NFS', description: 'Nutrition & Food Science', totalSemesters: 8 },
  { name: 'ESDM', code: 'ESDM', description: 'Environmental Science & Disaster Management', totalSemesters: 8 },
  { name: 'Law', code: 'LAW', description: 'Law', totalSemesters: 8 }
];

const seedFaculties = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const result = await Faculty.insertMany(FACULTIES_DATA);
    console.log(`${result.length} faculties created successfully`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedFaculties();