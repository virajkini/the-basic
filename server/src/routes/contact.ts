/**
 * Contact Form Routes
 * Handles contact form submissions and admin management
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  getMessageCounts,
  deleteContactMessage,
} from '../services/contactManager.js';
import { ContactMessageStatus, ContactSubject } from '../models/contactMessage.js';

const router = express.Router();

// Rate limiter for contact form submissions
// 3 submissions per IP per hour
const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: { error: 'Too many submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as key
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Valid subjects
const VALID_SUBJECTS: string[] = Object.values(ContactSubject);

/**
 * POST /api/contact
 * Submit a contact form message (public, rate limited)
 */
router.post('/', contactRateLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate: either email or phone must be provided
    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone number is required' });
    }

    // Validate email format if provided
    if (email) {
      if (typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({ error: 'Email is required when provided' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Validate phone format if provided
    if (phone) {
      if (typeof phone !== 'string' || phone.trim().length === 0) {
        return res.status(400).json({ error: 'Phone is required when provided' });
      }

      const phoneRegex = /^\d{10,15}$/;
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ error: 'Invalid phone number format (10-15 digits)' });
      }
    }

    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return res.status(400).json({ error: 'Valid subject is required' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Limit message length
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long (max 5000 characters)' });
    }

    const contactMessage = await createContactMessage(
      name.trim(),
      email ? email.trim().toLowerCase() : undefined,
      phone ? phone.trim() : undefined,
      subject as ContactSubject,
      message.trim()
    );

    console.log(`[CONTACT] New message from ${email || phone}: ${subject}`);

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully',
      id: contactMessage._id,
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({
      error: 'Failed to submit message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/contact/admin/messages
 * Get all contact messages (admin only)
 */
router.get(
  '/admin/messages',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, limit = '50', skip = '0' } = req.query;

      // Validate status if provided
      if (status && !Object.values(ContactMessageStatus).includes(status as ContactMessageStatus)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }

      const messages = await getContactMessages(
        status as ContactMessageStatus | undefined,
        parseInt(limit as string, 10),
        parseInt(skip as string, 10)
      );

      const counts = await getMessageCounts();

      res.json({
        success: true,
        messages,
        counts,
      });
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      res.status(500).json({
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/contact/admin/messages/:messageId
 * Get a specific contact message (admin only)
 */
router.get(
  '/admin/messages/:messageId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const message = await getContactMessageById(messageId);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('Error fetching contact message:', error);
      res.status(500).json({
        error: 'Failed to fetch message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * PATCH /api/contact/admin/messages/:messageId/status
 * Update contact message status (admin only)
 */
router.patch(
  '/admin/messages/:messageId/status',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { status, adminNotes } = req.body;

      // Validate status
      if (!status || !Object.values(ContactMessageStatus).includes(status)) {
        return res.status(400).json({ error: 'Valid status is required' });
      }

      const message = await updateContactMessageStatus(
        messageId,
        status as ContactMessageStatus,
        adminNotes
      );

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      console.log(`[CONTACT] Message ${messageId} status updated to ${status}`);

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('Error updating contact message:', error);
      res.status(500).json({
        error: 'Failed to update message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * DELETE /api/contact/admin/messages/:messageId
 * Delete a contact message (admin only)
 */
router.delete(
  '/admin/messages/:messageId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const deleted = await deleteContactMessage(messageId);

      if (!deleted) {
        return res.status(404).json({ error: 'Message not found' });
      }

      console.log(`[CONTACT] Message ${messageId} deleted`);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting contact message:', error);
      res.status(500).json({
        error: 'Failed to delete message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
