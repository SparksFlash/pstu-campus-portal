const Notification = require('../models/Notification');
const { sendToUser } = require('./sse');

/**
 * Save a notification to DB and push via SSE if recipient is connected.
 * @param {string|ObjectId} recipientId
 * @param {object} payload  { type, title, body, meta }
 */
async function notify(recipientId, { type = 'general', title, body, meta } = {}) {
  try {
    const doc = await Notification.create({ recipient: recipientId, type, title, body, meta });
    sendToUser(recipientId, 'notification', {
      _id:       doc._id,
      type:      doc.type,
      title:     doc.title,
      body:      doc.body,
      meta:      doc.meta,
      isRead:    false,
      createdAt: doc.createdAt,
    });
    return doc;
  } catch (err) {
    console.error('notify() error:', err.message);
  }
}

/**
 * Notify all users in an array of IDs.
 */
async function notifyMany(recipientIds, payload) {
  await Promise.all(recipientIds.map(id => notify(id, payload)));
}

module.exports = { notify, notifyMany };
