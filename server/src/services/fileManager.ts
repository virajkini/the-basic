import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'static.amgeljodi.com';
const CLOUDFRONT_KEY_PAIR_ID = 'K16SCVGULKTB9O';
const CLOUDFRONT_PRIVATE_KEY = (process.env.CLOUD_FRONT_KEY || '').replace(/\\n/g, '\n');

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

// Helper function to generate CloudFront URL
function getCloudFrontUrl(key: string): string {
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
  return `https://${CLOUDFRONT_DOMAIN}/${encodedKey}`;
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
  fileTypes?: string[]
): Promise<Array<{ url: string; key: string }>> {
  try {
    // Check existing file count
    const existingCount = await getFileCount(userId);
    
    // Validate that adding count won't exceed 5
    if (existingCount + count > 5) {
      const available = 5 - existingCount;
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
 * @returns Array of file objects with signed CloudFront URLs
 */
export async function getUserProfileImages(userId: string): Promise<Array<{
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

        // Generate signed CloudFront URL for original images
        const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${item.Key}`;
        const signedUrl = getCloudFrontSignedUrl({
          url: cloudFrontUrl,
          keyPairId: CLOUDFRONT_KEY_PAIR_ID,
          privateKey: CLOUDFRONT_PRIVATE_KEY,
          dateLessThan: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        });

        return {
          key: item.Key,
          url: signedUrl,
          size: item.Size,
          lastModified: item.LastModified,
        };
      })
      .filter((file): file is NonNullable<typeof file> => file !== null);

    return files;
  } catch (error) {
    console.error('Error getting user profile images:', error);
    throw error;
  }
}

/**
 * Get profile images for another user based on viewer's verified status
 * @param targetUserId - User ID of the profile being viewed
 * @param viewerIsVerified - Whether the viewing user is verified
 * @returns Array of file objects with appropriate URLs
 *          - Verified viewers: All compressed images (WebP) with signed URLs
 *          - Unverified viewers: Only first blurred image if it exists (public URL)
 */
export async function getOtherUserProfileImages(
  targetUserId: string,
  viewerIsVerified: boolean
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

        return originalItems.map((item) => {
          const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${item.Key}`;
          const signedUrl = getCloudFrontSignedUrl({
            url: cloudFrontUrl,
            keyPairId: CLOUDFRONT_KEY_PAIR_ID,
            privateKey: CLOUDFRONT_PRIVATE_KEY,
            dateLessThan: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          });

          return {
            key: item.Key!,
            url: signedUrl,
            size: item.Size,
            lastModified: item.LastModified,
          };
        });
      }

      return items.map((item) => {
        const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${item.Key}`;
        const signedUrl = getCloudFrontSignedUrl({
          url: cloudFrontUrl,
          keyPairId: CLOUDFRONT_KEY_PAIR_ID,
          privateKey: CLOUDFRONT_PRIVATE_KEY,
          dateLessThan: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });

        return {
          key: item.Key!,
          url: signedUrl,
          size: item.Size,
          lastModified: item.LastModified,
        };
      });
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

      const firstBlurred = blurredItems[0];
      return [{
        key: firstBlurred.Key!,
        url: `https://${CLOUDFRONT_DOMAIN}/${firstBlurred.Key}`,
        size: firstBlurred.Size,
        lastModified: firstBlurred.LastModified,
      }];
    }
  } catch (error) {
    console.error('Error getting other user profile images:', error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param key - S3 object key
 * @param userId - User ID (for verification)
 * @returns Success message
 */
export async function deleteFile(key: string, userId: string): Promise<void> {
  try {
    // Verify the file belongs to the user
    const expectedPrefix = `profiles/${userId}/original/`;
    if (!key.startsWith(expectedPrefix)) {
      throw new Error('Access denied: File does not belong to this user');
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

