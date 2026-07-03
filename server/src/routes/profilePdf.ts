import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { readProfile } from '../services/profileManager.js';
import {
  MAX_PROFILE_PDFS,
  countProfilePdfs,
  deleteProfilePdf,
  fetchProfilePhotoBuffers,
  listProfilePdfs,
  uploadProfilePdf,
} from '../services/profilePdfManager.js';
import { renderProfilePdf } from '../services/profilePdfRenderer.js';

const router = express.Router();

const FAMILY_DETAILS_MAX = 2000;

function loadBrandingLogo(): Buffer | undefined {
  const dir = dirname(fileURLToPath(import.meta.url));
  const logoPath = join(dir, '../assets/branding/android-chrome-512x512.png');
  if (!existsSync(logoPath)) return undefined;
  try {
    return readFileSync(logoPath);
  } catch {
    return undefined;
  }
}

/**
 * GET /api/profile-pdfs
 * List the authenticated user's generated bio-data PDFs.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const items = await listProfilePdfs(userId);
    res.json({
      success: true,
      items,
      count: items.length,
      max: MAX_PROFILE_PDFS,
    });
  } catch (error) {
    console.error('Error listing profile PDFs:', error);
    res.status(500).json({
      error: 'Failed to list profile PDFs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/profile-pdfs
 * Generate a new bio-data PDF for the authenticated user, upload to S3 and
 * return the new item.
 *
 * Body: { familyDetails?: string }
 *
 * Errors:
 *  - 403 not_verified  — only verified users may generate
 *  - 404 profile_missing
 *  - 409 limit_reached — already at MAX_PROFILE_PDFS PDFs
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const rawFamily = (req.body?.familyDetails ?? '') as unknown;
    const familyDetails =
      typeof rawFamily === 'string' ? rawFamily.trim().slice(0, FAMILY_DETAILS_MAX) : '';

    const rawFields = req.body?.includedFields;
    const includedFields: string[] | undefined = Array.isArray(rawFields)
      ? (rawFields as unknown[]).filter((f): f is string => typeof f === 'string').slice(0, 30)
      : undefined;

    const profile = await readProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'profile_missing' });
    }
    if (profile.verified !== true) {
      return res.status(403).json({ error: 'not_verified' });
    }

    const existing = await countProfilePdfs(userId);
    if (existing >= MAX_PROFILE_PDFS) {
      return res.status(409).json({
        error: 'limit_reached',
        message: `You can keep up to ${MAX_PROFILE_PDFS} PDFs. Delete an older one to create a new one.`,
        max: MAX_PROFILE_PDFS,
      });
    }

    const photos = await fetchProfilePhotoBuffers(userId, profile.primaryPhotoKey, 5);
    const logoBuffer = loadBrandingLogo();
    const contactPhone = req.authenticatedUserPhone ?? '';

    const pdfBuffer = await renderProfilePdf({
      profile,
      photos,
      familyDetails,
      logoBuffer,
      contactPhone,
      includedFields,
    });

    const item = await uploadProfilePdf(userId, profile.firstName, pdfBuffer);

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Error generating profile PDF:', error);
    res.status(500).json({
      error: 'Failed to generate profile PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/profile-pdfs/:key
 * Delete a previously generated PDF. Key must be URL-encoded and start with
 * `profiles/{userId}/profilePdf/` (enforced inside the manager).
 */
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const key = decodeURIComponent(req.params.key);
    await deleteProfilePdf(userId, key);

    res.json({ success: true, key });
  } catch (error) {
    console.error('Error deleting profile PDF:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return res.status(403).json({ error: 'Access denied', message: error.message });
    }
    res.status(500).json({
      error: 'Failed to delete profile PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
