import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  generateMultiplePresignedUrls,
  getUserProfileImages,
  getOtherUserProfileImages,
  deleteFile,
} from '../services/fileManager.js';

const router = express.Router();

/**
 * GET /api/files/presign
 * Generate multiple presigned URLs for uploading files to user's profile folder
 * Query params: count (max 5, including existing files), types (optional, comma-separated: jpeg,png,webp)
 */
router.get('/presign',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const { count, types } = req.query;

      // Validate count parameter
      if (!count) {
        return res.status(400).json({ 
          error: 'count query parameter is required' 
        });
      }

      const countNum = parseInt(count as string, 10);
      
      if (isNaN(countNum) || countNum < 1) {
        return res.status(400).json({ 
          error: 'count must be a positive number' 
        });
      }

      if (countNum > 5) {
        return res.status(400).json({ 
          error: 'count cannot exceed 5' 
        });
      }

      // Parse file types if provided
      let fileTypes: string[] | undefined;
      if (types) {
        fileTypes = (types as string).split(',').map(t => t.trim());
        
        // Validate file types (GIF not allowed)
        const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
        const invalidTypes = fileTypes.filter(t => !allowedTypes.includes(t.toLowerCase()));
        
        if (invalidTypes.length > 0) {
          return res.status(400).json({ 
            error: `Invalid file types: ${invalidTypes.join(', ')}. Allowed types: jpeg, jpg, png, webp` 
          });
        }

        // If types provided but count doesn't match, use first type for all
        if (fileTypes.length !== countNum) {
          const firstType = fileTypes[0] || 'jpeg';
          fileTypes = Array(countNum).fill(firstType);
        }
      }

      const results = await generateMultiplePresignedUrls(userId, countNum, fileTypes);

      res.json({
        success: true,
        urls: results, // Array of { url, key } objects
        count: results.length,
      });
    } catch (error) {
      console.error('Error generating presigned URLs:', error);
      
      if (error instanceof Error && error.message.includes('Maximum 5 photos')) {
        return res.status(400).json({ 
          error: 'Maximum 5 photos allowed',
          message: error.message
        });
      }

      if (error instanceof Error && error.message.includes('Invalid file type')) {
        return res.status(400).json({ 
          error: 'Invalid file type',
          message: error.message
        });
      }

      res.status(500).json({ 
        error: 'Failed to generate presigned URLs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/files
 * Get all profile image URLs for the authenticated user
 * Returns CloudFront URLs in an array
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const files = await getUserProfileImages(userId);

      res.json({
        success: true,
        images: files.map(file => file.url), // Return just URLs in array
        files: files, // Also return full file objects if needed
      });
    } catch (error) {
      console.error('Error getting user profile images:', error);
      res.status(500).json({ 
        error: 'Failed to get profile images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/files/:userId
 * Get profile images for another user
 * Returns signed original URLs if viewer is verified, blurred public URLs otherwise
 * If viewing own profile, always returns signed original URLs
 */
router.get('/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const viewerUserId = req.authenticatedUserId;
      const viewerIsVerified = req.authenticatedUserVerified ?? false;
      const targetUserId = req.params.userId;

      if (!viewerUserId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      let images: string[];
      let isBlurred = false;

      // Check if viewing own profile
      if (viewerUserId === targetUserId) {
        // Own profile - always return original with signed URLs
        const files = await getUserProfileImages(targetUserId);
        images = files.map(file => file.url);
      } else {
        // Other user's profile - check if viewer is verified
        const files = await getOtherUserProfileImages(targetUserId, viewerIsVerified);
        images = files.map(file => file.url);
        isBlurred = !viewerIsVerified;
      }

      res.json({
        success: true,
        images,
        isBlurred,
      });
    } catch (error) {
      console.error('Error getting profile images:', error);
      res.status(500).json({
        error: 'Failed to get profile images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/files/:key
 * Delete a single image from S3
 * Key should be URL encoded
 */
router.delete('/:key',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const key = decodeURIComponent(req.params.key);

      await deleteFile(key, userId);

      res.json({
        success: true,
        message: 'File deleted successfully',
        key: key,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      
      if (error instanceof Error && error.message.includes('Access denied')) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: error.message
        });
      }

      res.status(500).json({ 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;

