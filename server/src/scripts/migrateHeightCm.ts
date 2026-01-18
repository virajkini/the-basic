/**
 * Migration script to add heightCm field to all existing profiles
 * Run with: npx tsx src/scripts/migrateHeightCm.ts
 */

import { MongoClient } from 'mongodb';
import { parseHeightToCm } from '../models/profile.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'amgeljodi';

async function migrate() {
  console.log('Starting height migration...');
  console.log(`Connecting to MongoDB: ${MONGODB_URI}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('profiles');

    // Get all profiles
    const profiles = await collection.find({}).toArray();
    console.log(`Found ${profiles.length} profiles to process`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
      const profileId = profile._id;
      const height = profile.height;

      if (!height) {
        console.log(`  [SKIP] ${profileId}: No height field`);
        skipped++;
        continue;
      }

      if (profile.heightCm !== undefined) {
        console.log(`  [SKIP] ${profileId}: Already has heightCm (${profile.heightCm})`);
        skipped++;
        continue;
      }

      const heightCm = parseHeightToCm(height);

      if (heightCm === null) {
        console.log(`  [ERROR] ${profileId}: Could not parse height "${height}"`);
        errors++;
        continue;
      }

      await collection.updateOne(
        { _id: profileId },
        { $set: { heightCm } }
      );

      console.log(`  [OK] ${profileId}: "${height}" -> ${heightCm} cm`);
      updated++;
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total profiles: ${profiles.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Create index on heightCm for efficient sorting
    console.log('\nCreating index on heightCm...');
    await collection.createIndex({ heightCm: 1 });
    console.log('Index created successfully');

    // Also create indexes for other sort fields
    console.log('Creating indexes for sort fields...');
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ updatedAt: -1 });
    await collection.createIndex({ dob: 1 }); // For age sorting
    console.log('All indexes created successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nMigration complete!');
  }
}

migrate();
