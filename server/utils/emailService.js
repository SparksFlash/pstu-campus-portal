const FROM_NAME  = process.env.EMAIL_FROM_NAME || 'PSTU Campus Portal';
const FROM_EMAIL = process.env.EMAIL_FROM || 'ug2102056@cse.pstu.ac.bd';

const sendViaBrevoAPI = async (to, subject, html) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not set');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Brevo API ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  console.log('[Email] Sent via Brevo API → messageId:', data.messageId, '→ to:', to);
  return data;
};

exports.sendEmail = async (to, subject, html) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('[DEV EMAIL] To:', to, '| Subject:', subject);
    return { messageId: 'dev-logged' };
  }
  return sendViaBrevoAPI(to, subject, html);
};

exports.sendWelcomeEmail = (to, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#1d4ed8">Welcome to PSTU Campus Portal</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account has been created. You can now log in and access all features.</p>
      <p style="color:#6b7280;font-size:13px">Patuakhali Science and Technology University</p>
    </div>`;
  return exports.sendEmail(to, 'Welcome to PSTU Campus Portal', html);
};

exports.sendGradeNotification = (to, studentName, courseName, gpa) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#1d4ed8">Grade Posted</h2>
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your grade for <strong>${courseName}</strong> has been posted. GPA: <strong>${gpa}</strong></p>
    </div>`;
  return exports.sendEmail(to, `Grade Posted: ${courseName}`, html);
};

exports.sendResultNotification = (to, studentName, semester, cgpa) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#1d4ed8">Result Published</h2>
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Semester <strong>${semester}</strong> result is now available. CGPA: <strong>${cgpa}</strong></p>
    </div>`;
  return exports.sendEmail(to, `Semester ${semester} Result Published`, html);
};
