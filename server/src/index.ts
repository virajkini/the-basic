import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import otpRoutes from './routes/otp.js';
import contactRoutes from './routes/contact.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import fileRoutes from './routes/files.js';
import connectionRoutes from './routes/connections.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug middleware to check CLIENT_URL environment variable and log CORS requests
app.use((req, res, next) => {
  res.setHeader('X-Debug-Origin', process.env.CLIENT_URL || 'NOT_SET');
  res.setHeader('X-Debug-Allowed-Origins', normalizedOrigins.join(', '));
  
  // Log CORS-related requests for debugging
  if (req.method === 'OPTIONS' || req.headers.origin) {
    console.log(`[CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  }
  
  next();
});

// CORS configuration - must specify exact origin when using credentials
const allowedOrigins: string[] = [
  'https://www.amgeljodi.com',
  'https://amgeljodi.com',
  'https://app.amgeljodi.com', // Protected app domain
  process.env.CLIENT_URL,
  'http://localhost:3000', // For local development (home app)
  'http://localhost:3002' // For local development (protected app)
].filter((origin): origin is string => Boolean(origin)); // Remove any undefined/null values

// Normalize origins (remove trailing slashes)
const normalizedOrigins = allowedOrigins.map(origin => origin.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Normalize the incoming origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Check if the origin is in the allowed list
    if (normalizedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      console.warn(`Allowed origins: ${normalizedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Type', 'Content-Length'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});


// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// OTP routes (no authentication required)
app.use('/api/otp', otpRoutes);

// Contact routes (no authentication required)
app.use('/api/contact', contactRoutes);

// User routes
app.use('/api/users', userRoutes);

// Profile routes
app.use('/api/profiles', profileRoutes);

// File routes
app.use('/api/files', fileRoutes);

// Connection routes
app.use('/api/connections', connectionRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Admin routes (protected by authenticateToken and requireAdmin middleware)
app.use('/api/admin', adminRoutes);

// Apply authentication middleware to all other API routes (excluding /api/auth, /api/otp, /api/contact and /health)
app.use((req, res, next) => {
  // Skip authentication for auth, otp, contact routes and health check
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/otp') || req.path.startsWith('/api/contact') || req.path === '/health') {
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

