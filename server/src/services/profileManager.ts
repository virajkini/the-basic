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

/**
 * List profiles for discovery (excludes current user, filters by opposite gender)
 * @param currentUserId - Current user's ID to exclude
 * @param currentUserGender - Current user's gender to filter opposite
 * @param limit - Maximum number of profiles to return
 * @param skip - Number of profiles to skip (for pagination)
 * @returns Array of profiles
 */
export async function listProfiles(
  currentUserId: string,
  currentUserGender?: 'M' | 'F',
  limit: number = 20,
  skip: number = 0
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

  const profiles = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return profiles;
}


