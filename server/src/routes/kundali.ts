import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getOrCreateKundaliMatch, MissingBirthDataError } from '../services/kundaliMatchManager.js';

const router = Router();

/**
 * GET /api/kundali/:targetUserId
 *
 * Returns (or creates) the Kundali Dashakoot compatibility match between the
 * authenticated user and the specified target user.
 *
 * Requirements:
 *  - Caller must be authenticated (JWT cookie — enforced globally in index.ts)
 *  - Caller must be a verified user
 */
router.get('/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const { authenticatedUserId, authenticatedUserVerified } = req as any;

    if (!authenticatedUserVerified) {
      return res.status(403).json({
        success: false,
        error: 'UNVERIFIED',
        message: 'Kundali compatibility is available for verified profiles only.',
      });
    }

    const { targetUserId } = req.params;

    if (!targetUserId || targetUserId === authenticatedUserId) {
      return res.status(400).json({ success: false, error: 'Invalid target user' });
    }

    const match = await getOrCreateKundaliMatch(authenticatedUserId, targetUserId);

    // Strip internal MongoDB _id before returning
    const { _id, ...matchData } = match as any;

    return res.json({ success: true, match: matchData });
  } catch (err) {
    if (err instanceof MissingBirthDataError) {
      return res.status(422).json({
        success: false,
        error: 'MISSING_BIRTH_DATA',
        missingFor: err.missingFor,
      });
    }

    console.error('[KUNDALI] Error fetching match:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to compute compatibility. Please try again.',
    });
  }
});

export default router;
