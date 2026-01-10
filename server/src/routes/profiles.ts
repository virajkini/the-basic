import express from 'express';
import { readProfile, createProfile, updateProfile, listProfiles, maskString } from '../services/profileManager.js';
import { Profile, CreatingFor, Gender, SalaryRange, calculateAge } from '../models/profile.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyUserOwnership, verifyUserIdMatch } from '../middleware/verifyOwnership.js';
import { getOtherUserProfileImages } from '../services/fileManager.js';
import { generateAccessToken, getAccessTokenCookieOptions } from './auth.js';

const router = express.Router();

// Valid values for enums
const validCreatingFor: CreatingFor[] = ['self', 'daughter', 'son', 'other'];
const validGenders: Gender[] = ['M', 'F'];
const validSalaryRanges: SalaryRange[] = ['<5L', '5-15L', '15-30L', '30-50L', '>50L'];

/**
 * GET /api/profiles/discover
 * Get profiles for discovery with images in a single call
 * Returns masked data + blurred images for unverified users
 * Returns full data + original images for verified users
 * Query params: limit (default 20), skip (default 0)
 */
router.get('/discover',
  authenticateToken,
  async (req, res) => {
    try {
      const currentUserId = req.authenticatedUserId;
      const isVerified = req.authenticatedUserVerified ?? false;
      //const isVerified = true; // TEMP: Allow all as verified for testing
      const currentGender = req.authenticatedUserGender;

      if (!currentUserId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const skip = parseInt(req.query.skip as string) || 0;

      // Get profiles (gender from JWT, no DB call needed)
      const profiles = await listProfiles(currentUserId, currentGender ?? undefined, limit, skip);

      // Fetch images for all profiles in parallel
      const profilesWithImages = (await Promise.all(
        profiles.map(async (profile) => {
          // Get images (blurred for unverified, original for verified)
          const files = await getOtherUserProfileImages(profile._id, isVerified);
          const images = files.map(f => f.url);

          // Skip profiles with no images
          if (images.length === 0) {
            return null;
          }

          const age = profile.dob ? calculateAge(profile.dob) : profile.age;

          if (isVerified) {
            // Full data for verified users
            return {
              _id: profile._id,
              firstName: profile.firstName,
              age,
              nativePlace: profile.nativePlace,
              height: profile.height,
              designation: profile.workingStatus ? profile.designation : null,
              verified: profile.verified,
              images,
            };
          } else {
            // Masked data for unverified users
            return {
              _id: profile._id,
              firstName: maskString(profile.firstName),
              age,
              nativePlace: maskString(profile.nativePlace),
              height: profile.height,
              designation: profile.workingStatus ? maskString(profile.designation) : null,
              verified: profile.verified,
              images, // Already blurred from getOtherUserProfileImages
            };
          }
        })
      )).filter(profile => profile !== null);

      res.status(200).json({
        success: true,
        profiles: profilesWithImages,
        count: profilesWithImages.length,
        isVerified,
        skip,
        limit
      });
    } catch (error) {
      console.error('Error discovering profiles:', error);
      res.status(500).json({
        error: 'Failed to discover profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

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

      // Check if verified or subscribed changed from token values
      const tokenVerified = req.authenticatedUserVerified ?? false;
      const tokenSubscribed = req.authenticatedUserSubscribed ?? false;
      const dbVerified = profile.verified ?? false;
      const dbSubscribed = profile.subscribed ?? false;

      if (tokenVerified !== dbVerified || tokenSubscribed !== dbSubscribed) {
        // Generate new access token with updated values
        const newAccessToken = generateAccessToken({
          phone: req.authenticatedUserPhone!,
          userId: req.authenticatedUserId!,
          verified: dbVerified,
          subscribed: dbSubscribed,
          gender: profile.gender ?? null,
        });

        res.cookie('accessToken', newAccessToken, getAccessTokenCookieOptions());
      }

      // Calculate age from DOB for response
      const age = profile.dob ? calculateAge(profile.dob) : profile.age;

      res.status(200).json({
        success: true,
        profile: {
          _id: profile._id,
          creatingFor: profile.creatingFor,
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: profile.name || `${profile.firstName} ${profile.lastName}`,
          gender: profile.gender,
          dob: profile.dob,
          age: age,
          nativePlace: profile.nativePlace,
          height: profile.height,
          workingStatus: profile.workingStatus,
          company: profile.company,
          designation: profile.designation,
          workLocation: profile.workLocation,
          salaryRange: profile.salaryRange,
          aboutMe: profile.aboutMe,
          verified: profile.verified,
          subscribed: profile.subscribed,
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
      const {
        userId,
        creatingFor,
        firstName,
        lastName,
        dob,
        gender,
        nativePlace,
        height,
        workingStatus,
        company,
        designation,
        workLocation,
        salaryRange,
        aboutMe
      } = req.body;

      const authenticatedUserId = req.authenticatedUserId;

      // Validation
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Verify the userId in request matches authenticated user
      if (userId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied: You can only create your own profile' });
      }

      // Validate creatingFor
      if (!creatingFor || !validCreatingFor.includes(creatingFor)) {
        return res.status(400).json({ error: 'Creating for must be one of: self, daughter, son, other' });
      }

      // Validate firstName
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ error: 'First name is required' });
      }

      // Validate lastName
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        return res.status(400).json({ error: 'Last name is required' });
      }

      // Validate gender
      if (!gender || !validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Gender must be M or F' });
      }

      // Validate dob
      if (!dob || typeof dob !== 'string') {
        return res.status(400).json({ error: 'Date of birth (dob) is required' });
      }

      // Validate DOB format and age
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth format' });
      }

      const age = calculateAge(dob);
      if (age < 18) {
        return res.status(400).json({ error: 'Must be at least 18 years old' });
      }

      // Validate nativePlace
      if (!nativePlace || typeof nativePlace !== 'string' || nativePlace.trim().length === 0) {
        return res.status(400).json({ error: 'Native place is required' });
      }

      // Validate height
      if (!height || typeof height !== 'string' || height.trim().length === 0) {
        return res.status(400).json({ error: 'Height is required' });
      }

      // Validate workingStatus and related fields
      if (typeof workingStatus !== 'boolean') {
        return res.status(400).json({ error: 'Working status is required' });
      }

      if (workingStatus) {
        if (!company || typeof company !== 'string' || company.trim().length === 0) {
          return res.status(400).json({ error: 'Company is required when working' });
        }
        if (!designation || typeof designation !== 'string' || designation.trim().length === 0) {
          return res.status(400).json({ error: 'Designation is required when working' });
        }
        if (!workLocation || typeof workLocation !== 'string' || workLocation.trim().length === 0) {
          return res.status(400).json({ error: 'Work location is required when working' });
        }
        if (!salaryRange || !validSalaryRanges.includes(salaryRange)) {
          return res.status(400).json({ error: 'Valid salary range is required when working' });
        }
      }

      const profileData: Omit<Profile, '_id' | 'createdAt' | 'updatedAt'> = {
        creatingFor: creatingFor as CreatingFor,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        gender: gender as Gender,
        dob: dob.trim(),
        age: age,
        nativePlace: nativePlace.trim(),
        height: height.trim(),
        workingStatus: workingStatus,
        company: workingStatus ? company?.trim() : undefined,
        designation: workingStatus ? designation?.trim() : undefined,
        workLocation: workingStatus ? workLocation?.trim() : undefined,
        salaryRange: workingStatus ? salaryRange as SalaryRange : undefined,
        aboutMe: aboutMe?.trim() || undefined,
        verified: false,
        subscribed: false
      };

      const profile = await createProfile(userId, profileData);

      res.status(201).json({
        success: true,
        profile: {
          _id: profile._id,
          creatingFor: profile.creatingFor,
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: profile.name,
          gender: profile.gender,
          dob: profile.dob,
          age: profile.age,
          nativePlace: profile.nativePlace,
          height: profile.height,
          workingStatus: profile.workingStatus,
          company: profile.company,
          designation: profile.designation,
          workLocation: profile.workLocation,
          salaryRange: profile.salaryRange,
          aboutMe: profile.aboutMe,
          verified: profile.verified,
          subscribed: profile.subscribed,
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
      const {
        creatingFor,
        firstName,
        lastName,
        dob,
        gender,
        nativePlace,
        height,
        workingStatus,
        company,
        designation,
        workLocation,
        salaryRange,
        aboutMe
      } = req.body;

    // Build update object with only provided fields
    const updateData: Partial<Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>> = {};

    if (creatingFor !== undefined) {
      if (!validCreatingFor.includes(creatingFor)) {
        return res.status(400).json({ error: 'Creating for must be one of: self, daughter, son, other' });
      }
      updateData.creatingFor = creatingFor as CreatingFor;
    }

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid first name' });
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || lastName.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid last name' });
      }
      updateData.lastName = lastName.trim();
    }

    // Update combined name if either firstName or lastName changed
    if (updateData.firstName || updateData.lastName) {
      const existingProfile = await readProfile(userId);
      if (existingProfile) {
        const newFirstName = updateData.firstName || existingProfile.firstName;
        const newLastName = updateData.lastName || existingProfile.lastName;
        updateData.name = `${newFirstName} ${newLastName}`;
      }
    }

    if (gender !== undefined) {
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Gender must be M or F' });
      }
      updateData.gender = gender as Gender;
    }

    if (dob !== undefined) {
      if (typeof dob !== 'string' || dob.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid date of birth' });
      }
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth format' });
      }
      updateData.dob = dob.trim();
      updateData.age = calculateAge(dob);
    }

    if (nativePlace !== undefined) {
      if (typeof nativePlace !== 'string' || nativePlace.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid native place' });
      }
      updateData.nativePlace = nativePlace.trim();
    }

    if (height !== undefined) {
      if (typeof height !== 'string' || height.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid height' });
      }
      updateData.height = height.trim();
    }

    if (workingStatus !== undefined) {
      if (typeof workingStatus !== 'boolean') {
        return res.status(400).json({ error: 'Working status must be a boolean' });
      }
      updateData.workingStatus = workingStatus;

      // If switching to not working, clear work fields
      if (!workingStatus) {
        updateData.company = undefined;
        updateData.designation = undefined;
        updateData.workLocation = undefined;
        updateData.salaryRange = undefined;
      }
    }

    if (company !== undefined) {
      updateData.company = company?.trim() || undefined;
    }

    if (designation !== undefined) {
      updateData.designation = designation?.trim() || undefined;
    }

    if (workLocation !== undefined) {
      updateData.workLocation = workLocation?.trim() || undefined;
    }

    if (salaryRange !== undefined) {
      if (salaryRange && !validSalaryRanges.includes(salaryRange)) {
        return res.status(400).json({ error: 'Invalid salary range' });
      }
      updateData.salaryRange = salaryRange as SalaryRange | undefined;
    }

    if (aboutMe !== undefined) {
      updateData.aboutMe = aboutMe?.trim() || undefined;
    }

    // Note: verified and subscribed fields cannot be updated by users

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
        creatingFor: updatedProfile.creatingFor,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        name: updatedProfile.name,
        gender: updatedProfile.gender,
        dob: updatedProfile.dob,
        age: updatedProfile.age,
        nativePlace: updatedProfile.nativePlace,
        height: updatedProfile.height,
        workingStatus: updatedProfile.workingStatus,
        company: updatedProfile.company,
        designation: updatedProfile.designation,
        workLocation: updatedProfile.workLocation,
        salaryRange: updatedProfile.salaryRange,
        aboutMe: updatedProfile.aboutMe,
        verified: updatedProfile.verified,
        subscribed: updatedProfile.subscribed,
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
