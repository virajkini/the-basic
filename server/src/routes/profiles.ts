import express from 'express';
import { readProfile, createProfile, updateProfile, listProfiles, maskString, SortOption, FilterOptions } from '../services/profileManager.js';
import { Profile, calculateAge } from '../models/profile.js';
import { parseCreateProfileBody, parseProfileUpdateBody } from '../validation/profilePayload.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyUserOwnership, verifyUserIdMatch } from '../middleware/verifyOwnership.js';
import { getOtherUserProfileImages } from '../services/fileManager.js';
import { generateAccessToken, getAccessTokenCookieOptions } from './auth.js';
import { getConnectionBetweenUsers } from '../services/connectionManager.js';
import { findUserById } from '../services/userManager.js';

const router = express.Router();

// Valid sort options
const validSortOptions: SortOption[] = ['recent', 'updated', 'age_asc', 'age_desc', 'height_asc', 'height_desc'];

/**
 * GET /api/profiles/discover
 * Get profiles for discovery with images in a single call
 * Returns masked data + blurred images for unverified users
 * Returns full data + original images for verified users
 * Query params: limit (default 20), skip (default 0), sort, ageMin, ageMax
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

      // Parse sort option
      const sortParam = req.query.sort as string;
      const sortBy: SortOption = validSortOptions.includes(sortParam as SortOption)
        ? sortParam as SortOption
        : 'recent';

      // Parse filter options
      const filters: FilterOptions = {};
      const ageMin = parseInt(req.query.ageMin as string);
      const ageMax = parseInt(req.query.ageMax as string);
      if (!isNaN(ageMin) && ageMin >= 18) filters.ageMin = ageMin;
      if (!isNaN(ageMax) && ageMax >= 18) filters.ageMax = ageMax;
      const nameParam = req.query.name as string;
      if (nameParam && nameParam.trim()) filters.name = nameParam.trim();

      const favParam = String(req.query.favoritesOnly ?? '').toLowerCase();
      const favoritesOnly = favParam === '1' || favParam === 'true' || favParam === 'yes';
      if (favoritesOnly) {
        filters.favoritesOnly = true;
        const viewerProfile = await readProfile(currentUserId);
        filters.favoriteUserIds = viewerProfile?.favoriteUserIds ?? [];
      }

      const profiles = await listProfiles(
        currentUserId,
        currentGender ?? undefined,
        limit,
        skip,
        sortBy,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      // Fetch images for all profiles in parallel
      const profilesWithImages = (await Promise.all(
        profiles.map(async (profile) => {
          // Get images (blurred for unverified, compressed for verified)
          const files = await getOtherUserProfileImages(profile._id, isVerified);
          const images = files.map(f => f.url);

          // Skip profiles with no images
          if (images.length === 0) {
            return null;
          }

          const age = profile.dob ? calculateAge(profile.dob) : profile.age;

          // Determine if working (handles both legacy boolean and new string format)
          const isWorking = profile.workingStatus === true ||
                            profile.workingStatus === 'employed' ||
                            profile.workingStatus === 'self-employed';

          // Show full data for all users (images are blurred for unverified)
          return {
            _id: profile._id,
            firstName: profile.firstName,
            age,
            nativePlace: profile.nativePlace,
            height: profile.height,
            designation: isWorking ? profile.designation : null,
            verified: profile.verified,
            images,
          };
        })
      )).filter(profile => profile !== null);

      const { favoriteUserIds: _favIdsOmit, ...filtersForResponse } = filters;

      res.status(200).json({
        success: true,
        profiles: profilesWithImages,
        count: profilesWithImages.length,
        isVerified,
        skip,
        limit,
        sort: sortBy,
        filters: filtersForResponse
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
 * GET /api/profiles/view/:userId
 * View another user's profile with full details
 * Returns masked data for unverified viewers
 * Returns full data for verified viewers
 */
router.get('/view/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const { userId: targetUserId } = req.params;
      const viewerUserId = req.authenticatedUserId;
      const isVerified = req.authenticatedUserVerified ?? false;

      if (!viewerUserId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      // Check if viewing own profile (for preview functionality)
      const isOwnProfile = targetUserId === viewerUserId;

      const profile = await readProfile(targetUserId);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check if users are connected (to show lastName and contact details)
      // Own profile always shows full details
      let isConnected = isOwnProfile;
      if (!isOwnProfile) {
        const connection = await getConnectionBetweenUsers(viewerUserId, targetUserId);
        isConnected = connection?.status === 'ACCEPTED';
      }

      // Get phone number if connected
      let phone: string | null = null;
      if (isConnected) {
        const user = await findUserById(targetUserId);
        phone = user?.phone || null;
      }

      // Get images (blurred for unverified, compressed for verified)
      const files = await getOtherUserProfileImages(targetUserId, isVerified);
      const images = files.map(f => f.url);

      const age = profile.dob ? calculateAge(profile.dob) : profile.age;

      // Determine if working (handles both legacy boolean and new string format)
      const isWorking = profile.workingStatus === true ||
                        profile.workingStatus === 'employed' ||
                        profile.workingStatus === 'self-employed';

      // Show full profile data for all users (images are blurred for unverified)
      // Only show lastName and phone when connection is accepted
      res.status(200).json({
        success: true,
        profile: {
          _id: profile._id,
          firstName: profile.firstName,
          lastName: isConnected ? profile.lastName : null, // Show only when connected
          phone: isConnected ? phone : null, // Show only when connected
          dob: profile.dob,
          age,
          nativePlace: profile.nativePlace,
          height: profile.height,
          workingStatus: profile.workingStatus,
          company: isWorking ? profile.company : null,
          designation: isWorking ? profile.designation : null,
          workLocation: isWorking ? profile.workLocation : null,
          salaryRange: isWorking ? profile.salaryRange : null,
          education: profile.education || null,
          aboutMe: profile.aboutMe || null,
          placeOfBirth: profile.placeOfBirth || null,
          birthTiming: profile.birthTiming || null,
          gothra: profile.gothra || null,
          nakshatra: profile.nakshatra || null,
          kuldeva: profile.kuldeva || null,
          verified: profile.verified,
          updatedAt: profile.updatedAt,
          images,
        },
        isConnected
      });
    } catch (error) {
      console.error('Error viewing profile:', error);
      res.status(500).json({
        error: 'Failed to view profile',
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

      // Check if verified, subscribed, or gender changed from token values
      const tokenVerified = req.authenticatedUserVerified ?? false;
      const tokenSubscribed = req.authenticatedUserSubscribed ?? false;
      const tokenGender = req.authenticatedUserGender ?? null;
      const dbVerified = profile.verified ?? false;
      const dbSubscribed = profile.subscribed ?? false;
      const dbGender = profile.gender ?? null;

      if (tokenVerified !== dbVerified || tokenSubscribed !== dbSubscribed || tokenGender !== dbGender) {
        // Generate new access token with updated values
        const newAccessToken = generateAccessToken({
          phone: req.authenticatedUserPhone!,
          userId: req.authenticatedUserId!,
          verified: dbVerified,
          subscribed: dbSubscribed,
          gender: dbGender,
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
          education: profile.education,
          aboutMe: profile.aboutMe,
          placeOfBirth: profile.placeOfBirth,
          birthTiming: profile.birthTiming,
          gothra: profile.gothra,
          nakshatra: profile.nakshatra,
          kuldeva: profile.kuldeva,
          verified: profile.verified,
          subscribed: profile.subscribed,
          favoriteUserIds: profile.favoriteUserIds ?? [],
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
      const { userId } = req.body;
      const authenticatedUserId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (userId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied: You can only create your own profile' });
      }

      const parsed = parseCreateProfileBody(req.body);
      if (!parsed.ok) {
        return res.status(parsed.status).json({ error: parsed.error });
      }

      const profile = await createProfile(userId, parsed.data);

      // Generate new access token with gender included
      const newAccessToken = generateAccessToken({
        phone: req.authenticatedUserPhone!,
        userId: req.authenticatedUserId!,
        verified: profile.verified ?? false,
        subscribed: profile.subscribed ?? false,
        gender: profile.gender ?? null,
      });
      res.cookie('accessToken', newAccessToken, getAccessTokenCookieOptions());

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
          education: profile.education,
          aboutMe: profile.aboutMe,
          placeOfBirth: profile.placeOfBirth,
          birthTiming: profile.birthTiming,
          gothra: profile.gothra,
          nakshatra: profile.nakshatra,
          kuldeva: profile.kuldeva,
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

      const existingProfile = await readProfile(userId);
      if (!existingProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const parsed = parseProfileUpdateBody(req.body, existingProfile, {
        allowVerifiedSubscribed: false,
      });
      if (!parsed.ok) {
        return res.status(parsed.status).json({ error: parsed.error });
      }

    const updatedProfile = await updateProfile(userId, parsed.updateData);

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
        education: updatedProfile.education,
        aboutMe: updatedProfile.aboutMe,
        placeOfBirth: updatedProfile.placeOfBirth,
        birthTiming: updatedProfile.birthTiming,
        gothra: updatedProfile.gothra,
        nakshatra: updatedProfile.nakshatra,
        kuldeva: updatedProfile.kuldeva,
        verified: updatedProfile.verified,
        subscribed: updatedProfile.subscribed,
        favoriteUserIds: updatedProfile.favoriteUserIds ?? [],
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
