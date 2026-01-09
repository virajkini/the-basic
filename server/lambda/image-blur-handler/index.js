import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BLUR_SIGMA = 12;

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
 * Check if blurred version exists for a given original key
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
 * Lambda handler - blurs only the FIRST/PRIMARY image in user's folder
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

      // Only process files in original folder
      if (!sourceKey.includes('/original/')) {
        console.log(`[SKIP] Not in original folder: ${sourceKey}`);
        results.push({ skipped: true, reason: 'not_original_folder' });
        continue;
      }

      // Extract userId from path
      const userId = extractUserId(sourceKey);
      if (!userId) {
        console.log(`[SKIP] Invalid path structure: ${sourceKey}`);
        results.push({ skipped: true, reason: 'invalid_path' });
        continue;
      }

      console.log(`User ID: ${userId}`);

      // Get the first/primary image in the folder
      const firstImage = await getFirstImageInFolder(userId);
      if (!firstImage) {
        console.log(`[SKIP] No images found in folder for user: ${userId}`);
        results.push({ skipped: true, reason: 'no_images_in_folder' });
        continue;
      }

      console.log(`First/Primary image: ${firstImage.Key}`);

      // Check if we already have ANY blurred image for this user
      const blurredImages = await getBlurredImages(userId);
      if (blurredImages.length > 0) {
        console.log(`[SKIP] Blurred image already exists: ${blurredImages[0]}`);
        results.push({ skipped: true, reason: 'blurred_already_exists', existing: blurredImages[0] });
        continue;
      }

      // Download the first image
      console.log(`Downloading: ${firstImage.Key}`);
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: firstImage.Key,
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

      // Blur the image using sharp
      console.log(`Blurring image with sigma: ${BLUR_SIGMA}`);
      const blurredBuffer = await sharp(imageBuffer)
        .blur(BLUR_SIGMA)
        .toBuffer();

      console.log(`Blurred image size: ${blurredBuffer.length} bytes`);

      // Construct blurred key - use same filename
      const filename = firstImage.Key.split('/').pop();
      const blurredKey = `profiles/${userId}/blurred/${filename}`;

      // Upload blurred image
      console.log(`Uploading to: ${blurredKey}`);
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: blurredKey,
        Body: blurredBuffer,
        ContentType: getResponse.ContentType || 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      console.log(`✅ Successfully created blurred image: ${blurredKey}`);
      results.push({
        success: true,
        sourceKey: firstImage.Key,
        blurredKey,
        size: blurredBuffer.length,
      });

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
