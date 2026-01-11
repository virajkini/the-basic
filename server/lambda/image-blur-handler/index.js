import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { type } from 'os';
import sharp from 'sharp';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BLUR_SIGMA = 12;

// Compression config for serving optimized images
const COMPRESSION_CONFIG = {
  maxWidth: 800,
  quality: 80,
};

/**
 * Check if file is a valid image based on extension
 */
function isImageFile(key) {
  const lowerKey = key.toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => lowerKey.endsWith(ext));
}

/**
 * Extract userId from S3 key
 * Expected format: profiles/{userId}/original/{filename}
 */
function extractUserId(key) {
  const parts = key.split('/');
  if (parts.length >= 3 && parts[0] === 'profiles' && parts[2] === 'original') {
    return parts[1];
  }
  return null;
}

/**
 * Get the first (primary) image in user's original folder
 * Sorted alphabetically - first image is the primary one
 */
async function getFirstImageInFolder(userId) {
  const prefix = `profiles/${userId}/original/`;

  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  }));

  if (!response.Contents || response.Contents.length === 0) {
    return null;
  }

  // Filter for image files only, exclude folder prefix itself
  const images = response.Contents
    .filter(obj => obj.Key && obj.Key !== prefix && obj.Size > 0 && isImageFile(obj.Key))
    .sort((a, b) => a.Key.localeCompare(b.Key));

  return images.length > 0 ? images[0] : null;
}

/**
 * Check if blurred version exists for a given user
 */
async function getBlurredImages(userId) {
  const prefix = `profiles/${userId}/blurred/`;

  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  }));

  if (!response.Contents) {
    return [];
  }

  return response.Contents
    .filter(obj => obj.Key && obj.Key !== prefix && obj.Size > 0)
    .map(obj => obj.Key);
}

/**
 * Check if compressed version exists for a given original key
 */
async function compressedVersionExists(userId, filename) {
  const compressedKey = `profiles/${userId}/compressed/${filename.replace(/\.[^.]+$/, '.webp')}`;

  try {
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: compressedKey,
      MaxKeys: 1,
    }));

    return response.Contents && response.Contents.length > 0;
  } catch {
    return false;
  }
}

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Compress an image to WebP format
 */
async function compressImage(buffer) {
  return sharp(buffer)
    .resize(COMPRESSION_CONFIG.maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({
      quality: COMPRESSION_CONFIG.quality,
    })
    .toBuffer();
}

/**
 * Blur an image
 */
async function blurImage(buffer) {
  return sharp(buffer)
    .blur(BLUR_SIGMA)
    .toBuffer();
}

/**
 * Lambda handler - processes images uploaded to original folder
 * 1. Creates compressed WebP version for ALL images → compressed/ folder
 * 2. Creates blurred version for FIRST image only → blurred/ folder
 *
 * Triggered by S3 PUT events in profiles/{userId}/original/ path
 */
export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    try {
      // Only process PUT events
      if (!record.eventName?.startsWith('ObjectCreated')) {
        console.log(`Skipping event: ${record.eventName}`);
        results.push({ skipped: true, reason: 'not_create_event' });
        continue;
      }

      const sourceKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const bucket = record.s3.bucket.name;

      console.log(`Processing trigger for: ${sourceKey}`);

      // SAFETY: Skip if triggered by blurred folder (prevent infinite loop)
      if (sourceKey.includes('/blurred/')) {
        console.log(`[SKIP] Ignoring blurred folder trigger: ${sourceKey}`);
        results.push({ skipped: true, reason: 'blurred_folder_trigger' });
        continue;
      }

      // SAFETY: Skip if triggered by compressed folder (prevent infinite loop)
      if (sourceKey.includes('/compressed/')) {
        console.log(`[SKIP] Ignoring compressed folder trigger: ${sourceKey}`);
        results.push({ skipped: true, reason: 'compressed_folder_trigger' });
        continue;
      }

      // Only process files in original folder
      if (!sourceKey.includes('/original/')) {
        console.log(`[SKIP] Not in original folder: ${sourceKey}`);
        results.push({ skipped: true, reason: 'not_original_folder' });
        continue;
      }

      // Validate it's an image file
      if (!isImageFile(sourceKey)) {
        console.log(`[SKIP] Not an image file: ${sourceKey}`);
        results.push({ skipped: true, reason: 'not_image_file' });
        continue;
      }

      // Extract userId from path
      const userId = extractUserId(sourceKey);
      if (!userId) {
        console.log(`[SKIP] Invalid path structure: ${sourceKey}`);
        results.push({ skipped: true, reason: 'invalid_path' });
        continue;
      }

      const filename = sourceKey.split('/').pop();
      console.log(`User ID: ${userId}, File: ${filename}`);

      // Download the uploaded image
      console.log(`Downloading: ${sourceKey}`);
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: sourceKey,
      }));

      // Check file size
      const fileSize = getResponse.ContentLength || 0;
      if (fileSize > MAX_FILE_SIZE) {
        console.log(`[SKIP] File too large: ${fileSize} bytes`);
        results.push({ skipped: true, reason: 'file_too_large', size: fileSize });
        continue;
      }

      if (fileSize === 0) {
        console.log(`[SKIP] Empty file`);
        results.push({ skipped: true, reason: 'empty_file' });
        continue;
      }

      // Convert to buffer
      const imageBuffer = await streamToBuffer(getResponse.Body);
      console.log(`Downloaded ${imageBuffer.length} bytes`);

      const recordResult = {
        sourceKey,
        compressed: false,
        blurred: false,
      };

      // === TASK 1: Create compressed WebP version ===
      const compressedExists = await compressedVersionExists(userId, filename);
      if (compressedExists) {
        console.log(`[SKIP COMPRESS] Compressed version already exists`);
      } else {
        console.log(`Compressing image to WebP...`);
        const compressedBuffer = await compressImage(imageBuffer);

        // Use .webp extension for compressed files
        const compressedFilename = filename.replace(/\.[^.]+$/, '.webp');
        const compressedKey = `profiles/${userId}/compressed/${compressedFilename}`;

        console.log(`Uploading compressed to: ${compressedKey} (${(compressedBuffer.length / 1024).toFixed(1)}KB)`);
        await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: compressedKey,
          Body: compressedBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        console.log(`✅ Created compressed image: ${compressedKey}`);
        recordResult.compressed = true;
        recordResult.compressedKey = compressedKey;
        recordResult.compressedSize = compressedBuffer.length;
      }

      // === TASK 2: Create blurred version for FIRST image only ===
      const firstImage = await getFirstImageInFolder(userId);
      const isFirstImage = firstImage && firstImage.Key === sourceKey;

      if (!isFirstImage) {
        console.log(`[SKIP BLUR] Not the first image in folder`);
      } else {
        const blurredImages = await getBlurredImages(userId);
        if (blurredImages.length > 0) {
          console.log(`[SKIP BLUR] Blurred image already exists: ${blurredImages[0]}`);
        } else {
          console.log(`Blurring first image with sigma: ${BLUR_SIGMA}`);
          const blurredBuffer = await blurImage(imageBuffer);

          const blurredKey = `profiles/${userId}/blurred/${filename}`;

          console.log(`Uploading blurred to: ${blurredKey}`);
          await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: blurredKey,
            Body: blurredBuffer,
            ContentType: getResponse.ContentType || 'image/jpeg',
            CacheControl: 'public, max-age=31536000, immutable',
          }));

          console.log(`✅ Created blurred image: ${blurredKey}`);
          recordResult.blurred = true;
          recordResult.blurredKey = blurredKey;
        }
      }

      recordResult.success = recordResult.compressed || recordResult.blurred;
      results.push(recordResult);

    } catch (error) {
      console.error(`[ERROR] Failed to process record:`, error);
      results.push({
        error: true,
        message: error.message,
      });
    }
  }

  const successful = results.filter(r => r.success);
  const skipped = results.filter(r => r.skipped);
  const errors = results.filter(r => r.error);

  console.log(`\n=== Summary ===`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Errors: ${errors.length}`);

  return {
    statusCode: errors.length > 0 ? 500 : 200,
    body: JSON.stringify({
      message: 'Processing complete',
      successful: successful.length,
      skipped: skipped.length,
      errors: errors.length,
      results,
    }),
  };
};
