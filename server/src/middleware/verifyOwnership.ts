import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to verify that the authenticated user owns the requested resource
 * userId is already attached to request from auth middleware (from JWT token)
 * This middleware just ensures userId exists in the request
 */
export const verifyUserOwnership = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated and userId is present
  if (!req.user || !req.user.userId || !req.authenticatedUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // userId is already attached from auth middleware, no DB lookup needed
  next();
};

/**
 * Middleware to verify the requested userId matches the authenticated user's ID
 * No DB lookup needed - userId comes from JWT token
 */
export const verifyUserIdMatch = (req: Request, res: Response, next: NextFunction) => {
  const requestedUserId = req.params.userId || req.body.userId;
  const authenticatedUserId = req.authenticatedUserId;

  if (!authenticatedUserId) {
    return res.status(401).json({ error: 'User authentication required' });
  }

  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    return res.status(403).json({ error: 'Access denied: You can only access your own data' });
  }

  next();
};

/**
 * Middleware to verify the requested phone matches the authenticated user's phone
 * No DB lookup needed - phone comes from JWT token
 */
export const verifyPhoneMatch = (req: Request, res: Response, next: NextFunction) => {
  const requestedPhone = req.params.phone;
  const authenticatedUserPhone = req.authenticatedUserPhone;

  if (!authenticatedUserPhone) {
    return res.status(401).json({ error: 'User authentication required' });
  }

  if (requestedPhone && requestedPhone !== authenticatedUserPhone) {
    return res.status(403).json({ error: 'Access denied: You can only access your own data' });
  }

  next();
};

