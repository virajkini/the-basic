import express from 'express';
import { readProfile, createProfile, updateProfile, updateLastActive, listProfiles, SortOption, FilterOptions } from '../services/profileManager.js';
import { calculateAge } from '../models/profile.js';
import { parseCreateProfileBody, parseProfileUpdateBody } from '../validation/profilePayload.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyUserOwnership, verifyUserIdMatch } from '../middleware/verifyOwnership.js';
import { getOtherUserProfileImages, signedUrlsFromKeys } from '../services/fileManager.js';
import { generateAccessToken, getAccessTokenCookieOptions } from './auth.js';
import { getConnectionBetweenUsers } from '../services/connectionManager.js';
import { findUserById, findUserByPhone, findUserByEmail, linkPhoneToUser, linkEmailToUser, deleteUser } from '../services/userManager.js';
import { rankProfiles } from '../lib/rankProfiles.js';
import { createNotification } from '../services/notificationManager.js';
import { NotificationType } from '../models/notification.js';

const router = express.Router();

const PHONE_REGEX = /^\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LinkResult =
  | { ok: true; linkedPhone?: string; linkedEmail?: string }
  | { ok: false; error: string }

async function applyAccountLinking(
  userId: string,
  authProvider: 'phone' | 'google',
  body: Record<string, unknown>
): Promise<LinkResult> {
  const linked: { linkedPhone?: string; linkedEmail?: string } = {};

  if (authProvider === 'google') {
    const dialCode = typeof body.phoneDialCode === 'string' ? body.phoneDialCode.replace(/\D/g, '') : '';
    const number = typeof body.phoneNumber === 'string' ? body.phoneNumber.replace(/\D/g, '') : '';
    if (dialCode && number) {
      const fullPhone = `${dialCode}${number}`;
      if (PHONE_REGEX.test(fullPhone)) {
        const existing = await findUserByPhone(fullPhone);
        if (existing && existing._id !== userId) {
          const existingProfile = await readProfile(existing._id);
          if (existingProfile) {
            return { ok: false, error: 'This phone number is already registered with another account.' };
          }
          await deleteUser(existing._id);
        }
        try {
          const ok = await linkPhoneToUser(userId, fullPhone);
          if (ok) linked.linkedPhone = fullPhone;
        } catch { /* race: another request beat us — treat as conflict with no profile, safe to ignore */ }
      }
    }
  }

  if (authProvider === 'phone') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email && EMAIL_REGEX.test(email)) {
      const existing = await findUserByEmail(email);
      if (existing && existing._id !== userId) {
        const existingProfile = await readProfile(existing._id);
        if (existingProfile) {
          return { ok: false, error: 'This email is already registered with another account.' };
        }
        await deleteUser(existing._id);
      }
      try {
        const ok = await linkEmailToUser(userId, email);
        if (ok) linked.linkedEmail = email;
      } catch { /* race: same as above */ }
    }
  }

  return { ok: true, ...linked };
}

// Valid sort options
const validSortOptions: SortOption[] = [
  'relevant',
  'recent',
  'updated',
  'active',
  'age_asc',
  'age_desc',
  'height_asc',
  'height_desc',
];

/**
 * POST /api/profiles/last-active
 * Update own profile lastActive timestamp (dashboard ping).
 */
router.post(
  '/last-active',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const updated = await updateLastActive(userId);
      if (!updated) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, lastActive: updated.lastActive ?? null });
    } catch (error) {
      console.error('Error updating last active:', error);
      return res.status(500).json({
        error: 'Failed to update last active',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/profiles/discover
 * Get profiles for discovery with images in a single call
 * Lists verified profiles only (server-side); excludes current user and matches opposite gender.
 * If the authenticated user has no profile document yet, returns an empty list (200).
 * Returns masked data + blurred images for unverified viewers
 * Returns full data + original images for verified viewers
 * Query params: limit (default 200), skip (default 0), sort, ageMin, ageMax, favoritesOnly, name
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

      const DISCOVER_LIMIT_DEFAULT = 200;
      const DISCOVER_LIMIT_MAX = 200;
      const limit = Math.min(
        parseInt(req.query.limit as string, 10) || DISCOVER_LIMIT_DEFAULT,
        DISCOVER_LIMIT_MAX
      );
      const skip = parseInt(req.query.skip as string) || 0;

      // Parse sort option
      const sortParam = req.query.sort as string;
      const sortBy: SortOption = validSortOptions.includes(sortParam as SortOption)
        ? sortParam as SortOption
        : 'relevant';

      // Parse filter options up front (needed to decide if we can parallelise)
      const filters: FilterOptions = {};
      const ageMin = parseInt(req.query.ageMin as string);
      const ageMax = parseInt(req.query.ageMax as string);
      if (!isNaN(ageMin) && ageMin >= 18) filters.ageMin = ageMin;
      if (!isNaN(ageMax) && ageMax >= 18) filters.ageMax = ageMax;
      const nameParam = req.query.name as string;
      if (nameParam && nameParam.trim()) filters.name = nameParam.trim();

      const favParam = String(req.query.favoritesOnly ?? '').toLowerCase();
      const favoritesOnly = favParam === '1' || favParam === 'true' || favParam === 'yes';

      let viewerProfile, profiles;

      if (favoritesOnly) {
        // Need viewer's favoriteUserIds before we can query, so sequential
        viewerProfile = await readProfile(currentUserId);

        if (!viewerProfile) {
          return res.status(200).json({ success: true, profiles: [], count: 0, isVerified, skip, limit, sort: sortBy, filters: {} });
        }

        filters.favoritesOnly = true;
        filters.favoriteUserIds = viewerProfile.favoriteUserIds ?? [];

        profiles = await listProfiles(currentUserId, currentGender ?? undefined, limit, skip, sortBy, filters);
      } else {
        // Common case: viewer profile and discover list are independent — run in parallel
        [viewerProfile, profiles] = await Promise.all([
          readProfile(currentUserId),
          listProfiles(
            currentUserId,
            currentGender ?? undefined,
            limit,
            skip,
            sortBy,
            Object.keys(filters).length > 0 ? filters : undefined
          ),
        ]);

        if (!viewerProfile) {
          return res.status(200).json({ success: true, profiles: [], count: 0, isVerified, skip, limit, sort: sortBy, filters: {} });
        }
      }

      const profilesWithImages = (await Promise.all(
        profiles.map(async (profile) => {
          let images: string[];
          if (profile.photoKeys && profile.photoKeys.length > 0) {
            images = signedUrlsFromKeys(profile.photoKeys, profile._id, isVerified);
          } else {
            const files = await getOtherUserProfileImages(profile._id, isVerified, profile.primaryPhotoKey);
            images = files.map(f => f.url);
          }

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
            workLocation: profile.workLocation,
            height: profile.height,
            heightCm: profile.heightCm,
            designation: isWorking ? profile.designation : null,
            verified: profile.verified,
            base_score: profile.base_score,
            createdAt: profile.createdAt,
            images,
          };
        })
      )).filter(profile => profile !== null);

      const viewerAge = viewerProfile.dob
        ? calculateAge(viewerProfile.dob)
        : viewerProfile.age;

      const responseProfiles =
        sortBy === 'relevant'
          ? rankProfiles(profilesWithImages, {
              gender: viewerProfile.gender,
              age: viewerAge,
              heightCm: viewerProfile.heightCm,
              viewerId: currentUserId,
            })
          : profilesWithImages;

      const { favoriteUserIds: _favIdsOmit, ...filtersForResponse } = filters;

      res.status(200).json({
        success: true,
        profiles: responseProfiles,
        count: responseProfiles.length,
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
      const files = await getOtherUserProfileImages(targetUserId, isVerified, profile.primaryPhotoKey);
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
          foodPreference: profile.foodPreference ?? null,
          verified: profile.verified,
          lastActive: profile.lastActive ?? null,
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
          phone: req.authenticatedUserPhone,
          email: req.authenticatedUserEmail,
          authProvider: req.authenticatedUserAuthProvider ?? 'phone',
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
          foodPreference: profile.foodPreference ?? null,
          verified: profile.verified,
          subscribed: profile.subscribed,
          favoriteUserIds: profile.favoriteUserIds ?? [],
          primaryPhotoKey: profile.primaryPhotoKey ?? null,
          lastActive: profile.lastActive ?? null,
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

      const authProvider = req.authenticatedUserAuthProvider ?? 'phone';
      const linkResult = await applyAccountLinking(userId, authProvider, req.body as Record<string, unknown>);
      if (!linkResult.ok) {
        return res.status(409).json({ error: linkResult.error });
      }

      const profile = await createProfile(userId, parsed.data);

      const newAccessToken = generateAccessToken({
        phone: linkResult.linkedPhone ?? req.authenticatedUserPhone,
        email: linkResult.linkedEmail ?? req.authenticatedUserEmail,
        authProvider,
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
          foodPreference: profile.foodPreference ?? null,
          verified: profile.verified,
          subscribed: profile.subscribed,
          primaryPhotoKey: profile.primaryPhotoKey ?? null,
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

      const prevFavoriteIds: string[] = existingProfile.favoriteUserIds ?? [];

      const authProvider = req.authenticatedUserAuthProvider ?? 'phone';
      const linkResult = await applyAccountLinking(userId, authProvider, req.body as Record<string, unknown>);
      if (!linkResult.ok) {
        return res.status(409).json({ error: linkResult.error });
      }

      const parsed = parseProfileUpdateBody(req.body, existingProfile, {
        allowVerifiedSubscribed: false,
      });
      if (!parsed.ok) {
        return res.status(parsed.status).json({ error: parsed.error });
      }

    const updatedProfile = await updateProfile(userId, parsed.updateData);

    // Fire SHORTLISTED notifications for newly added favorites (anonymous — no actorName)
    if (parsed.updateData.favoriteUserIds) {
      const newlyAdded = (parsed.updateData.favoriteUserIds as string[]).filter(
        (id) => !prevFavoriteIds.includes(id)
      );
      for (const targetUserId of newlyAdded) {
        void createNotification(targetUserId, NotificationType.SHORTLISTED, userId, userId);
      }
    }

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (linkResult.linkedPhone || linkResult.linkedEmail) {
      const newToken = generateAccessToken({
        phone: linkResult.linkedPhone ?? req.authenticatedUserPhone,
        email: linkResult.linkedEmail ?? req.authenticatedUserEmail,
        authProvider,
        userId: req.authenticatedUserId!,
        verified: updatedProfile.verified ?? false,
        subscribed: updatedProfile.subscribed ?? false,
        gender: updatedProfile.gender ?? null,
      });
      res.cookie('accessToken', newToken, getAccessTokenCookieOptions());
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
        foodPreference: updatedProfile.foodPreference ?? null,
        verified: updatedProfile.verified,
        subscribed: updatedProfile.subscribed,
        favoriteUserIds: updatedProfile.favoriteUserIds ?? [],
        primaryPhotoKey: updatedProfile.primaryPhotoKey ?? null,
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
