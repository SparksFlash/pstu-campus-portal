const { getEmbedding, getChatModel } = require('../utils/embeddings');
const Notice       = require('../models/Notice');
const Course       = require('../models/Course');
const ClassRoutine = require('../models/ClassRoutine');
const Result       = require('../models/Result');
const User         = require('../models/User');

// Atlas Vector Search — returns top docs or [] if index doesn't exist yet
async function vectorSearch(Model, indexName, queryVector, limit = 3) {
  try {
    return await Model.aggregate([
      {
        $vectorSearch: {
          index: indexName,
          path: 'embedding',
          queryVector,
          numCandidates: 30,
          limit,
        },
      },
      { $project: { embedding: 0, score: { $meta: 'vectorSearchScore' } } },
    ]);
  } catch {
    // Index not created yet — graceful fallback
    return [];
  }
}

// Build user-specific personal context from DB
async function buildPersonalContext(user) {
  const ctx = { name: user.name, role: user.role, email: user.email };

  if (user.role === 'student') {
    const results = await Result.find({ student: user._id })
      .sort({ semester: 1 })
      .select('semester gpa grades');

    const cgpa = results.length
      ? (results.reduce((s, r) => s + (r.gpa || 0), 0) / results.length).toFixed(2)
      : null;

    const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const facultyId = user.faculty?._id || user.faculty;
    const routine   = facultyId
      ? await ClassRoutine.findOne({ faculty: facultyId, semester: user.semester })
      : null;

    const todayClasses = (routine?.entries || [])
      .filter(e => e.day === todayName)
      .map(e => `${e.timeSlot}: ${e.courseCode} - ${e.courseTitle} (${e.room || 'TBA'})`);

    Object.assign(ctx, {
      semester:     user.semester,
      faculty:      user.faculty?.name || 'N/A',
      cgpa:         cgpa || 'No results yet',
      semesterGPAs: results.map(r => `Sem ${r.semester}: ${r.gpa || 'N/A'}`),
      todayClasses: todayClasses.length ? todayClasses : ['No classes scheduled today'],
    });

  } else if (user.role === 'teacher') {
    const courses = await Course.find({ teacher: user._id })
      .select('code title semester')
      .populate('faculty', 'name');

    const studentCount = await User.countDocuments({ role: 'student', faculty: user.faculty });

    Object.assign(ctx, {
      faculty:      user.faculty?.name || 'N/A',
      courses:      courses.map(c => `${c.code} - ${c.title} (Sem ${c.semester})`),
      studentCount,
    });

  } else if (user.role === 'admin') {
    const [students, teachers, faculties] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
    ]);
    Object.assign(ctx, { totalStudents: students, totalTeachers: teachers, totalAdmins: faculties });
  }

  return ctx;
}

// POST /api/v1/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured. Add GEMINI_API_KEY to server .env' });
    }

    // 1. Embed the user's question
    const queryVector = await getEmbedding(message);

    // 2. RAG: semantic search on notices + courses in parallel
    const [ragNotices, ragCourses] = await Promise.all([
      vectorSearch(Notice, 'notice_vector_index', queryVector, 3),
      vectorSearch(Course, 'course_vector_index', queryVector, 3),
    ]);

    // 3. Personal context from DB
    const personal = await buildPersonalContext(req.user);

    // 4. Build system prompt
    const noticeContext = ragNotices.length
      ? ragNotices.map(n => `• [Notice] ${n.title}: ${String(n.content).slice(0, 300)}`).join('\n')
      : '(no relevant notices found)';

    const courseContext = ragCourses.length
      ? ragCourses.map(c => `• [Course] ${c.code} - ${c.title}, Sem ${c.semester}`).join('\n')
      : '(no relevant courses found)';

    const systemPrompt = `You are PSTU Campus AI Assistant for Patuakhali Science and Technology University.
Always respond in the SAME LANGUAGE the user writes in (Bengali or English). Mix is fine too.
Be friendly, concise, and accurate. Use ONLY the provided context — do not make up information.
If the answer is not in the context, say so honestly.

## Relevant Portal Information (from knowledge base):
${noticeContext}

${courseContext}

## Current User's Personal Data:
${JSON.stringify(personal, null, 2)}

Now answer the user's question using the above context only.`;

    // 5. Generate response
    const model = getChatModel();
    const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
    const reply  = result.response.text();

    res.json({ reply, ragHits: ragNotices.length + ragCourses.length });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ message: 'AI service unavailable. Please try again shortly.' });
  }
};
