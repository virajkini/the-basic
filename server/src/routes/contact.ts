/**
 * Contact Form Routes
 * Handles contact form submissions
 */

import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for contact form to prevent spam
const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many contact form submissions',
    message: 'Please wait before submitting again',
  },
});

/**
 * POST /api/contact
 * Submit contact form
 */
router.post('/', contactRateLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Name is required',
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        error: 'Subject is required',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    // Validate: either email or phone must be provided
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Either email or phone number is required',
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
        });
      }
    }

    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({
          error: 'Invalid phone number format',
        });
      }
    }

    // Log the contact form submission
    console.log('[CONTACT] New submission:', {
      name,
      email: email || 'Not provided',
      phone: phone || 'Not provided',
      subject,
      messagePreview: message.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // TODO: In production, you might want to:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Send confirmation email to user
    // 4. Integrate with a ticketing system

    res.json({
      success: true,
      message: 'Your message has been received. We will get back to you soon.',
    });
  } catch (error) {
    console.error('[CONTACT] Submission error:', error);

    res.status(500).json({
      error: 'Failed to submit contact form',
      message: 'Please try again later',
    });
  }
});

export default router;
