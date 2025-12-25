import { getDatabase } from '../db/mongodb.js';
import { User } from '../models/user.js';

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

