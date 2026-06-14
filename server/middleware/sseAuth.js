const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Auth middleware for SSE: reads token from ?token= query param
module.exports = async function sseAuth(req, res, next) {
  const token = req.query.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).end();
    req.user = user;
    next();
  } catch {
    res.status(401).end();
  }
};
