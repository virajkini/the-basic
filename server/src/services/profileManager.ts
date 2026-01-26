import { getDatabase } from '../db/mongodb.js';
import { Profile } from '../models/profile.js';

/**
 * Mask a string to show only first 2 characters followed by XXX
 * @param value - The string to mask
 * @returns Masked string (e.g., "Mumbai" -> "MuXXX")
 */
export function maskString(value: string | undefined): string {
  if (!value || value.length === 0) return 'XXX';
  if (value.length <= 2) return value + 'XXX';
  return value.substring(0, 2) + 'XXX';
}

/**
 * Read a profile by user ID
 * @param userId - User ID (same as profile _id)
 * @returns Profile object or null if not found
 */
export async function readProfile(userId: string): Promise<Profile | null> {
  const db = await getDatabase();
  const collection = db.collection<Profile>('profiles');
  
  const profile = await collection.findOne({ _id: userId });
  return profile;
}

/**
 * Create a new profile
 * @param userId - User ID (same as profile _id)
 * @param profileData - Profile data (excluding _id, createdAt, updatedAt)
 * @returns Created profile object
 */
export async function createProfile(
  userId: string,
  profileData: Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Profile> {
  const db = await getDatabase();
  const collection = db.collection<Profile>('profiles');
  
  const now = new Date();
  const profile: Profile = {
    _id: userId,
    ...profileData,
    createdAt: now,
    updatedAt: now
  };
  
  await collection.insertOne(profile);
  return profile;
}

/**
 * Update an existing profile
 * @param userId - User ID (same as profile _id)
 * @param updateData - Fields to update (excluding _id, createdAt)
 * @returns Updated profile object or null if not found
 */
export async function updateProfile(
  userId: string,
  updateData: Partial<Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<Profile | null> {
  const db = await getDatabase();
  const collection = db.collection<Profile>('profiles');
  
  const updatedProfile = await collection.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        ...updateData,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  
  return updatedProfile || null;
}

// Sort options for profile listing
export type SortOption = 'recent' | 'updated' | 'age_asc' | 'age_desc' | 'height_asc' | 'height_desc';

// Filter options for profile listing
export interface FilterOptions {
  ageMin?: number;
  ageMax?: number;
  name?: string;
}

/**
 * List profiles for discovery (excludes current user, filters by opposite gender)
 * @param currentUserId - Current user's ID to exclude
 * @param currentUserGender - Current user's gender to filter opposite
 * @param limit - Maximum number of profiles to return
 * @param skip - Number of profiles to skip (for pagination)
 * @param sortBy - Sort option (recent, updated, age_asc, age_desc, height_asc, height_desc)
 * @param filters - Filter options (ageMin, ageMax)
 * @returns Array of profiles
 */
export async function listProfiles(
  currentUserId: string,
  currentUserGender?: 'M' | 'F',
  limit: number = 20,
  skip: number = 0,
  sortBy: SortOption = 'recent',
  filters?: FilterOptions
): Promise<Profile[]> {
  const db = await getDatabase();
  const collection = db.collection<Profile>('profiles');

  const filter: Record<string, unknown> = {
    _id: { $ne: currentUserId }
  };

  // Filter by opposite gender if provided
  if (currentUserGender) {
    filter.gender = currentUserGender === 'M' ? 'F' : 'M';
  }

  // Apply age filter using dob field
  if (filters?.ageMin !== undefined || filters?.ageMax !== undefined) {
    const today = new Date();
    const dobFilter: Record<string, Date> = {};

    if (filters.ageMax !== undefined) {
      // For max age, calculate minimum birth date (older = earlier date)
      const minBirthDate = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate());
      dobFilter.$gte = minBirthDate;
    }

    if (filters.ageMin !== undefined) {
      // For min age, calculate maximum birth date (younger = later date)
      const maxBirthDate = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate());
      dobFilter.$lte = maxBirthDate;
    }

    // Convert dob string to date comparison using $expr
    // Since dob is stored as string "YYYY-MM-DD", we need a different approach
    if (filters.ageMin !== undefined) {
      const maxBirthYear = today.getFullYear() - filters.ageMin;
      const maxDob = `${maxBirthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      filter.dob = { ...filter.dob as object, $lte: maxDob };
    }

    if (filters.ageMax !== undefined) {
      const minBirthYear = today.getFullYear() - filters.ageMax - 1;
      const minDob = `${minBirthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      filter.dob = { ...filter.dob as object, $gte: minDob };
    }
  }

  // Apply name filter (case-insensitive partial match on firstName)
  if (filters?.name) {
    filter.firstName = { $regex: filters.name, $options: 'i' };
  }

  // Determine sort order
  let sortOrder: Record<string, 1 | -1>;
  switch (sortBy) {
    case 'updated':
      sortOrder = { updatedAt: -1 };
      break;
    case 'age_asc': // Youngest first (most recent dob)
      sortOrder = { dob: -1 };
      break;
    case 'age_desc': // Oldest first (earliest dob)
      sortOrder = { dob: 1 };
      break;
    case 'height_asc': // Shortest first
      sortOrder = { heightCm: 1 };
      break;
    case 'height_desc': // Tallest first
      sortOrder = { heightCm: -1 };
      break;
    case 'recent':
    default:
      sortOrder = { createdAt: -1 };
      break;
  }

  const profiles = await collection
    .find(filter)
    .sort(sortOrder)
    .skip(skip)
    .limit(limit)
    .toArray();

  return profiles;
}

/**
 * Get all profiles (admin only)
 * @returns Array of all profiles
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDatabase();
  const collection = db.collection<Profile>('profiles');

  const profiles = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return profiles;
}

/**
 * Delete a user's profile (used for account deletion)
 * @param userId - User ID
 * @returns true if deleted, false if not found
 */
export async function deleteProfile(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<Profile>('profiles');

  const result = await collection.deleteOne({ _id: userId });
  return result.deletedCount > 0;
}


