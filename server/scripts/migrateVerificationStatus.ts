/**
 * One-time migration: backfill profile.verificationStatus from the legacy `verified` boolean.
 *
 *   verified === true              → verificationStatus: 'verified'
 *   anything else (false/missing)  → verificationStatus: 'pending'
 *
 * Safety:
 *   - DRY RUN by default. Nothing is written unless --apply is passed.
 *   - --apply also requires --db=<database name> matching the resolved target DB,
 *     so the script can never write to an unexpected database.
 *   - Idempotent: only profiles WITHOUT a verificationStatus are touched. Safe to re-run
 *     (e.g. to catch profiles created between migration and deploy).
 *   - The `verified` field is never modified or removed.
 *   - `updatedAt` is intentionally NOT bumped, so "recently updated" sorting is unaffected.
 *
 * Run:
 *   Dry run (stage): npm run migrate:verification-status:stage
 *   Apply   (stage): npm run migrate:verification-status:stage -- --apply --db=amgeljodi_stage
 *   Dry run (prod):  npm run migrate:verification-status
 *   Apply   (prod):  npm run migrate:verification-status -- --apply --db=amgeljodi
 */

// Must be the first import so APP_ENV / MONGODB_DB_NAME from .env are visible to appEnv.ts
// (same as src/index.ts — the script resolves the exact DB the server would use).
import 'dotenv/config';
import { MongoClient, Collection } from 'mongodb';
import { MONGODB_DB_NAME, APP_ENV } from '../src/config/appEnv.js';

const TAG = '[migrate:verification-status]';
const MONGODB_URI = process.env.MONGODB_URI;
const APPLY = process.argv.includes('--apply');
const CONFIRM_DB = process.argv.find((a) => a.startsWith('--db='))?.slice('--db='.length);

const VERIFICATION_STATUSES = [
  'pending',
  'not_reachable',
  'callback',
  'verified',
  'invalid',
  'not_gsb',
  'got_married',
  'on_hold',
] as const;

if (!MONGODB_URI) {
  console.error(`${TAG} MONGODB_URI environment variable is required`);
  process.exit(1);
}

if (APPLY && CONFIRM_DB !== MONGODB_DB_NAME) {
  console.error(
    `${TAG} Refusing to write: target DB is "${MONGODB_DB_NAME}" but --db=${CONFIRM_DB ?? '<missing>'}.\n` +
      `${TAG} Re-run with --apply --db=${MONGODB_DB_NAME} if this is the intended database.`
  );
  process.exit(1);
}

const MISSING = { verificationStatus: { $exists: false } };

async function printReport(profiles: Collection, label: string) {
  const total = await profiles.countDocuments({});
  const missing = await profiles.countDocuments(MISSING);
  const byStatus = await profiles
    .aggregate<{ _id: unknown; count: number }>([
      { $match: { verificationStatus: { $exists: true } } },
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  const unknownStatus = await profiles.countDocuments({
    verificationStatus: { $exists: true, $nin: [...VERIFICATION_STATUSES] },
  });
  // Consistency: verified must be true iff status is 'verified'
  const verifiedButNotStatus = await profiles.countDocuments({
    verified: true,
    verificationStatus: { $exists: true, $ne: 'verified' },
  });
  const statusButNotVerified = await profiles.countDocuments({
    verificationStatus: 'verified',
    verified: { $ne: true },
  });

  console.log(`\n${TAG} ---- ${label} ----`);
  console.log(`  Total profiles:                 ${total}`);
  console.log(`  Without verificationStatus:     ${missing}`);
  console.log(`  By verificationStatus:`);
  if (byStatus.length === 0) console.log(`    (none)`);
  for (const row of byStatus) console.log(`    ${String(row._id).padEnd(16)} ${row.count}`);
  console.log(`  Unknown status values:          ${unknownStatus}`);
  console.log(`  verified=true but status≠verified: ${verifiedButNotStatus}`);
  console.log(`  status=verified but verified≠true: ${statusButNotVerified}`);
}

async function run() {
  console.log(`${TAG} APP_ENV=${APP_ENV} DB=${MONGODB_DB_NAME} MODE=${APPLY ? 'APPLY' : 'DRY RUN'}`);

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();

  try {
    const profiles = client.db(MONGODB_DB_NAME).collection('profiles');

    await printReport(profiles, 'Before');

    const toVerifiedFilter = { ...MISSING, verified: true };
    const toPendingFilter = { ...MISSING, verified: { $ne: true } };

    const toVerified = await profiles.countDocuments(toVerifiedFilter);
    const toPending = await profiles.countDocuments(toPendingFilter);
    // Non-boolean `verified` values (e.g. "true" string) are treated as NOT verified — surface them.
    const oddVerified = await profiles.countDocuments({
      ...MISSING,
      verified: { $exists: true, $not: { $type: 'bool' } },
    });

    console.log(`\n${TAG} Plan:`);
    console.log(`  → 'verified': ${toVerified}`);
    console.log(`  → 'pending':  ${toPending}`);
    if (oddVerified > 0) {
      console.log(`  ⚠ ${oddVerified} profile(s) have a non-boolean 'verified' value; they will become 'pending'.`);
    }

    if (!APPLY) {
      console.log(`\n${TAG} Dry run — nothing written. To apply:`);
      console.log(`  ... -- --apply --db=${MONGODB_DB_NAME}`);
      return;
    }

    // Each updateMany re-checks the filter per document, so a profile whose `verified` flag is
    // toggled mid-run still lands in the correct bucket, and nothing is ever overwritten.
    const verifiedRes = await profiles.updateMany(toVerifiedFilter, {
      $set: { verificationStatus: 'verified' },
    });
    const pendingRes = await profiles.updateMany(toPendingFilter, {
      $set: { verificationStatus: 'pending' },
    });
    console.log(`\n${TAG} Updated → 'verified': ${verifiedRes.modifiedCount}`);
    console.log(`${TAG} Updated → 'pending':  ${pendingRes.modifiedCount}`);

    const indexName = await profiles.createIndex({ verificationStatus: 1 }, { name: 'verification_status' });
    console.log(`${TAG} Index ensured: ${indexName}`);

    await printReport(profiles, 'After');
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error(`${TAG} Fatal:`, err);
  process.exit(1);
});
