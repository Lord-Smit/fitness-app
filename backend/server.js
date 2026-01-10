const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const xssClean = require('xss-clean');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      'exp://localhost:19000',
      'exp://localhost:8081',
      'http://localhost:19000',
      'http://localhost:8081',
      'https://u.expo.dev',
      'https://expo.dev',
    ])
  : [
      'http://localhost:8081',
      'http://localhost:19000',
      'http://127.0.0.1:19000',
      'exp://localhost:19000',
      'http://192.168.1.0:19000',
      'http://10.0.2.2:19000',
    ];

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(xssClean());
app.use(compression());

if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI environment variable not set!');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.log('Server will continue running but API calls will fail until MongoDB is available');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/user-programs', require('./routes/userPrograms'));
app.use('/api/water', require('./routes/water'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed for this origin' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
