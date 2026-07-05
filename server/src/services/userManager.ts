import { getDatabase } from '../db/mongodb.js';
import { User } from '../models/user.js';
import { Profile } from '../models/profile.js';
import { countUnseenIncomingRequestsSince } from './connectionManager.js';

export type AdminUserListRow = {
  userId: string;
  phone: string | null;
  email: string | null;
  authProvider: 'phone' | 'google';
  userCreatedAt: Date;
  hasProfile: boolean;
  name: string | null;
  isVerified: boolean;
  isSubscribed: boolean;
  profileCreatedAt: Date | null;
  profileUpdatedAt: Date | null;
  profileLastActive: Date | null;
  unseenConnectionRequests: number;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateUserId(): string {
  // 8 hex chars = 4 billion possibilities, negligible collision risk
  const hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `u_${hex}`;
}

/**
 * Create a new user
 * @param phone - Phone number (must be unique)
 * @returns Created user object
 */
export async function createUser(phone: string): Promise<User> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');

  for (let attempt = 0; attempt < 3; attempt++) {
    const user: User = {
      _id: generateUserId(),
      phone: phone,
      authProvider: 'phone',
      createdAt: new Date()
    };
    try {
      await collection.insertOne(user as any);
      return user;
    } catch (error: any) {
      if (error.code === 11000) {
        const isIdConflict = error.keyPattern && '_id' in error.keyPattern;
        if (isIdConflict && attempt < 2) continue;
        throw new Error('Phone number already exists');
      }
      throw error;
    }
  }
  throw new Error('Failed to generate unique user ID');
}

export async function createUserWithEmail(email: string): Promise<User> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');

  // Retry up to 3 times in case of _id collision (extremely rare with 4B space)
  for (let attempt = 0; attempt < 3; attempt++) {
    const user: User = {
      _id: generateUserId(),
      email: email.toLowerCase(),
      authProvider: 'google',
      createdAt: new Date()
    };

    try {
      await collection.insertOne(user as any);
      return user;
    } catch (error: any) {
      if (error.code === 11000) {
        const isIdConflict = error.keyPattern && '_id' in error.keyPattern;
        if (isIdConflict && attempt < 2) continue; // retry with new ID
        throw new Error('Email already exists');
      }
      throw error;
    }
  }
  throw new Error('Failed to generate unique user ID');
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  return collection.findOne({ email: email.toLowerCase() });
}

export async function deleteUser(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  const result = await collection.deleteOne({ _id: userId as any });
  return result.deletedCount === 1;
}

export async function linkPhoneToUser(userId: string, phone: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  const result = await collection.updateOne(
    { _id: userId as any, phone: { $exists: false } },
    { $set: { phone } }
  );
  return result.modifiedCount === 1;
}

export async function linkEmailToUser(userId: string, email: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  const result = await collection.updateOne(
    { _id: userId as any, email: { $exists: false } },
    { $set: { email: email.toLowerCase() } }
  );
  return result.modifiedCount === 1;
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
      ? {
          $or: [
            { phone: { $regex: escapeRegex(q.trim()), $options: 'i' } },
            { email: { $regex: escapeRegex(q.trim()), $options: 'i' } },
          ],
        }
      : {};

  const users = await usersCol.find(filter).sort({ createdAt: -1 }).toArray();
  const ids = users.map((u) => u._id);
  const profiles = ids.length
    ? await profilesCol.find({ _id: { $in: ids } }).toArray()
    : [];
  const profileById = new Map(profiles.map((p) => [p._id, p]));

  const sinceByUser = new Map<string, Date>();
  for (const u of users) {
    const p = profileById.get(u._id);
    const since = p?.lastActive ?? p?.updatedAt ?? u.createdAt;
    sinceByUser.set(u._id, since);
  }
  const unseenCounts = await countUnseenIncomingRequestsSince(sinceByUser);

  return users.map((u) => {
    const p = profileById.get(u._id);
    const name = p
      ? p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || null
      : null;
    return {
      userId: u._id,
      phone: u.phone ?? null,
      email: u.email ?? null,
      authProvider: u.authProvider,
      userCreatedAt: u.createdAt,
      hasProfile: !!p,
      name,
      isVerified: p?.verified ?? false,
      isSubscribed: p?.subscribed ?? false,
      profileCreatedAt: p?.createdAt ?? null,
      profileUpdatedAt: p?.updatedAt ?? null,
      profileLastActive: p?.lastActive ?? null,
      unseenConnectionRequests: unseenCounts.get(u._id) ?? 0,
    };
  });
}
