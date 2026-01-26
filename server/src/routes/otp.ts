/**
 * OTP Routes
 * Handles OTP sending and verification
 *
 * This file acts as the interface between the client and the OTP provider.
 * To switch OTP providers, only update the import from msg91Service to your new provider.
 */

import express, { Request, Response } from 'express';
import { sendOtp, verifyOtp, resendOtp } from '../services/msg91Service.js';
import { otpRateLimiter, verifyRateLimiter } from '../middleware/otpRateLimit.js';

const router = express.Router();

// Temporary storage for request IDs (in production, use Redis or similar)
// Maps phone number to request ID
const otpSessions = new Map<string, { requestId: string; expiresAt: number }>();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(phone);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/otp/send
 * Send OTP to phone number
 */
router.post('/send', otpRateLimiter, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'Phone number is required',
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        message: 'Phone number should contain 10-15 digits',
      });
    }

    console.log(`[OTP] Sending OTP to phone: ${phone}`);

    // Send OTP using the provider service
    const requestId = await sendOtp(phone);

    // Store request ID for verification
    // Session expires in 10 minutes
    otpSessions.set(phone, {
      requestId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log(`[OTP] OTP sent successfully. Request ID: ${requestId}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('[OTP] Send error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';

    res.status(500).json({
      error: 'Failed to send OTP',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/otp/verify
 * Verify OTP code
 */
router.post('/verify', verifyRateLimiter, async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'Phone number is required',
      });
    }

    if (!otp) {
      return res.status(400).json({
        error: 'OTP is required',
      });
    }

    // Validate OTP format
    const otpRegex = /^\d{4,6}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json({
        error: 'Invalid OTP format',
        message: 'OTP should be 4-6 digits',
      });
    }

    // Get request ID from session
    const session = otpSessions.get(phone);

    if (!session) {
      return res.status(400).json({
        error: 'No OTP session found',
        message: 'Please request a new OTP',
      });
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
      otpSessions.delete(phone);
      return res.status(400).json({
        error: 'OTP expired',
        message: 'Please request a new OTP',
      });
    }

    console.log(`[OTP] Verifying OTP for phone: ${phone}`);

    // Verify OTP using the provider service
    const isValid = await verifyOtp(session.requestId, otp);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'The OTP you entered is incorrect',
      });
    }

    // Clear session after successful verification
    otpSessions.delete(phone);

    console.log(`[OTP] OTP verified successfully for phone: ${phone}`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      phone,
    });
  } catch (error) {
    console.error('[OTP] Verify error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';

    res.status(500).json({
      error: 'Failed to verify OTP',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/otp/resend
 * Resend OTP to phone number
 */
router.post('/resend', otpRateLimiter, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'Phone number is required',
      });
    }

    console.log(`[OTP] Resending OTP to phone: ${phone}`);

    // Resend OTP using the provider service
    const requestId = await resendOtp(phone);

    // Update session with new request ID
    otpSessions.set(phone, {
      requestId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log(`[OTP] OTP resent successfully. Request ID: ${requestId}`);

    res.json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    console.error('[OTP] Resend error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';

    res.status(500).json({
      error: 'Failed to resend OTP',
      message: errorMessage,
    });
  }
});

export default router;
