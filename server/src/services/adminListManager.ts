import { Filter } from 'mongodb';
import { getDatabase } from '../db/mongodb.js';
import { User } from '../models/user.js';
import {
  Profile,
  VerificationStatus,
  VERIFICATION_STATUSES,
  resolveVerificationStatus,
} from '../models/profile.js';
import { countUnseenIncomingRequestsSince } from './connectionManager.js';

export const ADMIN_PAGE_SIZE_DEFAULT = 20;
export const ADMIN_PAGE_SIZE_MAX = 100;

export type StatusCounts = Partial<Record<VerificationStatus, number>>;

export type AdminProfileListRow = {
  userId: string;
  phone: string | null;
  email: string | null;
  name: string;
  gender: string | null;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  isSubscribed: boolean;
  hasFcmToken: boolean;
  createdAt: Date;
};

export type AdminUserListRow = {
  userId: string;
  phone: string | null;
  email: string | null;
  authProvider: 'phone' | 'google';
  userCreatedAt: Date;
  hasProfile: boolean;
  name: string | null;
  isVerified: boolean;
  verificationStatus: VerificationStatus | null;
  isSubscribed: boolean;
  profileCreatedAt: Date | null;
  profileUpdatedAt: Date | null;
  profileLastActive: Date | null;
  unseenConnectionRequests: number;
};

export type Page<T> = { rows: T[]; hasMore: boolean; total: number };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsRegex(q: string) {
  return { $regex: escapeRegex(q), $options: 'i' };
}

function profileName(p: Profile): string | null {
  return p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || null;
}

/**
 * Mongo filter for a status. Profiles created before the backfill have no verificationStatus,
 * so 'verified' / 'pending' also match on the legacy boolean — same rule as resolveVerificationStatus().
 */
function verificationStatusFilter(status: VerificationStatus): Filter<Profile> {
  if (status === 'verified') {
    return { $or: [{ verificationStatus: 'verified' }, { verificationStatus: { $exists: false }, verified: true }] };
  }
  if (status === 'pending') {
    return { $or: [{ verificationStatus: 'pending' }, { verificationStatus: { $exists: false }, verified: { $ne: true } }] };
  }
  return { verificationStatus: status };
}

/** Profile count per verification status, across all profiles (drives the admin filter chips). */
export async function getVerificationStatusCounts(): Promise<{ counts: StatusCounts; total: number }> {
  const db = await getDatabase();
  const rows = await db
    .collection<Profile>('profiles')
    .aggregate<{ _id: string; count: number }>([
      {
        $group: {
          _id: {
            $ifNull: ['$verificationStatus', { $cond: [{ $eq: ['$verified', true] }, 'verified', 'pending'] }],
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const counts: StatusCounts = {};
  let total = 0;
  for (const r of rows) {
    total += r.count;
    if ((VERIFICATION_STATUSES as readonly string[]).includes(r._id)) {
      counts[r._id as VerificationStatus] = r.count;
    }
  }
  return { counts, total };
}

export async function countAllUsers(): Promise<number> {
  const db = await getDatabase();
  return db.collection<User>('users').countDocuments({});
}

/**
 * Admin Profiles tab: newest profiles first, filtered by status and a search over
 * name / user id (profile) and phone / email (users collection).
 */
export async function listAdminProfilesPage(opts: {
  limit: number;
  skip: number;
  status?: VerificationStatus;
  q?: string;
}): Promise<Page<AdminProfileListRow>> {
  const db = await getDatabase();
  const profilesCol = db.collection<Profile>('profiles');
  const usersCol = db.collection<User>('users');

  const and: Filter<Profile>[] = [];
  if (opts.status) and.push(verificationStatusFilter(opts.status));

  const q = opts.q?.trim();
  if (q) {
    const rx = containsRegex(q);
    const matchingUsers = await usersCol
      .find({ $or: [{ phone: rx }, { email: rx }] }, { projection: { _id: 1 } })
      .toArray();
    and.push({
      $or: [
        { firstName: rx },
        { lastName: rx },
        { name: rx },
        { _id: rx },
        { _id: { $in: matchingUsers.map((u) => u._id) } },
      ],
    });
  }

  const filter: Filter<Profile> = and.length ? { $and: and } : {};

  const [profiles, total] = await Promise.all([
    profilesCol.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit + 1).toArray(),
    profilesCol.countDocuments(filter),
  ]);

  const hasMore = profiles.length > opts.limit;
  const page = profiles.slice(0, opts.limit);

  const users = page.length
    ? await usersCol.find({ _id: { $in: page.map((p) => p._id) } }).toArray()
    : [];
  const userById = new Map(users.map((u) => [u._id, u]));

  return {
    hasMore,
    total,
    rows: page.map((profile) => {
      const user = userById.get(profile._id);
      return {
        userId: profile._id,
        phone: user?.phone ?? null,
        email: user?.email ?? null,
        name: profileName(profile) ?? 'N/A',
        gender: profile.gender || null,
        isVerified: profile.verified ?? false,
        verificationStatus: resolveVerificationStatus(profile),
        isSubscribed: profile.subscribed ?? false,
        hasFcmToken: !!profile.fcmToken,
        createdAt: profile.createdAt,
      };
    }),
  };
}

/**
 * Admin Onboarding tab: newest users first, with profile summary.
 * Sorting by unseen connection requests needs the count for every matching user,
 * so that mode loads all matches, sorts, then slices the page.
 */
export async function listAdminUsersPage(opts: {
  limit: number;
  skip: number;
  status?: VerificationStatus;
  q?: string;
  unseenSort?: 'asc' | 'desc';
}): Promise<Page<AdminUserListRow>> {
  const db = await getDatabase();
  const usersCol = db.collection<User>('users');
  const profilesCol = db.collection<Profile>('profiles');

  const and: Filter<User>[] = [];
  const q = opts.q?.trim();
  if (q) {
    const rx = containsRegex(q);
    and.push({ $or: [{ phone: rx }, { email: rx }, { _id: rx }] });
  }
  if (opts.status) {
    const ids = await profilesCol
      .find(verificationStatusFilter(opts.status), { projection: { _id: 1 } })
      .toArray();
    and.push({ _id: { $in: ids.map((p) => p._id) } });
  }
  const filter: Filter<User> = and.length ? { $and: and } : {};

  const total = await usersCol.countDocuments(filter);
  let cursor = usersCol.find(filter).sort({ createdAt: -1 });
  if (!opts.unseenSort) cursor = cursor.skip(opts.skip).limit(opts.limit + 1);
  const users = await cursor.toArray();

  const profiles = users.length
    ? await profilesCol.find({ _id: { $in: users.map((u) => u._id) } }).toArray()
    : [];
  const profileById = new Map(profiles.map((p) => [p._id, p]));

  const sinceByUser = new Map<string, Date>();
  for (const u of users) {
    const p = profileById.get(u._id);
    sinceByUser.set(u._id, p?.lastActive ?? p?.updatedAt ?? u.createdAt);
  }
  const unseenCounts = await countUnseenIncomingRequestsSince(sinceByUser);

  let rows: AdminUserListRow[] = users.map((u) => {
    const p = profileById.get(u._id);
    return {
      userId: u._id,
      phone: u.phone ?? null,
      email: u.email ?? null,
      authProvider: u.authProvider,
      userCreatedAt: u.createdAt,
      hasProfile: !!p,
      name: p ? profileName(p) : null,
      isVerified: p?.verified ?? false,
      verificationStatus: p ? resolveVerificationStatus(p) : null,
      isSubscribed: p?.subscribed ?? false,
      profileCreatedAt: p?.createdAt ?? null,
      profileUpdatedAt: p?.updatedAt ?? null,
      profileLastActive: p?.lastActive ?? null,
      unseenConnectionRequests: unseenCounts.get(u._id) ?? 0,
    };
  });

  if (opts.unseenSort) {
    const dir = opts.unseenSort === 'asc' ? 1 : -1;
    // Array.prototype.sort is stable, so ties keep newest-first order
    rows = rows
      .sort((a, b) => (a.unseenConnectionRequests - b.unseenConnectionRequests) * dir)
      .slice(opts.skip, opts.skip + opts.limit + 1);
  }

  return { rows: rows.slice(0, opts.limit), hasMore: rows.length > opts.limit, total };
}
