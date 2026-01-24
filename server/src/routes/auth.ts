import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByPhone, createUser } from '../services/userManager.js';
import { readProfile } from '../services/profileManager.js';

const router = express.Router();

// MSG91 configuration
const MSG91_AUTH_KEY = process.env.MSG_TOKEN || '';
const MSG91_VERIFY_URL = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '3d'; // 3 days - will be extended on activity
const TOKEN_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const REFRESH_THRESHOLD = 12 * 60 * 60; // Refresh if less than 12 hours left (in seconds)

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

// Helper function for token verification
const verifyAccessToken = (token: string): TokenPayload & { exp: number; type: string } => {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { exp: number; type: string };
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

// POST /auth/msg91/verify - Verify MSG91 access token
router.post('/msg91/verify', async (req: Request, res: Response) => {
  try {
    const { accessToken, phone } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!MSG91_AUTH_KEY) {
      console.error('MSG_TOKEN environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Log curl equivalent for debugging
    const requestBody = {
      authkey: MSG91_AUTH_KEY,
      'access-token': accessToken,
    };
    console.log(`curl -X POST '${MSG91_VERIFY_URL}' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '${JSON.stringify(requestBody)}'`);

    // Verify token with MSG91 API
    const verifyResponse = await fetch(MSG91_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        authkey: MSG91_AUTH_KEY,
        'access-token': accessToken,
      }),
    });

    const verifyData = await verifyResponse.json() as { type?: string; message?: string };

    // Check if verification was successful
    if (!verifyResponse.ok || verifyData.type === 'error') {
      console.error('MSG91 verification failed:', verifyData);
      return res.status(401).json({
        error: 'Token verification failed',
        details: verifyData.message || 'Invalid or expired token'
      });
    }

    // Normalize phone number (remove spaces, ensure format)
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');

    // Check if user exists, if not create new user


    let user = await findUserByPhone(normalizedPhone);
   
    if (!user) {
      user = await createUser(normalizedPhone);
    }

    // Fetch profile to get verified, subscribed, and gender status
    const profile = await readProfile(user._id);
    const verified = profile?.verified ?? false;
    const subscribed = profile?.subscribed ?? false;
    const gender = profile?.gender ?? null;

    // Generate our access token
    const ourAccessToken = generateAccessToken({
      phone: normalizedPhone,
      userId: user._id,
      verified,
      subscribed,
      gender,
    });

    // Set cookie
    res.cookie('accessToken', ourAccessToken, getAccessTokenCookieOptions());

    res.json({ authenticated: true });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify token',
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
    res.status(500).json({
      error: 'Failed to logout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
