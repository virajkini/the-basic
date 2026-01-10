import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationManager.js';
import { addClient, removeClient } from '../services/sseManager.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Query params:
 *   - limit: number (default 20, max 50)
 *   - skip: number (default 0)
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const { limit, skip } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 20, 50);
      const skipNum = parseInt(skip as string) || 0;

      const notifications = await getNotifications(userId, limitNum, skipNum);

      res.status(200).json({
        success: true,
        notifications: notifications.map((notif) => ({
          _id: notif._id!.toString(),
          type: notif.type,
          refId: notif.refId,
          actorUserId: notif.actorUserId,
          read: notif.read,
          createdAt: notif.createdAt,
        })),
        count: notifications.length,
        skip: skipNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        error: 'Failed to get notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const count = await getUnreadCount(userId);

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        error: 'Failed to get unread count',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      const { id: notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const notification = await markAsRead(notificationId, userId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json({
        success: true,
        notification: {
          _id: notification._id!.toString(),
          type: notification.type,
          refId: notification.refId,
          actorUserId: notification.actorUserId,
          read: notification.read,
          createdAt: notification.createdAt,
        },
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const count = await markAllAsRead(userId);

      res.status(200).json({
        success: true,
        markedAsRead: count,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/notifications/stream
 * SSE endpoint for real-time notifications
 */
router.get('/stream',
  authenticateToken,
  (req, res) => {
    const userId = req.authenticatedUserId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    // Register client
    addClient(userId, res);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      removeClient(userId, res);
    });
  }
);

export default router;
