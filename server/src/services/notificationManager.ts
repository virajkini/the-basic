import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/mongodb.js';
import { Notification, NotificationType } from '../models/notification.js';

const COLLECTION_NAME = 'notifications';

/**
 * Create a new notification
 * @param userId - User receiving the notification
 * @param type - Type of notification
 * @param refId - Reference ID (e.g., connectionId)
 * @param actorUserId - User who triggered the notification
 * @param actorName - Name of the user who triggered the notification (for display)
 * @returns Created notification object
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  refId: string,
  actorUserId: string,
  actorName?: string
): Promise<Notification> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const notification: Notification = {
    userId,
    type,
    refId,
    actorUserId,
    actorName,
    read: false,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(notification);
  return { ...notification, _id: result.insertedId };
}

/**
 * Get notifications for a user with pagination
 * @param userId - User ID
 * @param limit - Maximum number of notifications to return
 * @param skip - Number of notifications to skip
 * @returns Array of notifications
 */
export async function getNotifications(
  userId: string,
  limit: number = 20,
  skip: number = 0
): Promise<Notification[]> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const notifications = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return notifications;
}

/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Number of unread notifications
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const count = await collection.countDocuments({
    userId,
    read: false,
  });

  return count;
}

/**
 * Mark a single notification as read
 * @param notificationId - Notification ID
 * @param userId - User ID (for ownership verification)
 * @returns Updated notification or null if not found
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const notification = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(notificationId),
      userId, // Ensure user owns this notification
    },
    {
      $set: { read: true },
    },
    {
      returnDocument: 'after',
    }
  );

  return notification;
}

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Number of notifications marked as read
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const result = await collection.updateMany(
    {
      userId,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  return result.modifiedCount;
}

/**
 * Get a notification by ID
 * @param notificationId - Notification ID
 * @returns Notification object or null
 */
export async function getNotificationById(
  notificationId: string
): Promise<Notification | null> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  try {
    const notification = await collection.findOne({
      _id: new ObjectId(notificationId),
    });
    return notification;
  } catch {
    return null;
  }
}
