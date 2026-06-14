const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

module.exports = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const url = `${req.method} ${req.originalUrl}`;
  const log = `[${timestamp}] ${url} - ${req.ip}\n`;
  fs.appendFileSync(path.join(logDir, 'app.log'), log);
  next();
};