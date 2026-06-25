const Notice = require('../models/Notice');
const User   = require('../models/User');
const { notifyMany } = require('../utils/notify');
const { getEmbedding } = require('../utils/embeddings');

// Fire-and-forget: generate embedding and save it back
const embedNotice = (notice) => {
  if (!process.env.GEMINI_API_KEY) return;
  const text = `${notice.title}. ${notice.content}`;
  getEmbedding(text)
    .then(vec => Notice.findByIdAndUpdate(notice._id, { embedding: vec }))
    .catch(() => {});
};

exports.getAllNotices = async (req, res) => {
  try {
    const { faculty, isActive, limit, q } = req.query;
    const filter = { isActive: isActive !== 'false' };
    if (faculty) filter.faculty = faculty;
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { content: { $regex: q, $options: 'i' } },
    ];
    let query = Notice.find(filter).populate('createdBy faculty').sort({ createdAt: -1 });
    if (limit) query = query.limit(parseInt(limit, 10));
    const notices = await query;
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy faculty');
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { title, content, faculty, attachments, publishDate, expiryDate } = req.body;
    const notice = new Notice({
      title, content, createdBy: req.user._id, faculty, attachments, publishDate, expiryDate
    });
    await notice.save();

    // Notify all users (or faculty-specific users if faculty is set)
    const userFilter = { isActive: true };
    if (faculty) userFilter.faculty = faculty;
    const users = await User.find(userFilter).select('_id');
    const ids   = users.map(u => u._id);
    notifyMany(ids, {
      type:  'notice_created',
      title: `New notice: ${title}`,
      body:  content?.substring(0, 120) || '',
      meta:  { noticeId: notice._id },
    }).catch(() => {});

    embedNotice(notice);  // async, doesn't block response
    res.status(201).json(notice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    embedNotice(notice);  // re-embed if content changed
    res.json(notice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};