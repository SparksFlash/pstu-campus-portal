const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  console.warn('Email credentials not configured - emails will be logged (dev mode)');
}

exports.sendEmail = async (to, subject, html) => {
  if (!transporter) {
    // Development fallback: log the email instead of sending
    console.log('DEV EMAIL - to:', to);
    console.log('DEV EMAIL - subject:', subject);
    console.log('DEV EMAIL - html:', html);
    return { messageId: 'dev-logged', accepted: [to] };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email error:', err);
    throw err;
  }
};

exports.sendGradeNotification = async (to, studentName, courseName, gpa) => {
  const html = `<h2>Grade Notification</h2><p>Hi ${studentName},</p><p>Your grade for ${courseName} has been posted. GPA: ${gpa}</p>`;
  return exports.sendEmail(to, 'Grade Posted', html);
};

exports.sendResultNotification = async (to, studentName, semester, cgpa) => {
  const html = `<h2>Result Posted</h2><p>Hi ${studentName},</p><p>Your result for Semester ${semester} is now available. CGPA: ${cgpa}</p>`;
  return exports.sendEmail(to, 'Result Posted', html);
};