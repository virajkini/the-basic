/**
 * Lists all profiles that have no photoKeys field.
 * Run: tsx scripts/listMissingPhotoKeys.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { MONGODB_DB_NAME, APP_ENV } from '../src/config/appEnv.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI required'); process.exit(1); }

const client = new MongoClient(MONGODB_URI);
await client.connect();
const profiles = client.db(MONGODB_DB_NAME).collection('profiles');

console.log(`DB: ${MONGODB_DB_NAME} (APP_ENV=${APP_ENV})\n`);

const missing = await profiles
  .find(
    { photoKeys: { $exists: false } },
    { projection: { _id: 1, firstName: 1, lastName: 1, verified: 1, createdAt: 1, primaryPhotoKey: 1 } }
  )
  .sort({ createdAt: -1 })
  .toArray();

console.log(`Profiles without photoKeys: ${missing.length}\n`);
for (const p of missing) {
  console.log(`  ${String(p._id).padEnd(36)}  ${(p.firstName ?? '?')} ${(p.lastName ?? '')}  verified=${p.verified}  primaryPhotoKey=${p.primaryPhotoKey ?? 'none'}`);
}

await client.close();
