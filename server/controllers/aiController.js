const { groqChat }   = require('../utils/embeddings');
const Notice         = require('../models/Notice');
const Course         = require('../models/Course');
const ClassRoutine   = require('../models/ClassRoutine');
const Result         = require('../models/Result');
const User           = require('../models/User');
const Institution    = require('../models/Institution');

// Build user-specific personal context from DB
async function buildPersonalContext(user) {
  const ctx = { name: user.name, role: user.role };

  if (user.role === 'student') {
    const results = await Result.find({ student: user._id }).sort({ semester: 1 }).select('semester gpa');
    const cgpa = results.length
      ? (results.reduce((s, r) => s + (r.gpa || 0), 0) / results.length).toFixed(2)
      : null;

    const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const facultyId = user.faculty?._id || user.faculty;
    const routine   = facultyId
      ? await ClassRoutine.findOne({ faculty: facultyId, semester: user.semester })
      : null;

    const todayClasses = (routine?.entries || [])
      .filter(e => e.day === todayName)
      .map(e => `${e.timeSlot}: ${e.courseCode} - ${e.courseTitle} (${e.room || 'TBA'})`);

    const courses = await Course.find({ faculty: facultyId, semester: user.semester }).select('code title');

    Object.assign(ctx, {
      semester:     user.semester,
      faculty:      user.faculty?.name || 'N/A',
      cgpa:         cgpa || 'No results yet',
      semesterGPAs: results.map(r => `Sem ${r.semester}: GPA ${r.gpa || 'N/A'}`),
      todayClasses: todayClasses.length ? todayClasses : ['No classes today'],
      enrolledCourses: courses.map(c => `${c.code} - ${c.title}`),
    });

  } else if (user.role === 'teacher') {
    const courses = await Course.find({ teacher: user._id }).select('code title semester').populate('faculty', 'name');
    const studentCount = await User.countDocuments({ role: 'student', faculty: user.faculty });
    Object.assign(ctx, {
      faculty:      user.faculty?.name || 'N/A',
      teachingCourses: courses.map(c => `${c.code} - ${c.title} (Sem ${c.semester})`),
      totalStudentsInFaculty: studentCount,
    });

  } else if (user.role === 'admin') {
    const [students, teachers, institutions] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Institution.find().sort({ createdAt: -1 }).select('universityName location type plan status createdAt'),
    ]);
    Object.assign(ctx, {
      totalStudents: students,
      totalTeachers: teachers,
      institutionSummary: {
        total:    institutions.length,
        active:   institutions.filter(i => i.status === 'Active').length,
        pending:  institutions.filter(i => i.status === 'Pending').length,
        rejected: institutions.filter(i => i.status === 'Rejected').length,
      },
      institutions: institutions.map(i =>
        `${i.universityName} | ${i.location} | ${i.type} | Plan: ${i.plan} | Status: ${i.status} | Applied: ${new Date(i.createdAt).toLocaleDateString('en-BD')}`
      ),
    });
  }

  return ctx;
}

// POST /api/v1/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured.' });
    }

    // 1. Fetch relevant notices (latest 5 active)
    const notices = await Notice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title content createdAt');

    // 2. Personal context from DB
    const personal = await buildPersonalContext(req.user);

    // 3. Build system prompt
    const noticeContext = notices.length
      ? notices.map(n => `• ${n.title}: ${String(n.content).slice(0, 200)}`).join('\n')
      : 'No active notices.';

    const systemPrompt = `You are PSTU Campus AI Assistant for Patuakhali Science and Technology University, Bangladesh.
Always respond in the SAME LANGUAGE the user writes in — Bengali (বাংলা) or English. If they mix, you mix too.
Be friendly, helpful, and concise. Use ONLY the provided context to answer. Do not make up information.
If you don't have the answer in the context, say so honestly.

## Latest Notices from Portal:
${noticeContext}

## Current User's Data:
${JSON.stringify(personal, null, 2)}`;

    // 4. Generate response via Groq
    const reply = await groqChat(systemPrompt, message);

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.message, err.stack?.split('\n')[1]);
    res.status(500).json({ message: err.message || 'AI service unavailable.' });
  }
};
