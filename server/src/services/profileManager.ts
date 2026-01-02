import { getDatabase } from '../db/mongodb.js';
import { Profile } from '../models/profile.js';

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


