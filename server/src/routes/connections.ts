import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getConnections,
  getConnectionBetweenUsers,
} from '../services/connectionManager.js';
import { createNotification } from '../services/notificationManager.js';
import { sendToUser } from '../services/sseManager.js';
import { readProfile } from '../services/profileManager.js';
import { canSendRequest, consumeCredit, getQuotaStatus } from '../services/quotaManager.js';
import { ConnectionStatus } from '../models/connection.js';
import { NotificationType } from '../models/notification.js';

const router = express.Router();

/**
 * GET /api/connections/quota
 * Get current user's connection request quota status
 */
router.get('/quota',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const quota = await getQuotaStatus(userId);

      res.status(200).json({
        success: true,
        quota,
      });
    } catch (error) {
      console.error('Error getting quota:', error);
      res.status(500).json({
        error: 'Failed to get quota',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/connections
 * Send a connection request to another user
 * Body: { toUserId: string }
 */
router.post('/',
  authenticateToken,
  async (req, res) => {
    try {
      const fromUserId = req.authenticatedUserId;
      const { toUserId } = req.body;

      if (!fromUserId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      if (!toUserId || typeof toUserId !== 'string') {
        return res.status(400).json({ error: 'toUserId is required' });
      }

      // Check quota before sending
      const quotaCheck = await canSendRequest(fromUserId);
      if (!quotaCheck.allowed) {
        const errorMessages = {
          DAILY_LIMIT_EXCEEDED: 'You have reached your daily connection request limit. Please try again tomorrow.',
          NO_CREDITS: 'You have no connection credits remaining.',
        };

        return res.status(429).json({
          success: false,
          error: quotaCheck.reason,
          message: errorMessages[quotaCheck.reason!],
          quota: quotaCheck.quota,
        });
      }

      // Create connection request
      const connection = await sendRequest(fromUserId, toUserId);

      // Consume one credit after successful request
      const updatedQuota = await consumeCredit(fromUserId);

      // Get sender's profile for notification
      const senderProfile = await readProfile(fromUserId);
      const senderName = senderProfile?.firstName || undefined;

      // Create notification for recipient
      const notification = await createNotification(
        toUserId,
        NotificationType.REQUEST_RECEIVED,
        connection._id!.toString(),
        fromUserId,
        senderName
      );

      // Send real-time SSE event to recipient
      sendToUser(toUserId, {
        type: 'NEW_NOTIFICATION',
        data: {
          notificationId: notification._id!.toString(),
          type: notification.type,
        },
      });

      res.status(201).json({
        success: true,
        connection: {
          _id: connection._id!.toString(),
          fromUserId: connection.fromUserId,
          toUserId: connection.toUserId,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        },
        quota: updatedQuota,
      });
    } catch (error) {
      console.error('Error sending connection request:', error);

      if (error instanceof Error) {
        if (error.message.includes('yourself')) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('already exists') || error.message.includes('already connected')) {
          return res.status(409).json({ error: error.message });
        }
      }

      res.status(500).json({
        error: 'Failed to send connection request',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * PATCH /api/connections/:id
 * Accept or reject a connection request
 * Body: { action: 'accept' | 'reject' }
 */
router.patch('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      const { id: connectionId } = req.params;
      const { action } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be "accept" or "reject"' });
      }

      let connection;
      let notificationType: NotificationType;

      if (action === 'accept') {
        connection = await acceptRequest(connectionId, userId);
        notificationType = NotificationType.REQUEST_ACCEPTED;
      } else {
        connection = await rejectRequest(connectionId, userId);
        notificationType = NotificationType.REQUEST_REJECTED;
      }

      // Get responder's profile for notification
      const responderProfile = await readProfile(userId);
      const responderName = responderProfile?.firstName || undefined;

      // Create notification for the sender (fromUserId)
      const notification = await createNotification(
        connection.fromUserId,
        notificationType,
        connection._id!.toString(),
        userId,
        responderName
      );

      // Send real-time SSE event to sender
      sendToUser(connection.fromUserId, {
        type: 'NEW_NOTIFICATION',
        data: {
          notificationId: notification._id!.toString(),
          type: notification.type,
        },
      });

      res.status(200).json({
        success: true,
        connection: {
          _id: connection._id!.toString(),
          fromUserId: connection.fromUserId,
          toUserId: connection.toUserId,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating connection:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Only the recipient') || error.message.includes('Cannot')) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({
        error: 'Failed to update connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/connections
 * Get connections for the authenticated user
 * Query params:
 *   - status: 'PENDING' | 'ACCEPTED' | 'REJECTED' (optional)
 *   - type: 'sent' | 'received' (optional)
 *   - limit: number (default 50)
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

      const { status, type, limit, skip } = req.query;

      // Validate status
      let connectionStatus: ConnectionStatus | undefined;
      if (status) {
        const statusUpper = (status as string).toUpperCase();
        if (!Object.values(ConnectionStatus).includes(statusUpper as ConnectionStatus)) {
          return res.status(400).json({
            error: `Invalid status. Must be one of: ${Object.values(ConnectionStatus).join(', ')}`,
          });
        }
        connectionStatus = statusUpper as ConnectionStatus;
      }

      // Validate type
      let connectionType: 'sent' | 'received' | undefined;
      if (type) {
        const typeLower = (type as string).toLowerCase();
        if (!['sent', 'received'].includes(typeLower)) {
          return res.status(400).json({ error: 'type must be "sent" or "received"' });
        }
        connectionType = typeLower as 'sent' | 'received';
      }

      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const skipNum = parseInt(skip as string) || 0;

      const connections = await getConnections(
        userId,
        connectionStatus,
        connectionType,
        limitNum,
        skipNum
      );

      res.status(200).json({
        success: true,
        connections: connections.map((conn) => ({
          _id: conn._id!.toString(),
          fromUserId: conn.fromUserId,
          toUserId: conn.toUserId,
          status: conn.status,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
        })),
        count: connections.length,
        skip: skipNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error('Error getting connections:', error);
      res.status(500).json({
        error: 'Failed to get connections',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/connections/status/:userId
 * Get connection status between authenticated user and another user
 */
router.get('/status/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const currentUserId = req.authenticatedUserId;
      const { userId: otherUserId } = req.params;

      if (!currentUserId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const connection = await getConnectionBetweenUsers(currentUserId, otherUserId);

      if (!connection) {
        return res.status(200).json({
          success: true,
          connection: null,
          status: null,
        });
      }

      res.status(200).json({
        success: true,
        connection: {
          _id: connection._id!.toString(),
          fromUserId: connection.fromUserId,
          toUserId: connection.toUserId,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        },
        status: connection.status,
        isSender: connection.fromUserId === currentUserId,
      });
    } catch (error) {
      console.error('Error getting connection status:', error);
      res.status(500).json({
        error: 'Failed to get connection status',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * DELETE /api/connections/:id
 * Cancel (withdraw) a pending connection request
 * Only the sender can cancel
 */
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      const { id: connectionId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      await cancelRequest(connectionId, userId);

      res.status(200).json({
        success: true,
        message: 'Connection request cancelled',
      });
    } catch (error) {
      console.error('Error cancelling connection:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Only the sender') || error.message.includes('Cannot')) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({
        error: 'Failed to cancel connection request',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
