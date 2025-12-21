import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const router = express.Router();

// In-memory storage for OTPs and refresh tokens
// In production, use a database (Redis, PostgreSQL, etc.)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const refreshTokenStore = new Map<string, { phone: string; expiresAt: number }>();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Rate limiter for OTP send endpoint
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple phone validation
const isValidPhone = (phone: string): boolean => {
  // Normalize phone number for comparison
  const normalized = phone.replace(/\s+/g, '');
  // For now, just check if it's the test phone number (with or without +91)
  return normalized === '+918892043505' || normalized === '8892043505' || normalized === '918892043505';
};

// Generate OTP
const generateOTP = (): string => {
  // For test phone, always return 1111
  return '1111';
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

    // Simple validation - for now only allow test number
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Generate OTP
    const otp = generateOTP();
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
router.post('/otp/verify', (req: Request, res: Response) => {
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

    // Generate tokens
    const accessToken = jwt.sign(
      { phone: normalizedPhone, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { phone: normalizedPhone, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Store refresh token
    const refreshTokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    refreshTokenStore.set(refreshToken, { phone: normalizedPhone, expiresAt: refreshTokenExpiry });

    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // Readable by JavaScript
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ authenticated: true });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    // Check if refresh token exists in store
    const storedToken = refreshTokenStore.get(refreshToken);
    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token expired
    if (Date.now() > storedToken.expiresAt) {
      refreshTokenStore.delete(refreshToken);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      refreshTokenStore.delete(refreshToken);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { phone: decoded.phone, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate new refresh token (rotate)
    const newRefreshToken = jwt.sign(
      { phone: decoded.phone, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Remove old refresh token and store new one
    refreshTokenStore.delete(refreshToken);
    const refreshTokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
    refreshTokenStore.set(newRefreshToken, { phone: decoded.phone, expiresAt: refreshTokenExpiry });

    // Set new cookies
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ refreshed: true });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /auth/logout
router.post('/logout', (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Revoke refresh token from store
    if (refreshToken) {
      refreshTokenStore.delete(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('csrfToken');

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
