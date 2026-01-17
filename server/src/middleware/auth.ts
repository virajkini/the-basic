import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '3d';
const TOKEN_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;
const REFRESH_THRESHOLD = 12 * 60 * 60; // Refresh if less than 12 hours left (in seconds)

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        phone: string;
        userId: string;
        verified: boolean;
        subscribed: boolean;
        gender: 'M' | 'F' | null;
        type: string;
        exp: number;
      };
      authenticatedUserId?: string;
      authenticatedUserPhone?: string;
      authenticatedUserVerified?: boolean;
      authenticatedUserSubscribed?: boolean;
      authenticatedUserGender?: 'M' | 'F' | null;
    }
  }
}

// Get cookie options for access token
const getAccessTokenCookieOptions = () => {
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

// Authentication middleware with sliding expiration
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get access token from cookies
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token not found' });
    }

    // Verify the token
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      phone: string;
      userId: string;
      verified?: boolean;
      subscribed?: boolean;
      gender?: 'M' | 'F' | null;
      type: string;
      exp: number;
    };

    // Check if it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Sliding expiration: if less than 1 day left, issue new token
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - now;

    if (timeLeft < REFRESH_THRESHOLD) {
      const newToken = jwt.sign(
        {
          phone: decoded.phone,
          userId: decoded.userId,
          verified: decoded.verified ?? false,
          subscribed: decoded.subscribed ?? false,
          gender: decoded.gender ?? null,
          type: 'access',
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.cookie('accessToken', newToken, getAccessTokenCookieOptions());
    }

    // Attach user info to request (userId comes from token, no DB lookup needed)
    req.user = {
      phone: decoded.phone,
      userId: decoded.userId,
      verified: decoded.verified ?? false,
      subscribed: decoded.subscribed ?? false,
      gender: decoded.gender ?? null,
      type: decoded.type,
      exp: decoded.exp,
    };

    // Attach userId, phone, verified, subscribed, gender directly to request for easy access
    req.authenticatedUserId = decoded.userId;
    req.authenticatedUserPhone = decoded.phone;
    req.authenticatedUserVerified = decoded.verified ?? false;
    req.authenticatedUserSubscribed = decoded.subscribed ?? false;
    req.authenticatedUserGender = decoded.gender ?? null;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
};
