import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { findUserByPhone, createUser } from '../services/userManager.js';
import { readProfile } from '../services/profileManager.js';

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
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Generate refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

// Get cookie options for access token
export const getAccessTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const options: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  };
  if (isProduction) {
    options.domain = '.amgeljodi.com';
  }
  return options;
};

// Rate limiter for OTP send endpoint
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 3 requests per windowMs
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
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

// Helper functions for token verification
const verifyAccessToken = (token: string): { phone: string; userId: string; type: string } => {
  const decoded = jwt.verify(token, JWT_SECRET) as { phone: string; userId: string; type: string };
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

const verifyRefreshToken = (token: string): { phone: string; userId: string; type: string } => {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { phone: string; userId: string; type: string };
  if (decoded.type !== 'refresh') {
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

    // Generate tokens with userId, verified, subscribed, and gender included
    const accessToken = jwt.sign(
      { phone: normalizedPhone, userId: user._id, verified, subscribed, gender, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { phone: normalizedPhone, userId: user._id, verified, subscribed, gender, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );


    // Store refresh token
    const refreshTokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    refreshTokenStore.set(refreshToken, { phone: normalizedPhone, expiresAt: refreshTokenExpiry });

    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
    
    // Only set domain in production (for localhost, omit domain)
    if (isProduction) {
      cookieOptions.domain = '.amgeljodi.com'; // Allow cookies to work across subdomains
    }
    
    res.cookie('accessToken', accessToken, cookieOptions);

    const refreshCookieOptions: any = {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'lax', // Allows cookies when navigating from external sites (Gmail, WhatsApp, etc.)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    // Only set domain in production (for localhost, omit domain)
    if (isProduction) {
      refreshCookieOptions.domain = '.amgeljodi.com'; // Allow cookies to work across subdomains
    }

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);


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
router.post('/refresh', async (req: Request, res: Response) => {
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

    // Fetch profile to get current verified, subscribed, and gender status
    const profile = await readProfile(decoded.userId);
    const verified = profile?.verified ?? false;
    const subscribed = profile?.subscribed ?? false;
    const gender = profile?.gender ?? null;

    // Generate new access token (include userId, verified, subscribed, gender from decoded token)
    const newAccessToken = jwt.sign(
      { phone: decoded.phone, userId: decoded.userId, verified, subscribed, gender, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate new refresh token (rotate, include userId, verified, subscribed, gender)
    const newRefreshToken = jwt.sign(
      { phone: decoded.phone, userId: decoded.userId, verified, subscribed, gender, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Remove old refresh token and store new one
    refreshTokenStore.delete(refreshToken);
    const refreshTokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
    refreshTokenStore.set(newRefreshToken, { phone: decoded.phone, expiresAt: refreshTokenExpiry });

    // Set new cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
    
    // Only set domain in production (for localhost, omit domain)
    if (isProduction) {
      cookieOptions.domain = '.amgeljodi.com'; // Allow cookies to work across subdomains
    }

    res.cookie('accessToken', newAccessToken, cookieOptions);

    const refreshCookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // Allows cookies when navigating from external sites (Gmail, WhatsApp, etc.)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    // Only set domain in production (for localhost, omit domain)
    if (isProduction) {
      refreshCookieOptions.domain = '.amgeljodi.com'; // Allow cookies to work across subdomains
    }

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    res.json({ refreshed: true });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /auth/me - Check authentication status and refresh if needed
router.get('/me', async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // 1️⃣ No tokens → logged out
    if (!accessToken && !refreshToken) {
      return res.status(401).json({ loggedIn: false });
    }

    // 2️⃣ Try access token
    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken) as { phone: string; userId: string; verified?: boolean; subscribed?: boolean; type: string };
        return res.json({
          loggedIn: true,
          user: { phone: payload.phone, userId: payload.userId, verified: payload.verified ?? false, subscribed: payload.subscribed ?? false }
        });
      } catch (err) {
        // Token expired or invalid, fallthrough to refresh
      }
    }

    // 3️⃣ Try refresh token
    if (!refreshToken) {
      return res.status(401).json({ loggedIn: false });
    }

    try {
      // Check if refresh token exists in store
      const storedToken = refreshTokenStore.get(refreshToken);
      if (!storedToken) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(401).json({ loggedIn: false });
      }

      // Check if refresh token expired in store
      if (Date.now() > storedToken.expiresAt) {
        refreshTokenStore.delete(refreshToken);
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(401).json({ loggedIn: false });
      }

      // Verify JWT
      const payload = verifyRefreshToken(refreshToken);

      // Fetch profile to get current verified, subscribed, and gender status
      const meProfile = await readProfile(payload.userId);
      const meVerified = meProfile?.verified ?? false;
      const meSubscribed = meProfile?.subscribed ?? false;
      const meGender = meProfile?.gender ?? null;

      // Generate new access token
      const newAccessToken = jwt.sign(
        { phone: payload.phone, userId: payload.userId, verified: meVerified, subscribed: meSubscribed, gender: meGender, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      // Set new access token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions: any = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      };
      
      // Only set domain in production (for localhost, omit domain)
      if (isProduction) {
        cookieOptions.domain = '.amgeljodi.com'; // Allow cookies to work across subdomains
      }
      
      res.cookie('accessToken', newAccessToken, cookieOptions);

      return res.json({
        loggedIn: true,
        user: { phone: payload.phone, userId: payload.userId, verified: meVerified, subscribed: meSubscribed }
      });
    } catch (err) {
      // Refresh token invalid
      if (refreshToken) {
        refreshTokenStore.delete(refreshToken);
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
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
