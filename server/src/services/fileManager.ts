import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'static.amgeljodi.com';
const CLOUDFRONT_KEY_PAIR_ID = 'K16SCVGULKTB9O';
const CLOUDFRONT_PRIVATE_KEY = (process.env.CLOUD_FRONT_KEY || '').replace(/\\n/g, '\n');

// Signed URL expiry time
const SIGNED_URL_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// In-memory cache for CloudFront signed URLs. Keyed by S3 object key.
// Entries are reused until 60 s before expiry, then regenerated.
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function cachedSignedUrl(key: string): string {
  const now = Date.now();
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt - now > 60_000) {
    return cached.url;
  }
  const expiresAt = now + SIGNED_URL_EXPIRY_MS;
  const url = getCloudFrontSignedUrl({
    url: `https://${CLOUDFRONT_DOMAIN}/${key}`,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: new Date(expiresAt).toISOString(),
  });
  signedUrlCache.set(key, { url, expiresAt });
  return url;
}

// Initialize S3 client
const s3ClientConfig: {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
} = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3ClientConfig);

// Helper function to generate CloudFront URL (unsigned — for public page-assets)
function getCloudFrontUrl(key: string): string {
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
  return `https://${CLOUDFRONT_DOMAIN}/${encodedKey}`;
}

const PAGE_ASSETS_PREFIX = 'page-assets/';
const PAGE_ASSET_FILENAME = /^[a-zA-Z0-9._-]+\.(jpe?g|png|webp)$/i;
const PAGE_ASSET_MAX_BATCH = 10;

function validatePageAssetFilename(filename: string): void {
  
  if (!filename || filename.includes('/') || filename.includes('..')) {
    throw new Error('Invalid filename');
  }
  if (!PAGE_ASSET_FILENAME.test(filename)) {
    throw new Error(
      `Invalid filename "${filename}". Use only letters, numbers, dots, dashes, underscores, and extension jpg/jpeg/png/webp`
    );
  }
}

/**
 * Presigned PUT URLs for public page assets (page-assets/ only).
 * CDN URLs are unsigned — suitable for marketing site static assets.
 */
export async function generatePageAssetPresignedUrls(
  filenames: string[]
): Promise<Array<{ url: string; key: string; cdnUrl: string }>> {
  if (filenames.length === 0) {
    throw new Error('At least one filename is required');
  }
  if (filenames.length > PAGE_ASSET_MAX_BATCH) {
    throw new Error(`Cannot presign more than ${PAGE_ASSET_MAX_BATCH} files at once`);
  }

  const typeMap: Record<string, { contentType: string }> = {
    jpg: { contentType: 'image/jpeg' },
    jpeg: { contentType: 'image/jpeg' },
    png: { contentType: 'image/png' },
    webp: { contentType: 'image/webp' },
  };

  return Promise.all(
    filenames.map(async (filename) => {
      validatePageAssetFilename(filename);
      const key = `${PAGE_ASSETS_PREFIX}${filename}`;
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const typeInfo = typeMap[ext] || typeMap.jpg;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: typeInfo.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return { url, key, cdnUrl: getCloudFrontUrl(key) };
    })
  );
}

/** Compressed WebP key derived from an original profile image key (matches image-blur-handler lambda). */
export function compressedKeyFromOriginal(originalKey: string, userId: string): string | null {
  const prefix = `profiles/${userId}/original/`;
  if (!originalKey.startsWith(prefix)) return null;
  const filename = originalKey.slice(prefix.length);
  if (!filename || filename.includes('/') || filename.includes('..')) return null;
  const webpName = filename.replace(/\.[^.]+$/, '.webp');
  return `profiles/${userId}/compressed/${webpName}`;
}

function blurredKeyFromOriginal(originalKey: string, userId: string): string | null {
  const prefix = `profiles/${userId}/original/`;
  if (!originalKey.startsWith(prefix)) return null;
  const filename = originalKey.slice(prefix.length);
  if (!filename || filename.includes('/') || filename.includes('..')) return null;
  return `profiles/${userId}/blurred/${filename}`;
}

function sortFilesPrimaryFirst<T extends { key: string }>(
  files: T[],
  primaryKey: string | null | undefined
): T[] {
  const sorted = [...files].sort((a, b) => a.key.localeCompare(b.key));
  if (!primaryKey) return sorted;
  const idx = sorted.findIndex((f) => f.key === primaryKey);
  if (idx <= 0) return sorted;
  const [primary] = sorted.splice(idx, 1);
  return [primary, ...sorted];
}

/**
 * Generate signed CloudFront URLs directly from stored original S3 keys.
 * No S3 API calls — pure URL derivation. Used by the discover route to skip per-profile S3 ListObjectsV2.
 * For verified viewers returns all compressed images; for unverified returns only the first blurred image.
 */
export function signedUrlsFromKeys(
  originalKeys: string[],
  userId: string,
  viewerIsVerified: boolean
): string[] {
  if (originalKeys.length === 0) return [];

  if (viewerIsVerified) {
    return originalKeys.map((key) => {
      const targetKey = compressedKeyFromOriginal(key, userId) ?? key;
      return cachedSignedUrl(targetKey);
    });
  } else {
    const blurredKey = blurredKeyFromOriginal(originalKeys[0], userId);
    if (!blurredKey) return [];
    return [`https://${CLOUDFRONT_DOMAIN}/${blurredKey}`];
  }
}

/**
 * Get count of existing files in user's profile folder
 * @param userId - User ID
 * @returns Number of files in the folder
 */
export async function getFileCount(userId: string): Promise<number> {
  try {
    const prefix = `profiles/${userId}/original/`;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents?.length || 0;
  } catch (error) {
    console.error('Error getting file count:', error);
    throw error;
  }
}

/**
 * Generate multiple presigned URLs for uploading files to user's profile folder
 * @param userId - User ID
 * @param count - Number of presigned URLs to generate (max 5 total including existing)
 * @param fileTypes - Optional array of file types: 'jpeg', 'jpg', 'png', 'webp'
 * @returns Array of presigned URLs and S3 keys
 */
export async function generateMultiplePresignedUrls(
  userId: string,
  count: number,
  fileTypes?: string[],
  existingCount?: number
): Promise<Array<{ url: string; key: string }>> {
  try {
    // Use provided count (from profile.photoKeys.length) or fall back to S3 list
    const currentCount = existingCount !== undefined ? existingCount : await getFileCount(userId);

    // Validate that adding count won't exceed 5
    if (currentCount + count > 5) {
      const available = 5 - currentCount;
      throw new Error(`Maximum 5 photos allowed. You have ${existingCount} photos. Only ${available} more can be uploaded.`);
    }

    // Map file types to extensions and content types (GIF not allowed)
    const typeMap: Record<string, { ext: string; contentType: string }> = {
      'jpeg': { ext: 'jpg', contentType: 'image/jpeg' },
      'jpg': { ext: 'jpg', contentType: 'image/jpeg' },
      'png': { ext: 'png', contentType: 'image/png' },
      'webp': { ext: 'webp', contentType: 'image/webp' },
    };

    const defaultType = { ext: 'jpg', contentType: 'image/jpeg' };

    // Generate presigned URLs in parallel
    const timestamp = Date.now();
    const promises = Array.from({ length: count }, async (_, index) => {
      // Get file type for this index (default to jpeg if not provided or invalid)
      const fileType = fileTypes?.[index]?.toLowerCase() || 'jpeg';
      const typeInfo = typeMap[fileType] || defaultType;

      // Validate file type is allowed
      if (fileTypes && fileTypes[index] && !typeMap[fileType]) {
        throw new Error(`Invalid file type: ${fileType}. Allowed types: jpeg, jpg, png, webp`);
      }

      // Generate unique key: profiles/[userId]/original/[timestamp]-[index]-[random].[ext]
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const key = `profiles/${userId}/original/${timestamp}-${index}-${randomSuffix}.${typeInfo.ext}`;

      // Generate presigned URL for PUT operation
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: typeInfo.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return { url, key };
    });

    return Promise.all(promises);
  } catch (error) {
    console.error('Error generating multiple presigned URLs:', error);
    
    // Provide more helpful error messages for common S3 errors
    if (error instanceof Error) {
      if (error.message.includes('must be addressed using the specified endpoint')) {
        throw new Error(`S3 region mismatch. Bucket '${BUCKET_NAME}' may be in a different region than configured (${process.env.AWS_REGION || 'ap-south-1'}). Please verify the bucket region and set AWS_REGION accordingly.`);
      }
      if (error.message.includes('does not exist')) {
        throw new Error(`S3 bucket '${BUCKET_NAME}' does not exist or you don't have access to it.`);
      }
      if (error.message.includes('Access Denied') || error.message.includes('Forbidden')) {
        throw new Error(`Access denied to S3 bucket '${BUCKET_NAME}'. Please check your AWS credentials and IAM permissions.`);
      }
    }
    
    throw error;
  }
}

/**
 * Get all profile image URLs for a user (own profile - always returns original with signed URLs)
 * @param userId - User ID
 * @param primaryPhotoKey - Optional original S3 key to list first (from profile document)
 * @returns Array of file objects with signed CloudFront URLs
 */
export async function getUserProfileImages(
  userId: string,
  primaryPhotoKey?: string | null
): Promise<Array<{
  key: string;
  url: string;
  size?: number;
  lastModified?: Date;
}>> {
  try {
    const prefix = `profiles/${userId}/original/`;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || [])
      .filter((item) => item.Key && item.Key !== prefix && item.Size && item.Size > 0)
      .map((item) => {
        if (!item.Key) return null;

        return {
          key: item.Key,
          url: cachedSignedUrl(item.Key),
          size: item.Size,
          lastModified: item.LastModified,
        };
      })
      .filter((file): file is NonNullable<typeof file> => file !== null);

    const primary =
      primaryPhotoKey && files.some((f) => f.key === primaryPhotoKey) ? primaryPhotoKey : null;
    return sortFilesPrimaryFirst(files, primary);
  } catch (error) {
    console.error('Error getting user profile images:', error);
    throw error;
  }
}

/**
 * Get profile images for another user based on viewer's verified status
 * @param targetUserId - User ID of the profile being viewed
 * @param viewerIsVerified - Whether the viewing user is verified
 * @param primaryPhotoKey - Optional original S3 key: first in returned list (verified); preferred blurred object (unverified) when present
 * @returns Array of file objects with appropriate URLs
 *          - Verified viewers: All compressed images (WebP) with signed URLs
 *          - Unverified viewers: Only first blurred image if it exists (public URL)
 */
export async function getOtherUserProfileImages(
  targetUserId: string,
  viewerIsVerified: boolean,
  primaryPhotoKey?: string | null
): Promise<Array<{
  key: string;
  url: string;
  size?: number;
  lastModified?: Date;
}>> {
  try {
    if (viewerIsVerified) {
      // For verified viewers: return all compressed images with signed URLs
      const prefix = `profiles/${targetUserId}/compressed/`;
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);

      const items = (response.Contents || [])
        .filter((item) => item.Key && item.Key !== prefix && item.Size && item.Size > 0)
        .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''));

      // If no compressed images exist yet, fall back to original folder
      if (items.length === 0) {
        const originalPrefix = `profiles/${targetUserId}/original/`;
        const originalCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: originalPrefix,
        });

        const originalResponse = await s3Client.send(originalCommand);

        const originalItems = (originalResponse.Contents || [])
          .filter((item) => item.Key && item.Key !== originalPrefix && item.Size && item.Size > 0)
          .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''));

        const mapped = originalItems.map((item) => {
          return {
            key: item.Key!,
            url: cachedSignedUrl(item.Key!),
            size: item.Size,
            lastModified: item.LastModified,
          };
        });
        const primary =
          primaryPhotoKey && mapped.some((f) => f.key === primaryPhotoKey) ? primaryPhotoKey : null;
        return sortFilesPrimaryFirst(mapped, primary);
      }

      const mapped = items.map((item) => {
        return {
          key: item.Key!,
          url: cachedSignedUrl(item.Key!),
          size: item.Size,
          lastModified: item.LastModified,
        };
      });
      const preferredCompressed = primaryPhotoKey
        ? compressedKeyFromOriginal(primaryPhotoKey, targetUserId)
        : null;
      const primary =
        preferredCompressed && mapped.some((f) => f.key === preferredCompressed)
          ? preferredCompressed
          : null;
      return sortFilesPrimaryFirst(mapped, primary);
    } else {
      // For unverified viewers: check if blurred folder has images
      const blurredPrefix = `profiles/${targetUserId}/blurred/`;
      const blurredCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: blurredPrefix,
      });

      const blurredResponse = await s3Client.send(blurredCommand);

      const blurredItems = (blurredResponse.Contents || [])
        .filter((item) => item.Key && item.Key !== blurredPrefix && item.Size && item.Size > 0)
        .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''));

      // Return only the first blurred image if it exists
      if (blurredItems.length === 0) {
        return [];
      }

      const preferredBlurred =
        primaryPhotoKey && blurredKeyFromOriginal(primaryPhotoKey, targetUserId);
      const chosen =
        preferredBlurred &&
        blurredItems.some((b) => b.Key === preferredBlurred)
          ? blurredItems.find((b) => b.Key === preferredBlurred)!
          : blurredItems[0];
      return [{
        key: chosen.Key!,
        url: `https://${CLOUDFRONT_DOMAIN}/${chosen.Key}`,
        size: chosen.Size,
        lastModified: chosen.LastModified,
      }];
    }
  } catch (error) {
    console.error('Error getting other user profile images:', error);
    throw error;
  }
}

/**
 * Keys for compressed WebP and blurred copies produced by the image pipeline
 * (see server/lambda/image-blur-handler/index.js).
 */
function profileOriginalDerivedKeys(originalKey: string, userId: string): string[] {
  const expectedPrefix = `profiles/${userId}/original/`;
  if (!originalKey.startsWith(expectedPrefix)) {
    return [];
  }
  const filename = originalKey.slice(expectedPrefix.length);
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return [];
  }
  const compressedFilename = filename.replace(/\.[^.]+$/, '.webp');
  return [
    `profiles/${userId}/compressed/${compressedFilename}`,
    `profiles/${userId}/blurred/${filename}`,
  ];
}

/**
 * Delete a profile original from S3 and remove derived compressed/blurred objects
 * so viewers using compressed URLs do not keep seeing removed photos.
 * @param key - S3 object key (must be under profiles/{userId}/original/)
 * @param userId - User ID (for verification)
 */
export async function deleteFile(key: string, userId: string): Promise<void> {
  try {
    const expectedPrefix = `profiles/${userId}/original/`;
    if (!key.startsWith(expectedPrefix)) {
      throw new Error('Access denied: File does not belong to this user');
    }

    const derived = profileOriginalDerivedKeys(key, userId);
    const keysToDelete = [key, ...derived];

    await Promise.all(
      keysToDelete.map((k) =>
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: k,
          })
        )
      )
    );
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Delete all files for a user from S3 (original, compressed, blurred folders)
 * Used for account deletion
 * @param userId - User ID
 * @returns Number of files deleted
 */
export async function deleteAllUserFiles(userId: string): Promise<number> {
  try {
    const folders: Array<'original' | 'compressed' | 'blurred'> = ['original', 'compressed', 'blurred'];
    let totalDeleted = 0;

    for (const folder of folders) {
      const prefix = `profiles/${userId}/${folder}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      });

      const response = await s3Client.send(listCommand);
      const items = response.Contents || [];

      // Delete each file
      for (const item of items) {
        if (item.Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: item.Key,
          });
          await s3Client.send(deleteCommand);
          totalDeleted++;
        }
      }
    }

    return totalDeleted;
  } catch (error) {
    console.error('Error deleting all user files:', error);
    throw error;
  }
}
