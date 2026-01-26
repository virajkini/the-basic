import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { getAllProfiles, updateProfile, deleteProfile } from '../services/profileManager.js';
import { findUserById } from '../services/userManager.js';
import { deleteAllUserConnections } from '../services/connectionManager.js';
import { deleteAllUserNotifications } from '../services/notificationManager.js';
import { deleteAllUserFiles } from '../services/fileManager.js';

/**
 * Middleware to restrict endpoint to localhost only
 */
function requireLocalhost(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

  if (!isLocalhost) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This endpoint is only available from localhost'
    });
  }

  next();
}

const router = express.Router();

/**
 * GET /api/admin/profiles
 * Get all profiles with user information (admin only)
 * Returns: user id, phone number, name, isVerified, isSubscribed
 */
router.get('/profiles',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const profiles = await getAllProfiles();

      // Fetch user phone numbers for each profile
      const profilesWithUsers = await Promise.all(
        profiles.map(async (profile) => {
          const user = await findUserById(profile._id);
          const name = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'N/A';
          
          return {
            userId: profile._id,
            phone: user?.phone || 'N/A',
            name: name,
            isVerified: profile.verified ?? false,
            isSubscribed: profile.subscribed ?? false,
            createdAt: profile.createdAt,
          };
        })
      );

      res.json({
        success: true,
        profiles: profilesWithUsers,
        count: profilesWithUsers.length,
      });
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      res.status(500).json({
        error: 'Failed to fetch profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PATCH /api/admin/profiles/:userId/verified
 * Update the verified status of a user profile (admin only)
 * Body: { verified: boolean }
 */
router.patch('/profiles/:userId/verified',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;

      // Validate input
      if (typeof verified !== 'boolean') {
        return res.status(400).json({
          error: 'verified field is required and must be a boolean'
        });
      }

      // Update the profile
      const updatedProfile = await updateProfile(userId, { verified });

      if (!updatedProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({
        success: true,
        profile: {
          userId: updatedProfile._id,
          verified: updatedProfile.verified,
        },
      });
    } catch (error) {
      console.error('Error updating verified status:', error);
      res.status(500).json({
        error: 'Failed to update verified status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:userId
 * Delete a user's account (admin only, localhost only)
 * Removes profile, connections, notifications, and S3 files
 * Keeps users and connection_quota records for audit purposes
 *
 * SECURITY: This endpoint is restricted to:
 * 1. Localhost access only (requireLocalhost)
 * 2. Valid JWT token (authenticateToken)
 * 3. Admin user (requireAdmin)
 * 4. Confirmation string in request body
 */
router.delete('/users/:userId',
  requireLocalhost,
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { confirmation } = req.body;

      // Require explicit confirmation
      if (confirmation !== 'DELETE') {
        return res.status(400).json({
          error: 'Confirmation required',
          message: 'Please send confirmation: "DELETE" to proceed with account deletion'
        });
      }

      // Verify the user exists
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`[ADMIN ACCOUNT DELETION] Starting deletion for user: ${userId} by admin: ${req.user?.userId}`);

      // Delete all related data in parallel
      const [
        connectionsDeleted,
        profileDeleted,
        notificationsDeleted,
        filesDeleted
      ] = await Promise.all([
        deleteAllUserConnections(userId),
        deleteProfile(userId),
        deleteAllUserNotifications(userId),
        deleteAllUserFiles(userId)
      ]);

      console.log(`[ADMIN ACCOUNT DELETION] Completed for user: ${userId}`, {
        connectionsDeleted,
        profileDeleted,
        notificationsDeleted,
        filesDeleted
      });

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        details: {
          userId,
          connectionsDeleted,
          profileDeleted,
          notificationsDeleted,
          filesDeleted
        }
      });
    } catch (error) {
      console.error('Error deleting account (admin):', error);
      res.status(500).json({
        error: 'Failed to delete account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;

