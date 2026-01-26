import express from 'express';
import { readProfile, createProfile, updateProfile, listProfiles, maskString, SortOption, FilterOptions } from '../services/profileManager.js';
import { Profile, CreatingFor, Gender, SalaryRange, WorkingStatus, calculateAge, parseHeightToCm } from '../models/profile.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyUserOwnership, verifyUserIdMatch } from '../middleware/verifyOwnership.js';
import { getOtherUserProfileImages } from '../services/fileManager.js';
import { generateAccessToken, getAccessTokenCookieOptions } from './auth.js';
import { getConnectionBetweenUsers } from '../services/connectionManager.js';

const router = express.Router();

// Valid values for enums
const validCreatingFor: CreatingFor[] = ['self', 'daughter', 'son', 'other'];
const validGenders: Gender[] = ['M', 'F'];
const validSalaryRanges: SalaryRange[] = ['<5L', '5-15L', '15-30L', '30-50L', '>50L'];
const validWorkingStatuses: WorkingStatus[] = ['employed', 'self-employed', 'not-working'];

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

      // Get profiles (gender from JWT, no DB call needed)
      const profiles = await listProfiles(currentUserId, currentGender ?? undefined, limit, skip, sortBy, Object.keys(filters).length > 0 ? filters : undefined);

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

      res.status(200).json({
        success: true,
        profiles: profilesWithImages,
        count: profilesWithImages.length,
        isVerified,
        skip,
        limit,
        sort: sortBy,
        filters
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

      // Check if users are connected (to show lastName)
      // Own profile always shows full details
      let isConnected = isOwnProfile;
      if (!isOwnProfile) {
        const connection = await getConnectionBetweenUsers(viewerUserId, targetUserId);
        isConnected = connection?.status === 'ACCEPTED';
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
      // Only show lastName when connection is accepted
      res.status(200).json({
        success: true,
        profile: {
          _id: profile._id,
          firstName: profile.firstName,
          lastName: isConnected ? profile.lastName : null, // Show only when connected
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
        education,
        aboutMe,
        // Jatak/Kundali fields (optional)
        placeOfBirth,
        birthTiming,
        gothra,
        nakshatra
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

      // Validate workingStatus
      if (!workingStatus || !validWorkingStatuses.includes(workingStatus)) {
        return res.status(400).json({ error: 'Working status must be one of: employed, self-employed, not-working' });
      }

      // Work details are optional - validate salaryRange only if provided
      if (salaryRange && !validSalaryRanges.includes(salaryRange)) {
        return res.status(400).json({ error: 'Invalid salary range' });
      }

      const isWorking = workingStatus === 'employed' || workingStatus === 'self-employed';
      const heightCm = parseHeightToCm(height.trim());
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
        heightCm: heightCm ?? undefined,
        workingStatus: workingStatus as WorkingStatus,
        company: isWorking && company?.trim() ? company.trim() : undefined,
        designation: isWorking && designation?.trim() ? designation.trim() : undefined,
        workLocation: isWorking && workLocation?.trim() ? workLocation.trim() : undefined,
        salaryRange: isWorking && salaryRange ? salaryRange as SalaryRange : undefined,
        education: education?.trim() || undefined,
        aboutMe: aboutMe?.trim() || undefined,
        // Jatak/Kundali fields (optional)
        placeOfBirth: placeOfBirth?.trim() || undefined,
        birthTiming: birthTiming || undefined,
        gothra: gothra || undefined,
        nakshatra: nakshatra || undefined,
        verified: false,
        subscribed: false
      };

      const profile = await createProfile(userId, profileData);

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
        education,
        aboutMe,
        // Jatak/Kundali fields (optional)
        placeOfBirth,
        birthTiming,
        gothra,
        nakshatra
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
      const heightCm = parseHeightToCm(height.trim());
      if (heightCm !== null) {
        updateData.heightCm = heightCm;
      }
    }

    if (workingStatus !== undefined) {
      if (!validWorkingStatuses.includes(workingStatus)) {
        return res.status(400).json({ error: 'Working status must be one of: employed, self-employed, not-working' });
      }
      updateData.workingStatus = workingStatus as WorkingStatus;

      // If switching to not working, clear work fields
      if (workingStatus === 'not-working') {
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

    if (education !== undefined) {
      updateData.education = education?.trim() || undefined;
    }

    if (aboutMe !== undefined) {
      updateData.aboutMe = aboutMe?.trim() || undefined;
    }

    // Jatak/Kundali fields (optional)
    if (placeOfBirth !== undefined) {
      updateData.placeOfBirth = placeOfBirth?.trim() || undefined;
    }

    if (birthTiming !== undefined) {
      updateData.birthTiming = birthTiming || undefined;
    }

    if (gothra !== undefined) {
      updateData.gothra = gothra || undefined;
    }

    if (nakshatra !== undefined) {
      updateData.nakshatra = nakshatra || undefined;
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
        education: updatedProfile.education,
        aboutMe: updatedProfile.aboutMe,
        placeOfBirth: updatedProfile.placeOfBirth,
        birthTiming: updatedProfile.birthTiming,
        gothra: updatedProfile.gothra,
        nakshatra: updatedProfile.nakshatra,
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
