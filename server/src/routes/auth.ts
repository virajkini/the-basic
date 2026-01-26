import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { findUserByPhone, createUser } from '../services/userManager.js';
import { readProfile } from '../services/profileManager.js';

const router = express.Router();

// In-memory storage for OTPs only
// In production, use a database (Redis, PostgreSQL, etc.)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '3d'; // 3 days - will be extended on activity
const TOKEN_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const REFRESH_THRESHOLD = 12 * 60 * 60; // Refresh if less than 12 hours left (in seconds)
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Token payload type
export interface TokenPayload {
  phone: string;
  userId: string;
  verified: boolean;
  subscribed: boolean;
  gender: 'M' | 'F' | null;
}

// Generate access token
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// Get cookie options for access token
export const getAccessTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const options: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRY_MS,
  };
  if (isProduction) {
    options.domain = '.amgeljodi.com';
  }
  return options;
};

// Rate limiter for OTP send endpoint - uses IP + phone as key
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP+phone combo to 5 requests per windowMs
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const phone = req.body?.phone?.replace(/\s+/g, '') || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${phone}`;
  },
});

// Simple phone validation
const isValidPhone = (phone: string): boolean => {
  // Remove spaces, dashes, and country code prefix
  const normalized = phone.replace(/[\s\-]/g, '').replace(/^\+/, '');
  // Check if it has at least 10 digits
  const digitsOnly = normalized.replace(/\D/g, '');
  return digitsOnly.length >= 10;
};

// Generate OTP - returns last 4 digits of phone number
const generateOTP = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.slice(-4);
};

// Helper function for token verification
const verifyAccessToken = (token: string): TokenPayload & { exp: number; type: string } => {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { exp: number; type: string };
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

// POST /auth/otp/send
router.post('/otp/send', otpRateLimiter, (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone number (remove spaces, handle +91 format)
    const normalizedPhone = phone.replace(/\s+/g, '');

    // Validate phone number format
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Generate OTP (last 4 digits of phone number)
    const otp = generateOTP(normalizedPhone);
    const expiresAt = Date.now() + OTP_EXPIRY;

    // Store OTP
    otpStore.set(normalizedPhone, { otp, expiresAt });

    // In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${normalizedPhone}: ${otp}`);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s+/g, '');

    // Get stored OTP
    const storedOtp = otpStore.get(normalizedPhone);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    // Check if OTP expired
    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified, remove it from store
    otpStore.delete(normalizedPhone);

    // Check if user exists, if not create new user
    let user = await findUserByPhone(normalizedPhone);
    if (!user) {
      // Create new user
      user = await createUser(normalizedPhone);
    }

    // Fetch profile to get verified, subscribed, and gender status
    const profile = await readProfile(user._id);
    const verified = profile?.verified ?? false;
    const subscribed = profile?.subscribed ?? false;
    const gender = profile?.gender ?? null;

    // Generate access token (7 days, will be extended on activity)
    const accessToken = generateAccessToken({
      phone: normalizedPhone,
      userId: user._id,
      verified,
      subscribed,
      gender,
    });

    // Set cookie
    res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());

    res.json({ authenticated: true });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: 'Failed to verify OTP',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /auth/me - Check authentication status (with sliding expiration)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies?.accessToken;

    // No token → logged out
    if (!accessToken) {
      return res.status(401).json({ loggedIn: false });
    }

    try {
      const payload = verifyAccessToken(accessToken);
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - now;

      // Sliding expiration: if less than 1 day left, issue new token
      if (timeLeft < REFRESH_THRESHOLD) {
        // Fetch fresh profile data
        const profile = await readProfile(payload.userId);
        const verified = profile?.verified ?? payload.verified;
        const subscribed = profile?.subscribed ?? payload.subscribed;
        const gender = profile?.gender ?? payload.gender;

        const newToken = generateAccessToken({
          phone: payload.phone,
          userId: payload.userId,
          verified,
          subscribed,
          gender,
        });

        res.cookie('accessToken', newToken, getAccessTokenCookieOptions());

        return res.json({
          loggedIn: true,
          user: { phone: payload.phone, userId: payload.userId, verified, subscribed }
        });
      }

      return res.json({
        loggedIn: true,
        user: { phone: payload.phone, userId: payload.userId, verified: payload.verified ?? false, subscribed: payload.subscribed ?? false }
      });
    } catch (err) {
      // Token expired or invalid
      res.clearCookie('accessToken', getAccessTokenCookieOptions());
      return res.status(401).json({ loggedIn: false });
    }
  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  try {
    // Clear cookie
    res.clearCookie('accessToken', getAccessTokenCookieOptions());

    res.json({ loggedOut: true });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      error: 'Failed to logout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
