const { groqChat }   = require('../utils/embeddings');
const Notice         = require('../models/Notice');
const Course         = require('../models/Course');
const Faculty        = require('../models/Faculty');
const ClassRoutine   = require('../models/ClassRoutine');
const Result         = require('../models/Result');
const User           = require('../models/User');
const Institution    = require('../models/Institution');
const { SEMESTER_FEE } = require('../config/constants');

// Build system-wide context: all courses grouped by faculty/semester + latest notices
async function buildSystemContext() {
  const [courses, notices] = await Promise.all([
    Course.find()
      .populate('faculty', 'name')
      .populate('teacher', 'name')
      .select('code title faculty semester creditHours teacher'),
    Notice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title content createdAt'),
  ]);

  // Group: facultyName → semester → formatted course lines
  const grouped = {};
  for (const c of courses) {
    const fac = c.faculty?.name || 'Unassigned';
    const sem = String(c.semester || '?');
    if (!grouped[fac]) grouped[fac] = {};
    if (!grouped[fac][sem]) grouped[fac][sem] = [];
    const teacherPart = c.teacher?.name ? `, Teacher: ${c.teacher.name}` : '';
    grouped[fac][sem].push(`${c.code} - ${c.title} (${c.creditHours || 0} credit hours${teacherPart})`);
  }

  const courseText = Object.entries(grouped).map(([fac, sems]) => {
    const semLines = Object.entries(sems)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([sem, items]) => {
        const totalCr = items.reduce((s, line) => {
          const m = line.match(/\((\d+(?:\.\d+)?) credit/);
          return s + (m ? parseFloat(m[1]) : 0);
        }, 0);
        return `  Semester ${sem} (${totalCr} total credits):\n` +
               items.map(i => `    - ${i}`).join('\n');
      }).join('\n');
    return `### ${fac}\n${semLines}`;
  }).join('\n\n');

  const noticeText = notices.length
    ? notices.map(n =>
        `• [${new Date(n.createdAt).toLocaleDateString('en-BD')}] ${n.title}: ${String(n.content).slice(0, 250)}`
      ).join('\n')
    : 'No active notices.';

  return { courseText, noticeText, totalCourses: courses.length };
}

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

    const courses = await Course.find({ faculty: facultyId, semester: user.semester }).select('code title creditHours');

    // Calculate semester fee from credit hours
    let feeBreakdown = null;
    if (facultyId && user.semester) {
      const totalCredits = courses.reduce((s, c) => s + (c.creditHours || 0), 0);
      if (totalCredits > 0) {
        const creditFee = totalCredits * SEMESTER_FEE.creditHourRate;
        feeBreakdown = {
          totalCredits,
          creditFee,
          admissionFee:   SEMESTER_FEE.admissionFee,
          enrollmentFee:  SEMESTER_FEE.enrollmentFee,
          hallFee:        SEMESTER_FEE.hallFee,
          cseClubFee:     SEMESTER_FEE.cseClubFee,
          grandTotal:     creditFee + SEMESTER_FEE.admissionFee + SEMESTER_FEE.enrollmentFee
                          + SEMESTER_FEE.hallFee + SEMESTER_FEE.cseClubFee,
        };
      }
    }

    Object.assign(ctx, {
      semester:        user.semester,
      faculty:         user.faculty?.name || 'N/A',
      cgpa:            cgpa || 'No results yet',
      semesterGPAs:    results.map(r => `Sem ${r.semester}: GPA ${r.gpa || 'N/A'}`),
      todayClasses:    todayClasses.length ? todayClasses : ['No classes today'],
      enrolledCourses: courses.map(c => `${c.code} - ${c.title} (${c.creditHours} cr)`),
      semesterFee:     feeBreakdown
        ? `BDT ${feeBreakdown.grandTotal} (${feeBreakdown.totalCredits} credits × ${SEMESTER_FEE.creditHourRate} + fees)`
        : 'Not available (no courses configured for this semester)',
      feeBreakdown,
    });

  } else if (user.role === 'teacher') {
    const courses = await Course.find({ teacher: user._id }).select('code title semester').populate('faculty', 'name');
    const studentCount = await User.countDocuments({ role: 'student', faculty: user.faculty });
    Object.assign(ctx, {
      faculty:                 user.faculty?.name || 'N/A',
      teachingCourses:         courses.map(c => `${c.code} - ${c.title} (Sem ${c.semester})`),
      totalStudentsInFaculty:  studentCount,
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

    // Fetch system context (all courses + notices) and personal context in parallel
    const [{ courseText, noticeText, totalCourses }, personal] = await Promise.all([
      buildSystemContext(),
      buildPersonalContext(req.user),
    ]);

    const systemPrompt = `You are PSTU Campus AI Assistant for Patuakhali Science and Technology University (PSTU), Bangladesh.
Always respond in the SAME LANGUAGE the user writes in — Bengali (বাংলা) or English. If they mix, you mix too.
Be friendly, helpful, and concise. Use ONLY the provided context to answer. Do not make up information.
If you don't have the answer in the context, say so honestly.

## University Course Catalogue (${totalCourses} total courses):
${courseText || 'No courses in system yet.'}

## Latest Notices (up to 10):
${noticeText}

## Current User's Personal Data:
${JSON.stringify(personal, null, 2)}`;

    const reply = await groqChat(systemPrompt, message);

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.message, err.stack?.split('\n')[1]);
    res.status(500).json({ message: err.message || 'AI service unavailable.' });
  }
};
