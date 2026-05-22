import { MongoClient } from 'mongodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const MONGODB_URI = process.env.MONGODB_URI;
const APP_ENV = (process.env.APP_ENV || 'prod').trim().toLowerCase();
const MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME || (APP_ENV === 'stage' ? 'amgeljodi_stage' : 'amgeljodi');
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const WEIGHT_PHOTO = 0.35;
const WEIGHT_SOCIAL = 0.4;
const WEIGHT_RECENCY = 0.25;
const SOCIAL_SHORTLIST_WEIGHT = 0.6;
const SOCIAL_CONNECTION_WEIGHT = 0.4;
const RECENCY_DECAY = 0.1;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let mongoClient;

function photoScore(count) {
  const n = Math.min(Math.max(0, count), 5);
  if (n === 0) return 0;
  return n * 0.2;
}

function logScale(value, maxValue) {
  if (maxValue <= 0) return 0;
  return Math.log(1 + value) / Math.log(1 + maxValue);
}

function socialScore(shortlistCount, connectionCount, maxShortlist, maxConnection) {
  const maxS = Math.max(maxShortlist, 1);
  const maxC = Math.max(maxConnection, 1);
  const shortlistNorm = shortlistCount / maxS;
  const connectionNorm = connectionCount / maxC;
  const shortlistScaled = logScale(shortlistNorm, 1);
  const connectionScaled = logScale(connectionNorm, 1);
  return SOCIAL_SHORTLIST_WEIGHT * shortlistScaled + SOCIAL_CONNECTION_WEIGHT * connectionScaled;
}

function recencyScore(profile) {
  const raw = profile.lastActive ?? profile.updatedAt;
  if (!raw) return Math.exp(-RECENCY_DECAY * 365);

  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return Math.exp(-RECENCY_DECAY * 365);

  const days = Math.max(0, (Date.now() - date.getTime()) / MS_PER_DAY);
  return Math.exp(-RECENCY_DECAY * days);
}

function roundScore(n) {
  return Math.round(n * 10000) / 10000;
}

function extractUserIdFromS3Key(key) {
  const parts = key.split('/');
  if (parts.length >= 4 && parts[0] === 'profiles' && parts[2] === 'original') {
    const filename = parts[3];
    if (filename && !filename.endsWith('/')) return parts[1];
  }
  return null;
}

function createS3Client() {
  return new S3Client({ region: AWS_REGION });
}

async function getMongoClient() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

async function buildPhotoCountMap(s3) {
  const counts = new Map();
  let continuationToken;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: 'profiles/',
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of response.Contents || []) {
      const userId = extractUserIdFromS3Key(obj.Key);
      if (!userId) continue;
      counts.set(userId, (counts.get(userId) || 0) + 1);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return counts;
}

async function aggregateShortlistReceived(profilesCol) {
  const rows = await profilesCol
    .aggregate([
      { $match: { favoriteUserIds: { $exists: true, $type: 'array', $ne: [] } } },
      { $unwind: '$favoriteUserIds' },
      { $group: { _id: '$favoriteUserIds', count: { $sum: 1 } } },
    ])
    .toArray();

  return new Map(rows.map((r) => [String(r._id), r.count]));
}

async function aggregateConnectionsReceived(connectionsCol) {
  const rows = await connectionsCol
    .aggregate([{ $group: { _id: '$toUserId', count: { $sum: 1 } } }])
    .toArray();

  return new Map(rows.map((r) => [String(r._id), r.count]));
}

/**
 * Compute base_score for all profiles and persist via bulkWrite.
 * @returns {Promise<object>} Summary payload
 */
export async function computeBaseScores() {
  console.log('compute-base-score: starting');
  console.log(`  APP_ENV: ${APP_ENV}`);
  console.log(`  Database: ${MONGODB_DB_NAME}`);
  console.log(`  S3 bucket: ${S3_BUCKET_NAME}`);

  const client = await getMongoClient();
  const s3 = createS3Client();
  const db = client.db(MONGODB_DB_NAME);
  const profilesCol = db.collection('profiles');
  const connectionsCol = db.collection('connections');

  const [profiles, shortlistByUser, connectionByUser, photoByUser] = await Promise.all([
    profilesCol.find({}).project({ _id: 1, lastActive: 1, updatedAt: 1 }).toArray(),
    aggregateShortlistReceived(profilesCol),
    aggregateConnectionsReceived(connectionsCol),
    buildPhotoCountMap(s3),
  ]);

  let maxShortlist = 0;
  let maxConnection = 0;

  for (const profile of profiles) {
    const id = String(profile._id);
    const s = shortlistByUser.get(id) || 0;
    const c = connectionByUser.get(id) || 0;
    if (s > maxShortlist) maxShortlist = s;
    if (c > maxConnection) maxConnection = c;
  }

  console.log(`  Profiles: ${profiles.length}`);
  console.log(`  Max shortlists received: ${maxShortlist}`);
  console.log(`  Max connections received: ${maxConnection}`);

  const scoreComputedAt = new Date();
  const computedScores = [];
  const bulkOps = [];

  for (const profile of profiles) {
    const id = String(profile._id);
    const photoCount = photoByUser.get(id) || 0;
    const shortlistCount = shortlistByUser.get(id) || 0;
    const connectionCount = connectionByUser.get(id) || 0;

    const pPhoto = photoScore(photoCount);
    const pSocial = socialScore(shortlistCount, connectionCount, maxShortlist, maxConnection);
    const pRecency = recencyScore(profile);
    const baseScore = roundScore(
      WEIGHT_PHOTO * pPhoto + WEIGHT_SOCIAL * pSocial + WEIGHT_RECENCY * pRecency
    );

    computedScores.push(baseScore);
    bulkOps.push({
      updateOne: {
        filter: { _id: profile._id },
        update: {
          $set: {
            base_score: baseScore,
            score_computed_at: scoreComputedAt,
          },
        },
      },
    });
  }

  let bulkWrite = { matched: 0, modified: 0 };
  if (bulkOps.length > 0) {
    const result = await profilesCol.bulkWrite(bulkOps, { ordered: false });
    bulkWrite = { matched: result.matchedCount, modified: result.modifiedCount };
    console.log(`  bulkWrite: matched=${bulkWrite.matched} modified=${bulkWrite.modified}`);
  }

  const total = computedScores.length;
  const min = total ? Math.min(...computedScores) : 0;
  const max = total ? Math.max(...computedScores) : 0;
  const avg = total ? computedScores.reduce((a, b) => a + b, 0) / total : 0;

  const summary = {
    database: MONGODB_DB_NAME,
    appEnv: APP_ENV,
    totalProfiles: total,
    minBaseScore: roundScore(min),
    maxBaseScore: roundScore(max),
    averageBaseScore: roundScore(avg),
    scoreComputedAt: scoreComputedAt.toISOString(),
    bulkWrite,
  };

  console.log('\n--- Summary ---');
  console.log(`Total profiles processed: ${summary.totalProfiles}`);
  console.log(`Min base_score: ${summary.minBaseScore}`);
  console.log(`Max base_score: ${summary.maxBaseScore}`);
  console.log(`Average base_score: ${summary.averageBaseScore}`);
  console.log(`score_computed_at: ${summary.scoreComputedAt}`);

  return summary;
}

/** Lambda entry (EventBridge schedule, manual invoke, etc.) */
export async function handler(event, context) {
  try {
    const summary = await computeBaseScores();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, summary, event: event?.source ?? null }),
    };
  } catch (err) {
    console.error('compute-base-score failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
    };
  }
}
