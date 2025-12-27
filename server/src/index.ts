import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import fileRoutes from './routes/files.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug middleware to check CLIENT_URL environment variable
app.use((req, res, next) => {
  res.setHeader('X-Debug-Origin', process.env.CLIENT_URL || 'NOT_SET');
  next();
});

// CORS configuration - must specify exact origin when using credentials
const allowedOrigins = [
  'https://www.amgeljodi.com',
  'https://amgeljodi.com',
  process.env.CLIENT_URL,
  'http://localhost:3000', // For local development (home app)
  'http://localhost:3002' // For local development (protected app)
].filter(Boolean); // Remove any undefined/null values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});


// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Profile routes
app.use('/api/profiles', profileRoutes);

// File routes
app.use('/api/files', fileRoutes);

// Apply authentication middleware to all other API routes (excluding /api/auth and /health)
app.use((req, res, next) => {
  // Skip authentication for auth routes and health check
  if (req.path.startsWith('/api/auth') || req.path === '/health') {
    return next();
  }
  // Apply authentication for all other /api routes
  if (req.path.startsWith('/api')) {
    return authenticateToken(req, res, next);
  }
  next();
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Enable HTTP keep-alive for better connection reuse
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)

