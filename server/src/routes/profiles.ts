import express from 'express';
import { readProfile, createProfile, updateProfile } from '../services/profileManager.js';
import { Profile } from '../models/profile.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyUserOwnership, verifyUserIdMatch } from '../middleware/verifyOwnership.js';

const router = express.Router();

/**
 * GET /api/profiles/:userId
 * Read a profile by user ID (only own profile)
 */
router.get('/:userId', 
  authenticateToken,
  verifyUserOwnership,
  verifyUserIdMatch,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const profile = await readProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.status(200).json({
        success: true,
        profile: {
          _id: profile._id,
          name: profile.name,
          gender: profile.gender,
          dob: profile.dob,
          age: profile.age,
          verified: profile.verified,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        }
      });
    } catch (error) {
      console.error('Error reading profile:', error);
      res.status(500).json({ 
        error: 'Failed to read profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/profiles
 * Create a new profile (only own profile)
 */
router.post('/', 
  authenticateToken,
  verifyUserOwnership,
  async (req, res) => {
    try {
      const { userId, name, gender, dob, age, verified } = req.body;
      const authenticatedUserId = req.authenticatedUserId;
      
      // Validation
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Verify the userId in request matches authenticated user
      if (userId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied: You can only create your own profile' });
      }
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!gender || !['M', 'F'].includes(gender)) {
        return res.status(400).json({ error: 'Gender must be M or F' });
      }
      if (!dob || typeof dob !== 'string') {
        return res.status(400).json({ error: 'Date of birth (dob) is required' });
      }
      if (age === undefined || typeof age !== 'number' || age < 0) {
        return res.status(400).json({ error: 'Valid age is required' });
      }
      
      const profileData: Omit<Profile, '_id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        gender: gender as 'M' | 'F',
        dob: dob.trim(),
        age: age,
        verified: verified === true
      };
      
      const profile = await createProfile(userId, profileData);
      
      res.status(201).json({
        success: true,
        profile: {
          _id: profile._id,
          name: profile.name,
          gender: profile.gender,
          dob: profile.dob,
          age: profile.age,
          verified: profile.verified,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        }
      });
  } catch (error: any) {
    console.error('Error creating profile:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Profile already exists for this user'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/profiles/:userId
 * Update an existing profile (only own profile)
 */
router.put('/:userId', 
  authenticateToken,
  verifyUserOwnership,
  verifyUserIdMatch,
  async (req, res) => {
    try {
      const { userId } = req.params;
    const { name, gender, dob, age, verified } = req.body;
    
    // Build update object with only provided fields
    const updateData: Partial<Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>> = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid name' });
      }
      updateData.name = name.trim();
    }
    
    if (gender !== undefined) {
      if (!['M', 'F'].includes(gender)) {
        return res.status(400).json({ error: 'Gender must be M or F' });
      }
      updateData.gender = gender as 'M' | 'F';
    }
    
    if (dob !== undefined) {
      if (typeof dob !== 'string' || dob.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid date of birth' });
      }
      updateData.dob = dob.trim();
    }
    
    if (age !== undefined) {
      if (typeof age !== 'number' || age < 0) {
        return res.status(400).json({ error: 'Invalid age' });
      }
      updateData.age = age;
    }
    
    if (verified !== undefined) {
      if (typeof verified !== 'boolean') {
        return res.status(400).json({ error: 'Verified must be a boolean' });
      }
      updateData.verified = verified;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const updatedProfile = await updateProfile(userId, updateData);
    
    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.status(200).json({
      success: true,
      profile: {
        _id: updatedProfile._id,
        name: updatedProfile.name,
        gender: updatedProfile.gender,
        dob: updatedProfile.dob,
        age: updatedProfile.age,
        verified: updatedProfile.verified,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  }
);

export default router;

