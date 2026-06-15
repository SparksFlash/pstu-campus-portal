const nodemailer = require('nodemailer');

const FROM_NAME  = process.env.EMAIL_FROM_NAME || 'PSTU Campus Portal';
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  // Fallback: Gmail (works in development)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  console.warn('[Email] Credentials not configured — emails will be logged only');
}

exports.sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log('[DEV EMAIL] To:', to, '| Subject:', subject);
    return { messageId: 'dev-logged', accepted: [to] };
  }

  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  console.log('[Email] Sent:', info.messageId, '→', to);
  return info;
};

exports.sendWelcomeEmail = async (to, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1d4ed8">Welcome to PSTU Campus Portal</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account has been created successfully. You can now log in and access all features.</p>
      <p style="color:#6b7280;font-size:13px">Patuakhali Science and Technology University</p>
    </div>`;
  return exports.sendEmail(to, 'Welcome to PSTU Campus Portal', html);
};

exports.sendGradeNotification = async (to, studentName, courseName, gpa) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1d4ed8">Grade Posted</h2>
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your grade for <strong>${courseName}</strong> has been posted.</p>
      <p>GPA: <strong>${gpa}</strong></p>
    </div>`;
  return exports.sendEmail(to, `Grade Posted: ${courseName}`, html);
};

exports.sendResultNotification = async (to, studentName, semester, cgpa) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1d4ed8">Result Published</h2>
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your result for <strong>Semester ${semester}</strong> is now available.</p>
      <p>CGPA: <strong>${cgpa}</strong></p>
    </div>`;
  return exports.sendEmail(to, `Semester ${semester} Result Published`, html);
};
