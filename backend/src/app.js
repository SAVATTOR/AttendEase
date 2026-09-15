const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const env = require('./config/env');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

    // In development, also allow localhost:5173 (Vite default)
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'], // Allow frontend to read filename from response
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') ? 50000 : 100, // Higher limit for dev/test
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for test helper endpoints
    return req.path.startsWith('/api/auth/test/');
  },
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') ? 5000 : 10, // Higher limit for dev/test
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
  skip: (req) => {
    // Skip rate limiting for test helper endpoints
    return req.path.startsWith('/api/auth/test/');
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Attendance System API Server',
    version: '1.0.0',
    documentation: '/api',
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;