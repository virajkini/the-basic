/**
 * OTP Rate Limiting Middleware
 * Prevents abuse by limiting OTP requests based on IP + phone combination
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// In-memory store for rate limiting
// For production with multiple servers, consider using Redis
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60 * 60 * 1000); // 1 hour

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
  // Check various headers for real IP (useful behind proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Custom rate limit handler for OTP
 * Uses IP + phone number as the key
 */
export const otpRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const phone = req.body.phone;

  if (!phone) {
    return res.status(400).json({
      error: 'Phone number is required'
    });
  }

  const ip = getClientIp(req);
  const key = `${ip}:${phone}`;
  const now = Date.now();

  // Rate limit configuration
  const MAX_ATTEMPTS = 5; // Maximum attempts
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

  // Initialize or get existing entry
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
  }

  const entry = store[key];

  // Reset if window has passed
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + WINDOW_MS;
  }

  // Check if limit exceeded
  if (entry.count >= MAX_ATTEMPTS) {
    const timeLeft = Math.ceil((entry.resetTime - now) / 1000 / 60);
    return res.status(429).json({
      error: 'Too many OTP requests',
      message: `Please wait ${timeLeft} minutes before trying again`,
      retryAfter: timeLeft * 60, // in seconds
    });
  }

  // Increment counter
  entry.count++;

  // Add headers for rate limit info
  res.setHeader('X-RateLimit-Limit', MAX_ATTEMPTS.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_ATTEMPTS - entry.count).toString());
  res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

  next();
};

/**
 * General rate limiter for verify endpoint
 * Prevents brute force OTP guessing
 */
export const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many verification attempts',
    message: 'Please wait before trying again',
  },
  // Use IP + phone for the key
  keyGenerator: (req: Request) => {
    const phone = req.body.phone || '';
    const ip = getClientIp(req);
    return `${ip}:${phone}`;
  },
});
