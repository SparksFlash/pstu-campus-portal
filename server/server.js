require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { connectDatabase } = require('./config/database');

const app = express();

// Trust Render/proxy headers (required for rate limiter behind reverse proxy)
app.set('trust proxy', 1);

// Swagger / OpenAPI setup
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSTU API',
      version: '1.0.0',
      description: 'PSTU Web App API documentation'
    },
    servers: [
      { url: `${process.env.SERVER_URL || 'http://localhost:' + (process.env.PORT || 5000)}/api/v1` }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security headers
app.use(helmet());

// Prevent NoSQL injection via query string
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// CORS — restricted to configured client origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Cookie parser (needed for httpOnly refresh tokens)
app.use(cookieParser());

app.use(morgan('dev'));
app.use(logger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiters — relaxed in development to avoid hitting limits during testing
const isDev = process.env.NODE_ENV !== 'production';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,   // skip entirely in development
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

app.use('/api/v1', globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// Database Connection
connectDatabase().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes (all under /api/v1)
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/faculties', require('./routes/facultyRoutes'));
app.use('/api/v1/courses', require('./routes/courseRoutes'));
app.use('/api/v1/grades', require('./routes/gradeRoutes'));
app.use('/api/v1/results', require('./routes/resultRoutes'));
app.use('/api/v1/teacher',     require('./routes/teacherRoutes'));
app.use('/api/v1/student',       require('./routes/studentRoutes'));
app.use('/api/v1/enrollments',   require('./routes/enrollmentRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/payments',      require('./routes/paymentRoutes'));
app.use('/api/v1/notices', require('./routes/noticeRoutes'));
app.use('/api/v1/bus-schedule', require('./routes/busRoutes'));
app.use('/api/v1/phone-diary', require('./routes/phoneRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler (must be last)
app.use(errorHandler);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_RETRIES = parseInt(process.env.PORT_RETRIES, 10) || 5;

function startServer(port, retriesLeft) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
      if (retriesLeft > 0) {
        const nextPort = port + 1;
        console.log(`Attempting to listen on port ${nextPort} (retries left: ${retriesLeft - 1})...`);
        setTimeout(() => startServer(nextPort, retriesLeft - 1), 300);
      } else {
        console.error(`Unable to bind to a port after multiple attempts. Please free port ${port} or set PORT environment variable.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down server...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer(DEFAULT_PORT, MAX_PORT_RETRIES);

// Serve a PSTU bus image from workspace root for frontend backgrounds
const path = require('path');
app.get('/assets/pstu_bus.jpg', (req, res) => {
  const imgPath = path.resolve(__dirname, '../../Pstu_bus.jpg');
  res.sendFile(imgPath, (err) => {
    if (err) {
      console.error('Failed to send pstu_bus.jpg:', err);
      res.status(404).end();
    }
  });
});
