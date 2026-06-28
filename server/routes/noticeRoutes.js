const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { requireFields } = require('../middleware/validation');
const {
  getAllNotices, getNoticeById, createNotice, updateNotice, deleteNotice
} = require('../controllers/noticeController');

router.get('/', getAllNotices);
router.get('/latest', getAllNotices);   // ?limit=N — must be before /:id
router.get('/search', getAllNotices);   // ?q=keyword — must be before /:id
router.get('/:id', getNoticeById);
router.post('/', auth, allowRoles('admin', 'superadmin', 'teacher'), requireFields('title', 'content'), createNotice);
router.put('/:id', auth, allowRoles('admin', 'superadmin', 'teacher'), updateNotice);
router.delete('/:id', auth, allowRoles('admin', 'superadmin'), deleteNotice);

module.exports = router;