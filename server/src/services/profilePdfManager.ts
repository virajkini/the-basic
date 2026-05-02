import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';

/**
 * Manages generated profile-bio-data PDFs on S3.
 *
 * Each user keeps up to {@link MAX_PROFILE_PDFS} PDFs at the prefix
 * `profiles/{userId}/profilePdf/`. The bucket and CloudFront configuration
 * mirror the photo flow in `fileManager.ts` so we reuse the same private
 * distribution + signer.
 */

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'static.amgeljodi.com';
const CLOUDFRONT_KEY_PAIR_ID = 'K16SCVGULKTB9O';
const CLOUDFRONT_PRIVATE_KEY = (process.env.CLOUD_FRONT_KEY || '').replace(/\\n/g, '\n');

/** Signed-URL TTL for PDF reads (10 minutes). Generous enough to download. */
const PDF_SIGNED_URL_TTL_MS = 10 * 60 * 1000;

export const MAX_PROFILE_PDFS = 5;

const s3ClientConfig: {
  region: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
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

function profilePdfPrefix(userId: string): string {
  return `profiles/${userId}/profilePdf/`;
}

function profilePhotoPrefix(userId: string): string {
  return `profiles/${userId}/original/`;
}

function signCloudFrontUrl(key: string): string {
  const url = `https://${CLOUDFRONT_DOMAIN}/${key}`;
  return getCloudFrontSignedUrl({
    url,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: new Date(Date.now() + PDF_SIGNED_URL_TTL_MS).toISOString(),
  });
}

export interface ProfilePdfItem {
  key: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string; // ISO
  signedUrl: string;
}

/**
 * Slugify a string into an ASCII filename-safe token.
 * Falls back to `profile` if input is empty after slugification.
 */
function slug(input: string | undefined, max = 24): string {
  const s = (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
  return s || 'profile';
}

/**
 * Short, sortable id derived from the current millisecond clock.
 * Keeps filenames short while remaining effectively unique within a user folder.
 */
function shortId(): string {
  const base36 = Date.now().toString(36); // ~8 chars
  const rand = Math.random().toString(36).slice(2, 5);
  return `${base36.slice(-6)}${rand}`;
}

export async function countProfilePdfs(userId: string): Promise<number> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: profilePdfPrefix(userId),
  });
  const response = await s3Client.send(command);
  return (response.Contents || []).filter(
    (item) => item.Key && item.Size && item.Size > 0
  ).length;
}

export async function listProfilePdfs(userId: string): Promise<ProfilePdfItem[]> {
  const prefix = profilePdfPrefix(userId);
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });
  const response = await s3Client.send(command);

  const items = (response.Contents || [])
    .filter((item) => item.Key && item.Key !== prefix && item.Size && item.Size > 0)
    .map((item) => ({
      key: item.Key!,
      fileName: item.Key!.slice(prefix.length),
      sizeBytes: item.Size || 0,
      createdAt: (item.LastModified || new Date()).toISOString(),
      signedUrl: signCloudFrontUrl(item.Key!),
    }));

  // Newest first.
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items;
}

export async function uploadProfilePdf(
  userId: string,
  firstName: string | undefined,
  pdf: Buffer
): Promise<ProfilePdfItem> {
  const ts = new Date();
  const safeFirst = slug(firstName, 24);
  const id = shortId();
  const tsTag = ts.toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2025-01-01T12-00-00
  const fileName = `${safeFirst}-${id}-${tsTag}.pdf`;
  const key = `${profilePdfPrefix(userId)}${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: pdf,
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="${fileName}"`,
      CacheControl: 'private, max-age=300',
    })
  );

  return {
    key,
    fileName,
    sizeBytes: pdf.byteLength,
    createdAt: ts.toISOString(),
    signedUrl: signCloudFrontUrl(key),
  };
}

export async function deleteProfilePdf(userId: string, key: string): Promise<void> {
  const expectedPrefix = profilePdfPrefix(userId);
  if (!key.startsWith(expectedPrefix)) {
    throw new Error('Access denied: File does not belong to this user');
  }
  // Defence-in-depth: forbid traversal sequences in the key.
  if (key.includes('..')) {
    throw new Error('Access denied: invalid key');
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Fetch up to `limit` raw photo bytes for the user, with `primaryPhotoKey` first
 * if it exists in the listing. Used by the renderer to embed images on the
 * cover and gallery pages. Errors per-image are swallowed so a single corrupt
 * photo cannot break PDF generation.
 */
export async function fetchProfilePhotoBuffers(
  userId: string,
  primaryPhotoKey?: string | null,
  limit = 5
): Promise<Buffer[]> {
  const prefix = profilePhotoPrefix(userId);
  const list = await s3Client.send(
    new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix })
  );
  const keys = (list.Contents || [])
    .filter((item) => item.Key && item.Key !== prefix && item.Size && item.Size > 0)
    .map((item) => item.Key!)
    .sort();

  const ordered = (() => {
    if (!primaryPhotoKey) return keys;
    const idx = keys.indexOf(primaryPhotoKey);
    if (idx <= 0) return keys;
    const copy = keys.slice();
    const [primary] = copy.splice(idx, 1);
    return [primary, ...copy];
  })().slice(0, limit);

  const buffers: Buffer[] = [];
  for (const key of ordered) {
    try {
      const obj = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      );
      const body = obj.Body;
      if (!body) continue;
      // AWS SDK v3 stream -> Buffer. `transformToByteArray` is provided by the
      // node body mixin in v3 and is the documented way to materialise bytes.
      const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> })
        .transformToByteArray();
      buffers.push(Buffer.from(bytes));
    } catch (err) {
      console.warn(`[profilePdfManager] skipping unreadable photo ${key}:`, err);
    }
  }
  return buffers;
}
