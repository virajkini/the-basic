import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the authenticated user is an admin
 * Admin user ID is stored in ADMIN environment variable
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminUserId = process.env.ADMIN;
  const authenticatedUserId = req.authenticatedUserId;

  if (!adminUserId) {
    console.error('ADMIN environment variable is not set');
    return res.status(500).json({ error: 'Admin configuration error' });
  }

  if (!authenticatedUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (authenticatedUserId !== adminUserId) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

