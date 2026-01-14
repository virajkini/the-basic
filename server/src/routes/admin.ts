import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { getAllProfiles, updateProfile } from '../services/profileManager.js';
import { findUserById } from '../services/userManager.js';

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

export default router;

