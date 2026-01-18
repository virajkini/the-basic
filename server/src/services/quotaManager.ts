import { getDatabase } from '../db/mongodb.js';
import {
  ConnectionQuota,
  QuotaStatus,
  DEFAULT_DAILY_LIMIT,
  DEFAULT_TOTAL_CREDITS,
} from '../models/connectionQuota.js';

const COLLECTION_NAME = 'connection_quotas';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get or create a quota record for a user
 * Uses upsert to atomically create if doesn't exist
 */
export async function getOrCreateQuota(userId: string): Promise<ConnectionQuota> {
  const db = await getDatabase();
  const collection = db.collection<ConnectionQuota>(COLLECTION_NAME);
  const today = getTodayDate();

  const result = await collection.findOneAndUpdate(
    { _id: userId },
    {
      $setOnInsert: {
        dailyCount: 0,
        dailyResetDate: today,
        dailyLimit: DEFAULT_DAILY_LIMIT,
        totalAvailable: DEFAULT_TOTAL_CREDITS,
        totalUsed: 0,
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return result!;
}

/**
 * Get the current quota status for a user
 * Handles daily reset logic
 */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const quota = await getOrCreateQuota(userId);
  const today = getTodayDate();

  // Check if we need to reset daily count
  let dailyCount = quota.dailyCount;
  if (quota.dailyResetDate !== today) {
    // New day - daily count should be 0
    dailyCount = 0;
  }

  const dailyLimit = quota.dailyLimit;
  const dailyRemaining = dailyLimit === null ? Infinity : Math.max(0, dailyLimit - dailyCount);
  const totalRemaining = Math.max(0, quota.totalAvailable - quota.totalUsed);

  return {
    dailyRemaining: dailyRemaining === Infinity ? -1 : dailyRemaining, // -1 indicates unlimited
    dailyLimit,
    totalRemaining,
    totalAvailable: quota.totalAvailable,
  };
}

/**
 * Check if user can send a connection request
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export async function canSendRequest(userId: string): Promise<{
  allowed: boolean;
  reason?: 'DAILY_LIMIT_EXCEEDED' | 'NO_CREDITS';
  quota: QuotaStatus;
}> {
  const quota = await getOrCreateQuota(userId);
  const today = getTodayDate();

  // Check if we need to reset daily count
  let dailyCount = quota.dailyCount;
  if (quota.dailyResetDate !== today) {
    dailyCount = 0;
  }

  const dailyLimit = quota.dailyLimit;
  const dailyRemaining = dailyLimit === null ? Infinity : Math.max(0, dailyLimit - dailyCount);
  const totalRemaining = Math.max(0, quota.totalAvailable - quota.totalUsed);

  const quotaStatus: QuotaStatus = {
    dailyRemaining: dailyRemaining === Infinity ? -1 : dailyRemaining,
    dailyLimit,
    totalRemaining,
    totalAvailable: quota.totalAvailable,
  };

  // Check total credits first
  if (totalRemaining <= 0) {
    return { allowed: false, reason: 'NO_CREDITS', quota: quotaStatus };
  }

  // Check daily limit (null means no limit)
  if (dailyLimit !== null && dailyCount >= dailyLimit) {
    return { allowed: false, reason: 'DAILY_LIMIT_EXCEEDED', quota: quotaStatus };
  }

  return { allowed: true, quota: quotaStatus };
}

/**
 * Consume one credit (increment dailyCount and totalUsed)
 * Should be called AFTER successfully sending a request
 * Returns updated quota status
 */
export async function consumeCredit(userId: string): Promise<QuotaStatus> {
  const db = await getDatabase();
  const collection = db.collection<ConnectionQuota>(COLLECTION_NAME);
  const today = getTodayDate();

  // First, get current quota to check if we need to reset daily count
  const currentQuota = await getOrCreateQuota(userId);
  const needsReset = currentQuota.dailyResetDate !== today;

  let result: ConnectionQuota;

  if (needsReset) {
    // Reset daily count and set to 1
    result = (await collection.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          dailyCount: 1,
          dailyResetDate: today,
          updatedAt: new Date(),
        },
        $inc: { totalUsed: 1 },
      },
      { returnDocument: 'after' }
    ))!;
  } else {
    // Just increment
    result = (await collection.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { dailyCount: 1, totalUsed: 1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    ))!;
  }

  const dailyLimit = result.dailyLimit;
  const dailyRemaining = dailyLimit === null ? Infinity : Math.max(0, dailyLimit - result.dailyCount);
  const totalRemaining = Math.max(0, result.totalAvailable - result.totalUsed);

  return {
    dailyRemaining: dailyRemaining === Infinity ? -1 : dailyRemaining,
    dailyLimit,
    totalRemaining,
    totalAvailable: result.totalAvailable,
  };
}

/**
 * Add credits to a user's account
 * @param userId - User ID
 * @param amount - Number of credits to add
 * @param removeDailyLimit - If true, sets dailyLimit to null (unlimited)
 */
export async function addCredits(
  userId: string,
  amount: number,
  removeDailyLimit: boolean = false
): Promise<ConnectionQuota> {
  const db = await getDatabase();
  const collection = db.collection<ConnectionQuota>(COLLECTION_NAME);

  // Ensure quota exists first
  await getOrCreateQuota(userId);

  const updateDoc: Record<string, unknown> = {
    $inc: { totalAvailable: amount },
    $set: { updatedAt: new Date() },
  };

  if (removeDailyLimit) {
    (updateDoc.$set as Record<string, unknown>).dailyLimit = null;
  }

  const result = await collection.findOneAndUpdate(
    { _id: userId },
    updateDoc,
    { returnDocument: 'after' }
  );

  return result!;
}

/**
 * Set daily limit for a user
 * @param userId - User ID
 * @param limit - New daily limit (null for unlimited)
 */
export async function setDailyLimit(
  userId: string,
  limit: number | null
): Promise<ConnectionQuota> {
  const db = await getDatabase();
  const collection = db.collection<ConnectionQuota>(COLLECTION_NAME);

  // Ensure quota exists first
  await getOrCreateQuota(userId);

  const result = await collection.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        dailyLimit: limit,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result!;
}

/**
 * Get raw quota record for admin purposes
 */
export async function getQuotaRaw(userId: string): Promise<ConnectionQuota | null> {
  const db = await getDatabase();
  const collection = db.collection<ConnectionQuota>(COLLECTION_NAME);
  return await collection.findOne({ _id: userId });
}
