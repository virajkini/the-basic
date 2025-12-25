import express from 'express';
import { createUser, findUserByPhone, findUserById } from '../services/userManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyUserOwnership, verifyUserIdMatch, verifyPhoneMatch } from '../middleware/verifyOwnership.js';

const router = express.Router();

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Validate phone format (basic validation)
    if (typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    const user = await createUser(phone.trim());
    
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error && error.message === 'Phone number already exists') {
      return res.status(409).json({ 
        error: 'Phone number already exists',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/users/phone/:phone
 * Find user by phone number (only own phone)
 */
router.get('/phone/:phone', 
  authenticateToken,
  verifyUserOwnership,
  verifyPhoneMatch,
  async (req, res) => {
    try {
      const { phone } = req.params;
      
      const user = await findUserByPhone(phone);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          phone: user.phone,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Error finding user by phone:', error);
      res.status(500).json({ 
        error: 'Failed to find user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/users/:userId
 * Find user by ID (only own user)
 */
router.get('/:userId', 
  authenticateToken,
  verifyUserOwnership,
  verifyUserIdMatch,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await findUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          phone: user.phone,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      res.status(500).json({ 
        error: 'Failed to find user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;

