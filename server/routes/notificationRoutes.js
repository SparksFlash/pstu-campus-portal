const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const sseAuth    = require('../middleware/sseAuth');
const {
  stream,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');

// SSE uses token from query string (EventSource can't set headers)
router.get('/stream',        sseAuth, stream);
router.get('/',              auth, getNotifications);
router.get('/unread-count',  auth, getUnreadCount);
router.patch('/read-all',    auth, markAllRead);
router.patch('/:id/read',    auth, markRead);
router.delete('/:id',        auth, deleteNotification);

module.exports = router;
