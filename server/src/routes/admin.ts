import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { updateProfile, deleteProfile, readProfile, createProfile, removePhotoKey } from '../services/profileManager.js';
import { createUser, findUserById } from '../services/userManager.js';
import {
  ADMIN_PAGE_SIZE_DEFAULT,
  ADMIN_PAGE_SIZE_MAX,
  countAllUsers,
  getVerificationStatusCounts,
  listAdminProfilesPage,
  listAdminUsersPage,
} from '../services/adminListManager.js';
import { deleteAllUserConnections } from '../services/connectionManager.js';
import { deleteAllUserNotifications, createCustomNotification } from '../services/notificationManager.js';
import { sendMulticastNotification } from '../services/fcmService.js';
import { getDatabase } from '../db/mongodb.js';
import {
  deleteAllUserFiles,
  generateMultiplePresignedUrls,
  generatePageAssetPresignedUrls,
  getUserProfileImages,
  deleteFile,
} from '../services/fileManager.js';
import { parseCreateProfileBody, parseProfileUpdateBody } from '../validation/profilePayload.js';
import { isVerificationStatus, resolveVerificationStatus, verificationFields } from '../models/profile.js';

function adminAudit(actorId: string | undefined, action: string, targetUserId?: string, extra?: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      tag: 'ADMIN_AUDIT',
      actorId,
      action,
      targetUserId,
      ...extra,
    })
  );
}

/** Paging + filters shared by the admin list endpoints. `paged` is false when no limit is sent (legacy: return all). */
function parseAdminListQuery(query: Request['query']) {
  const rawLimit = parseInt(String(query.limit ?? ''), 10);
  const paged = !isNaN(rawLimit);
  const limit = paged ? Math.min(Math.max(rawLimit, 1), ADMIN_PAGE_SIZE_MAX) : 1_000_000;
  const skip = Math.max(parseInt(String(query.skip ?? ''), 10) || 0, 0);
  const status = isVerificationStatus(query.status) ? query.status : undefined;
  const q = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined;
  return { paged, limit, skip, status, q };
}

function normalizeAdminPhone(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;
  return input.replace(/\s+/g, '').replace(/^\+/, '');
}

/**
 * Middleware to restrict endpoint to localhost only
 */
function requireLocalhost(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

  if (!isLocalhost) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This endpoint is only available from localhost'
    });
  }

  next();
}

const router = express.Router();

/**
 * GET /api/admin/profiles
 * Profiles with user info, newest first (admin only).
 * Query: limit (default all; Profiles tab sends 20), skip, status, q (name / phone / email / user id).
 * On the first page also returns status counts for the filter chips.
 */
router.get('/profiles',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { paged, limit, skip, status, q } = parseAdminListQuery(req.query);
      const [page, statusCounts] = await Promise.all([
        listAdminProfilesPage({ limit, skip, status, q }),
        paged && skip === 0 ? getVerificationStatusCounts() : Promise.resolve(null),
      ]);

      res.json({
        success: true,
        profiles: page.rows,
        count: page.rows.length,
        total: page.total,
        hasMore: page.hasMore,
        ...(statusCounts ? { statusCounts: statusCounts.counts, totalProfiles: statusCounts.total } : {}),
      });
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      res.status(500).json({
        error: 'Failed to fetch profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PATCH /api/admin/profiles/:userId/verification-status
 * Set the verification workflow status (admin only). `verified` is derived from it.
 * Body: { status: VerificationStatus }
 */
router.patch('/profiles/:userId/verification-status',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!isVerificationStatus(status)) {
        return res.status(400).json({ error: 'status is required and must be a valid verification status' });
      }

      const updatedProfile = await updateProfile(userId, verificationFields(status));

      if (!updatedProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      adminAudit(req.authenticatedUserId, 'set_verification_status', userId, { status });
      res.json({
        success: true,
        profile: {
          userId: updatedProfile._id,
          verified: updatedProfile.verified,
          verificationStatus: resolveVerificationStatus(updatedProfile),
        },
      });
    } catch (error) {
      console.error('Error updating verification status:', error);
      res.status(500).json({
        error: 'Failed to update verification status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PATCH /api/admin/profiles/:userId/verified
 * Legacy endpoint for older admin clients. Body: { verified: boolean } → 'verified' | 'pending'.
 */
router.patch('/profiles/:userId/verified',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;

      if (typeof verified !== 'boolean') {
        return res.status(400).json({
          error: 'verified field is required and must be a boolean'
        });
      }

      const updatedProfile = await updateProfile(userId, verificationFields(verified ? 'verified' : 'pending'));

      if (!updatedProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({
        success: true,
        profile: {
          userId: updatedProfile._id,
          verified: updatedProfile.verified,
        },
      });
    } catch (error) {
      console.error('Error updating verified status:', error);
      res.status(500).json({
        error: 'Failed to update verified status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/admin/users
 * Create a user by phone (admin only). Does not create a session for that user.
 */
router.post('/users',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const phone = normalizeAdminPhone(req.body?.phone);
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const user = await createUser(phone);
      adminAudit(req.authenticatedUserId, 'create_user', user._id, { phone });
      res.status(201).json({ success: true, userId: user._id, phone: user.phone });
    } catch (error) {
      if (error instanceof Error && error.message === 'Phone number already exists') {
        return res.status(409).json({ error: 'Phone number already exists' });
      }
      console.error('Error creating user (admin):', error);
      res.status(500).json({
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/users
 * Users with optional profile summary, newest first.
 * Query: limit (default all; Onboarding tab sends 20), skip, status, q (phone / email / user id),
 * unseenSort (asc | desc). On the first page also returns status counts for the filter chips.
 */
router.get('/users',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { paged, limit, skip, status, q } = parseAdminListQuery(req.query);
      const unseenSort = req.query.unseenSort === 'asc' || req.query.unseenSort === 'desc' ? req.query.unseenSort : undefined;
      const firstPage = paged && skip === 0;
      const [page, statusCounts, totalUsers] = await Promise.all([
        listAdminUsersPage({ limit, skip, status, q, unseenSort }),
        firstPage ? getVerificationStatusCounts() : Promise.resolve(null),
        firstPage ? countAllUsers() : Promise.resolve(null),
      ]);
      res.json({
        success: true,
        users: page.rows,
        count: page.rows.length,
        total: page.total,
        hasMore: page.hasMore,
        ...(statusCounts ? { statusCounts: statusCounts.counts, totalUsers } : {}),
      });
    } catch (error) {
      console.error('Error listing users (admin):', error);
      res.status(500).json({
        error: 'Failed to list users',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/page-assets/presign
 * Presigned PUT URLs for public marketing assets under page-assets/ only.
 * Localhost + admin only. Returns unsigned CDN URLs for use on amgel-jodi-home.
 */
router.get(
  '/page-assets/presign',
  requireLocalhost,
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { names } = req.query;
      if (!names || typeof names !== 'string') {
        return res.status(400).json({ error: 'names query parameter is required (comma-separated filenames)' });
      }

      const filenames = names
        .split(',')
        .map((n) => decodeURIComponent(n.trim()))
        .filter(Boolean);

      if (filenames.length === 0) {
        return res.status(400).json({ error: 'At least one filename is required' });
      }

      const results = await generatePageAssetPresignedUrls(filenames);
      adminAudit(req.authenticatedUserId, 'presign_page_assets', undefined, {
        count: filenames.length,
        names: filenames,
      });
      res.json({ success: true, urls: results, count: results.length });
    } catch (error) {
      console.error('Error generating page-asset presigned URLs (admin):', error);
      if (error instanceof Error && error.message.includes('Invalid filename')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({
        error: 'Failed to generate presigned URLs',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/users/:userId/files/presign
 * Presigned PUT URLs under profiles/:userId/original/ only (not admin's folder).
 */
router.get('/users/:userId/files/presign',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const target = await findUserById(userId);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { count, types } = req.query;
      if (!count) {
        return res.status(400).json({ error: 'count query parameter is required' });
      }
      const countNum = parseInt(count as string, 10);
      if (isNaN(countNum) || countNum < 1) {
        return res.status(400).json({ error: 'count must be a positive number' });
      }
      if (countNum > 5) {
        return res.status(400).json({ error: 'count cannot exceed 5' });
      }

      let fileTypes: string[] | undefined;
      if (types) {
        fileTypes = (types as string).split(',').map((t) => t.trim());
        const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
        const invalidTypes = fileTypes.filter((t) => !allowedTypes.includes(t.toLowerCase()));
        if (invalidTypes.length > 0) {
          return res.status(400).json({
            error: `Invalid file types: ${invalidTypes.join(', ')}. Allowed types: jpeg, jpg, png, webp`,
          });
        }
        if (fileTypes.length !== countNum) {
          const firstType = fileTypes[0] || 'jpeg';
          fileTypes = Array(countNum).fill(firstType);
        }
      }

      const profile = await readProfile(userId);
      const existingCount = profile?.photoKeys?.length;
      const results = await generateMultiplePresignedUrls(userId, countNum, fileTypes, existingCount);
      adminAudit(req.authenticatedUserId, 'presign_files', userId, { count: countNum });
      res.json({ success: true, urls: results, count: results.length });
    } catch (error) {
      console.error('Error generating presigned URLs (admin):', error);
      if (error instanceof Error && error.message.includes('Maximum 5 photos')) {
        return res.status(400).json({ error: 'Maximum 5 photos allowed', message: error.message });
      }
      res.status(500).json({
        error: 'Failed to generate presigned URLs',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/users/:userId/files
 * List original profile images for target user (admin).
 */
router.get('/users/:userId/files',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const target = await findUserById(userId);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }
      const files = await getUserProfileImages(userId);
      res.json({
        success: true,
        images: files.map((f) => f.url),
        files,
      });
    } catch (error) {
      console.error('Error listing files (admin):', error);
      res.status(500).json({
        error: 'Failed to list profile images',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:userId/files
 * Body: { key } — full S3 object key (may contain slashes). Must be under profiles/:userId/original/
 */
router.delete('/users/:userId/files',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const key = typeof req.body?.key === 'string' ? req.body.key : '';
      if (!key) {
        return res.status(400).json({ error: 'key is required in request body' });
      }
      const target = await findUserById(userId);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }
      await deleteFile(key, userId);
      await removePhotoKey(userId, key);
      adminAudit(req.authenticatedUserId, 'delete_file', userId);
      res.json({ success: true, message: 'File deleted successfully', key });
    } catch (error) {
      console.error('Error deleting file (admin):', error);
      if (error instanceof Error && error.message.includes('Access denied')) {
        return res.status(403).json({ error: 'Access denied', message: error.message });
      }
      res.status(500).json({
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/admin/users/:userId/profile
 * Create profile for target user (admin).
 */
router.post('/users/:userId/profile',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const target = await findUserById(userId);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }
      const existing = await readProfile(userId);
      if (existing) {
        return res.status(409).json({ error: 'Profile already exists for this user' });
      }

      const parsed = parseCreateProfileBody(req.body);
      if (!parsed.ok) {
        return res.status(parsed.status).json({ error: parsed.error });
      }

      const body = req.body as Record<string, unknown>;
      let profileData = { ...parsed.data };
      if (body.verificationStatus !== undefined) {
        if (!isVerificationStatus(body.verificationStatus)) {
          return res.status(400).json({ error: 'verificationStatus is invalid' });
        }
        profileData = { ...profileData, ...verificationFields(body.verificationStatus) };
      } else if (typeof body.verified === 'boolean') {
        profileData = { ...profileData, ...verificationFields(body.verified ? 'verified' : 'pending') };
      }
      if (typeof body.subscribed === 'boolean') {
        profileData.subscribed = body.subscribed;
      }

      const profile = await createProfile(userId, profileData);
      adminAudit(req.authenticatedUserId, 'create_profile', userId);
      res.status(201).json({ success: true, profile });
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Profile already exists for this user' });
      }
      console.error('Error creating profile (admin):', error);
      res.status(500).json({
        error: 'Failed to create profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * PUT /api/admin/users/:userId/profile
 * Update profile for target user (admin). May set verified/subscribed.
 */
router.put('/users/:userId/profile',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const target = await findUserById(userId);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }
      const existingProfile = await readProfile(userId);
      if (!existingProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const parsed = parseProfileUpdateBody(req.body, existingProfile, {
        allowVerifiedSubscribed: true,
      });
      if (!parsed.ok) {
        return res.status(parsed.status).json({ error: parsed.error });
      }

      const updatedProfile = await updateProfile(userId, parsed.updateData);
      if (!updatedProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      adminAudit(req.authenticatedUserId, 'update_profile', userId);
      res.status(200).json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error('Error updating profile (admin):', error);
      res.status(500).json({
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/users/:userId
 * User + profile for admin editor.
 */
router.get('/users/:userId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const profile = await readProfile(userId);
      res.json({
        success: true,
        user: { userId: user._id, phone: user.phone, createdAt: user.createdAt },
        profile: profile ?? null,
      });
    } catch (error) {
      console.error('Error fetching user (admin):', error);
      res.status(500).json({
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:userId
 * Delete a user's account (admin only, localhost only)
 * Removes profile, connections, notifications, and S3 files
 * Keeps users and connection_quota records for audit purposes
 *
 * SECURITY: This endpoint is restricted to:
 * 1. Localhost access only (requireLocalhost)
 * 2. Valid JWT token (authenticateToken)
 * 3. Admin user (requireAdmin)
 * 4. Confirmation string in request body
 */
router.delete('/users/:userId',
  requireLocalhost,
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { confirmation } = req.body;

      // Require explicit confirmation
      if (confirmation !== 'DELETE') {
        return res.status(400).json({
          error: 'Confirmation required',
          message: 'Please send confirmation: "DELETE" to proceed with account deletion'
        });
      }

      // Verify the user exists
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`[ADMIN ACCOUNT DELETION] Starting deletion for user: ${userId} by admin: ${req.user?.userId}`);

      // Delete all related data in parallel
      const [
        connectionsDeleted,
        profileDeleted,
        notificationsDeleted,
        filesDeleted
      ] = await Promise.all([
        deleteAllUserConnections(userId),
        deleteProfile(userId),
        deleteAllUserNotifications(userId),
        deleteAllUserFiles(userId)
      ]);

      console.log(`[ADMIN ACCOUNT DELETION] Completed for user: ${userId}`, {
        connectionsDeleted,
        profileDeleted,
        notificationsDeleted,
        filesDeleted
      });

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        details: {
          userId,
          connectionsDeleted,
          profileDeleted,
          notificationsDeleted,
          filesDeleted
        }
      });
    } catch (error) {
      console.error('Error deleting account (admin):', error);
      res.status(500).json({
        error: 'Failed to delete account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/admin/notifications/send
 * Send a custom notification to selected users (admin only)
 * Body: { userIds: string[], title: string, body: string }
 */
router.post('/notifications/send',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userIds, title, body, imageUrl } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'userIds must be a non-empty array' });
      }
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'title is required' });
      }
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'body is required' });
      }

      const actorUserId = req.authenticatedUserId!;
      const results = await Promise.allSettled(
        userIds.map((userId: string) => createCustomNotification(userId, actorUserId, title, body, imageUrl))
      );

      const sent = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      adminAudit(actorUserId, 'send_custom_notification', undefined, {
        userCount: userIds.length,
        sent,
        failed,
        title,
      });

      res.status(200).json({ success: true, sent, failed });
    } catch (error) {
      console.error('Error sending custom notifications:', error);
      res.status(500).json({
        error: 'Failed to send notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/admin/notifications/broadcast
 * Send a custom notification to all users with a registered FCM token (admin only)
 * Body: { title: string, body: string }
 */
router.post('/notifications/broadcast',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, body, imageUrl } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'title is required' });
      }
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'body is required' });
      }

      const db = await getDatabase();
      const profiles = await db
        .collection<{ _id: string; fcmToken: string }>('profiles')
        .find({ fcmToken: { $exists: true, $nin: [null, ''] } } as any)
        .project({ _id: 1, fcmToken: 1 })
        .toArray();

      const tokens = profiles.map((p) => p.fcmToken).filter(Boolean) as string[];
      const sent = await sendMulticastNotification(tokens, title, body, { channelId: 'custom', type: 'CUSTOM' }, imageUrl);

      adminAudit(req.authenticatedUserId, 'broadcast_notification', undefined, {
        totalWithTokens: tokens.length,
        fcmSent: sent,
        title,
      });

      res.status(200).json({ success: true, totalWithTokens: tokens.length, fcmSent: sent });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      res.status(500).json({
        error: 'Failed to broadcast notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;

