/**
 * One-time migration: populate profile.photoKeys from S3 for all existing profiles.
 * Idempotent — profiles that already have photoKeys are skipped unless --force is passed.
 * Run: npm run migrate:photo-keys
 * Dry-run: DRY_RUN=1 npm run migrate:photo-keys
 */

import { MongoClient } from 'mongodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { MONGODB_DB_NAME, APP_ENV } from '../src/config/appEnv.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';
const DRY_RUN = process.env.DRY_RUN === '1';
const FORCE = process.argv.includes('--force');

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! }
    : undefined,
});

async function listOriginalKeys(userId: string): Promise<string[]> {
  const prefix = `profiles/${userId}/original/`;
  const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix }));
  return (res.Contents || [])
    .filter((item) => item.Key && item.Key !== prefix && item.Size && item.Size > 0)
    .map((item) => item.Key!)
    .sort();
}

async function run() {
  console.log(`[migrate:photo-keys] APP_ENV=${APP_ENV} DB=${MONGODB_DB_NAME} DRY_RUN=${DRY_RUN} FORCE=${FORCE}`);

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  const profiles = db.collection('profiles');

  const query = FORCE ? {} : { photoKeys: { $exists: false } };
  const total = await profiles.countDocuments(query);
  console.log(`[migrate:photo-keys] Profiles to process: ${total}`);

  let processed = 0;
  let skipped = 0;
  let noImages = 0;
  let errors = 0;

  const cursor = profiles.find(query, { projection: { _id: 1, primaryPhotoKey: 1 } });

  for await (const profile of cursor) {
    const userId = String(profile._id);
    try {
      const keys = await listOriginalKeys(userId);

      if (keys.length === 0) {
        noImages++;
        if (!DRY_RUN) {
          await profiles.updateOne({ _id: profile._id }, { $set: { photoKeys: [], updatedAt: new Date() } });
        }
        continue;
      }

      // Sort with primaryPhotoKey first
      const primary = profile.primaryPhotoKey as string | null | undefined;
      let ordered = [...keys];
      if (primary && ordered.includes(primary)) {
        ordered = [primary, ...ordered.filter((k) => k !== primary)];
      }

      if (DRY_RUN) {
        console.log(`  [dry] ${userId} → ${ordered.length} keys`);
      } else {
        await profiles.updateOne({ _id: profile._id }, { $set: { photoKeys: ordered, updatedAt: new Date() } });
      }
      processed++;
    } catch (err) {
      console.error(`  [error] ${userId}:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  await client.close();

  console.log(`\n[migrate:photo-keys] Done.`);
  console.log(`  Migrated:  ${processed}`);
  console.log(`  No images: ${noImages}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Skipped (already had photoKeys): ${skipped}`);
}

run().catch((err) => {
  console.error('[migrate:photo-keys] Fatal:', err);
  process.exit(1);
});
