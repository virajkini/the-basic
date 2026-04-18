import { getDatabase } from '../db/mongodb.js';
import { User } from '../models/user.js';
import { Profile } from '../models/profile.js';

export type AdminUserListRow = {
  userId: string;
  phone: string;
  userCreatedAt: Date;
  hasProfile: boolean;
  name: string | null;
  isVerified: boolean;
  isSubscribed: boolean;
  profileCreatedAt: Date | null;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a unique user ID in format "u_XXXXX"
 */
function generateUserId(): string {
  const randomNum = Math.floor(Math.random() * 100000);
  return `u_${randomNum.toString().padStart(5, '0')}`;
}

/**
 * Create a new user
 * @param phone - Phone number (must be unique)
 * @returns Created user object
 */
export async function createUser(phone: string): Promise<User> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  
  const userId = generateUserId();
  const user: User = {
    _id: userId,
    phone: phone,
    createdAt: new Date()
  };
  
  try {
    await collection.insertOne(user);
    return user;
  } catch (error: any) {
    // Handle duplicate phone error
    if (error.code === 11000) {
      throw new Error('Phone number already exists');
    }
    throw error;
  }
}

/**
 * Find a user by phone number
 * @param phone - Phone number to search for
 * @returns User object or null if not found
 */
export async function findUserByPhone(phone: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  
  const user = await collection.findOne({ phone: phone });
  return user;
}

/**
 * Find a user by ID
 * @param userId - User ID to search for
 * @returns User object or null if not found
 */
export async function findUserById(userId: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  
  const user = await collection.findOne({ _id: userId });
  return user;
}

/**
 * List all users with optional profile summary (admin).
 */
export async function listAllUsersWithProfileSummary(q?: string): Promise<AdminUserListRow[]> {
  const db = await getDatabase();
  const usersCol = db.collection<User>('users');
  const profilesCol = db.collection<Profile>('profiles');

  const filter: Record<string, unknown> =
    q && q.trim()
      ? { phone: { $regex: escapeRegex(q.trim()), $options: 'i' } }
      : {};

  const users = await usersCol.find(filter).sort({ createdAt: -1 }).toArray();
  const ids = users.map((u) => u._id);
  const profiles = ids.length
    ? await profilesCol.find({ _id: { $in: ids } }).toArray()
    : [];
  const profileById = new Map(profiles.map((p) => [p._id, p]));

  return users.map((u) => {
    const p = profileById.get(u._id);
    const name = p
      ? p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || null
      : null;
    return {
      userId: u._id,
      phone: u.phone,
      userCreatedAt: u.createdAt,
      hasProfile: !!p,
      name,
      isVerified: p?.verified ?? false,
      isSubscribed: p?.subscribed ?? false,
      profileCreatedAt: p?.createdAt ?? null,
    };
  });
}
