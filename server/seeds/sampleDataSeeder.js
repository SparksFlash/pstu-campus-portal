require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const User = require('../models/User');

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Get first faculty and teacher
    const faculty = await Faculty.findOne();
    const teacher = await User.findOne({ role: 'teacher' });

    if (!faculty || !teacher) {
      console.log('Faculty or Teacher not found. Run admin seeder first.');
      process.exit(1);
    }

    const coursesData = [
      { code: 'CSE101', title: 'Intro to Programming', faculty: faculty._id, semester: 1, creditHours: 3, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE102', title: 'Data Structures', faculty: faculty._id, semester: 2, creditHours: 4, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE201', title: 'Database Systems', faculty: faculty._id, semester: 3, creditHours: 3, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE301', title: 'Web Development', faculty: faculty._id, semester: 4, creditHours: 4, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE401', title: 'Security Fundamentals', faculty: faculty._id, semester: 5, creditHours: 3, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE501', title: 'Machine Learning', faculty: faculty._id, semester: 6, creditHours: 4, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE601', title: 'Cloud Computing', faculty: faculty._id, semester: 7, creditHours: 3, teacher: teacher._id, totalMarks: 100 },
      { code: 'CSE701', title: 'AI & Advanced Topics', faculty: faculty._id, semester: 8, creditHours: 4, teacher: teacher._id, totalMarks: 100 }
    ];

    // Delete existing courses first
    await Course.deleteMany({ faculty: faculty._id });

    const courses = await Course.insertMany(coursesData);
    console.log(`${courses.length} sample courses created`);

    // Get students from the same faculty and enroll them in courses
    const students = await User.find({ role: 'student', faculty: faculty._id }).sort({ name: 1 });
    console.log(`Found ${students.length} students in faculty`);

    // Enroll all students in all courses
    for (let i = 0; i < courses.length; i++) {
      const courseWithStudents = await Course.findByIdAndUpdate(
        courses[i]._id,
        { $set: { students: students.map(s => s._id) } },
        { new: true }
      );
      console.log(`Enrolled ${students.length} students in ${courses[i].code}`);
    }

    console.log('Sample data seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedSampleData();