import { ObjectId, Db } from 'mongodb';
import { getDatabase } from '../db/mongodb.js';
import { Notification, NotificationType } from '../models/notification.js';
import { sendPushNotification } from './fcmService.js';
import { sendToUser } from './sseManager.js';

const COLLECTION_NAME = 'notifications';

function getPushText(type: NotificationType, actorName?: string): { title: string; body: string } {
  const name = actorName || 'Someone';
  switch (type) {
    case NotificationType.SHORTLISTED:
      return {
        title: '❤️ You caught someone\'s attention!',
        body: 'Someone has shortlisted your profile. Open the app to discover more matches.',
      };
    case NotificationType.REQUEST_RECEIVED:
      return {
        title: '❤️ New interest received',
        body: `${name} wants to connect with you. Open the app and review their profile now.`,
      };
    case NotificationType.REQUEST_ACCEPTED:
      return {
        title: '🎉 It\'s a match!',
        body: `Your request has been accepted by ${name}. You can now view their contact details.`,
      };
    case NotificationType.REQUEST_REJECTED:
      return {
        title: `Your request wasn't accepted by ${name}`,
        body: 'Don\'t worry—there are many more compatible profiles waiting for you.',
      };
    default:
      return { title: 'Amgel Jodi', body: 'You have a new notification' };
  }
}

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
  const created = { ...notification, _id: result.insertedId };

  sendToUser(userId, {
    type: 'NEW_NOTIFICATION',
    data: { notificationId: created._id.toString(), type },
  });

  // Fire FCM push if user has a registered token
  void sendPushForNotification(db, userId, type, actorName, created._id.toString(), refId);

  return created;
}

export async function createCustomNotification(
  userId: string,
  actorUserId: string,
  title: string,
  body: string,
  imageUrl?: string
): Promise<Notification> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const notification: Notification = {
    userId,
    type: NotificationType.CUSTOM,
    actorUserId,
    title,
    body,
    read: false,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(notification);
  const created = { ...notification, _id: result.insertedId };

  sendToUser(userId, {
    type: 'NEW_NOTIFICATION',
    data: { notificationId: created._id.toString(), type: NotificationType.CUSTOM },
  });

  void sendPushForCustomNotification(db, userId, title, body, created._id.toString(), imageUrl);

  return created;
}

async function sendPushForNotification(
  db: Db,
  userId: string,
  type: NotificationType,
  actorName: string | undefined,
  notificationId: string,
  refId: string | undefined
): Promise<void> {
  try {
    const profile = await db.collection<{ fcmToken?: string }>('profiles').findOne(
      { _id: userId } as any,
      { projection: { fcmToken: 1 } }
    );
    if (!profile?.fcmToken) return;

    const { title, body } = getPushText(type, actorName);

    await sendPushNotification(profile.fcmToken, title, body, {
      notificationId,
      type,
      channelId: 'connections',
      deepLink: 'https://app.amgeljodi.com/dashboard',
    });
  } catch (error) {
    console.error('[FCM] sendPushForNotification error:', error);
  }
}

async function sendPushForCustomNotification(
  db: Db,
  userId: string,
  title: string,
  body: string,
  notificationId: string,
  imageUrl?: string
): Promise<void> {
  try {
    const profile = await db.collection<{ fcmToken?: string }>('profiles').findOne(
      { _id: userId } as any,
      { projection: { fcmToken: 1 } }
    );
    if (!profile?.fcmToken) return;

    await sendPushNotification(
      profile.fcmToken,
      title,
      body,
      { notificationId, type: NotificationType.CUSTOM, channelId: 'custom' },
      imageUrl
    );
  } catch (error) {
    console.error('[FCM] sendPushForCustomNotification error:', error);
  }
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

/**
 * Delete all notifications for a user (used for account deletion)
 * @param userId - User ID
 * @returns Number of deleted notifications
 */
export async function deleteAllUserNotifications(userId: string): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection<Notification>(COLLECTION_NAME);

  // Delete notifications where user is the recipient OR the actor
  const result = await collection.deleteMany({
    $or: [{ userId }, { actorUserId: userId }],
  });

  return result.deletedCount;
}
