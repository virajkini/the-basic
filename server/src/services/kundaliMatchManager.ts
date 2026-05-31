import { getDatabase } from '../db/mongodb.js';
import { Profile } from '../models/profile.js';
import {
  KundaliMatch,
  DashakootApiResponse,
  KUNDALI_MATCHES_COLLECTION,
} from '../models/kundaliMatch.js';
import { generateSummary, getTier } from './kundaliSummaryEngine.js';

const DASHAKOOT_API_URL = 'https://json.astrologyapi.com/v1/match_dashakoot_points';

interface GeoResult {
  latitude: number;
  longitude: number;
  timezone_offset: number;
}

interface BirthData {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

export class MissingBirthDataError extends Error {
  constructor(public readonly missingFor: 'self' | 'target' | 'both') {
    super(`Missing birth data for: ${missingFor}`);
    this.name = 'MissingBirthDataError';
  }
}

async function fetchGeoDetails(location: string): Promise<GeoResult> {
  const apiKey = process.env.GEO_LOCATION_API_KEY;
  if (!apiKey) throw new Error('GEO_LOCATION_API_KEY not configured');



  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&limit=1&apiKey=${apiKey}`;

  console.log(`Fetching geo details for location: "${location}" from URL: ${url}`);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Geo API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as {
    features?: Array<{
      properties: {
        lat: number;
        lon: number;
        timezone?: { offset_STD_seconds?: number };
      };
    }>;
  };

  const props = data?.features?.[0]?.properties;
  if (!props?.lat || !props?.lon) {
    throw new Error(`No geo results found for location: "${location}"`);
  }

  return {
    latitude: props.lat,
    longitude: props.lon,
    timezone_offset: (props.timezone?.offset_STD_seconds ?? 19800) / 3600,
  };
}

function parseDob(dob: string): { day: number; month: number; year: number } {
  const [year, month, day] = dob.split('-').map(Number);
  return { day, month, year };
}

function parseBirthTime(birthTiming: string): { hour: number; min: number } {
  const [hour, min] = birthTiming.split(':').map(Number);
  return { hour, min };
}

async function buildBirthData(profile: Profile): Promise<BirthData> {
  const { day, month, year } = parseDob(profile.dob);
  const { hour, min } = parseBirthTime(profile.birthTiming!);
  const geo = await fetchGeoDetails(profile.placeOfBirth!);
  return {
    day, month, year, hour, min,
    lat: geo.latitude,
    lon: geo.longitude,
    tzone: geo.timezone_offset,
  };
}

async function fetchDashakootPoints(
  maleData: BirthData,
  femaleData: BirthData,
): Promise<DashakootApiResponse> {
  const apiKey = process.env.ASTRO_API_KEY;
  if (!apiKey) throw new Error('ASTRO_API_KEY not configured');

  const payload = {
    m_day: maleData.day,
    m_month: maleData.month,
    m_year: maleData.year,
    m_hour: maleData.hour,
    m_min: maleData.min,
    m_lat: maleData.lat,
    m_lon: maleData.lon,
    m_tzone: maleData.tzone,
    f_day: femaleData.day,
    f_month: femaleData.month,
    f_year: femaleData.year,
    f_hour: femaleData.hour,
    f_min: femaleData.min,
    f_lat: femaleData.lat,
    f_lon: femaleData.lon,
    f_tzone: femaleData.tzone,
  };

  const res = await fetch(DASHAKOOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-astrologyapi-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Astrology API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<DashakootApiResponse>;
}

function hasBirthData(profile: Profile): boolean {
  return !!(profile.placeOfBirth?.trim() && profile.birthTiming?.trim() && profile.dob);
}

export async function getOrCreateKundaliMatch(
  requestingUserId: string,
  targetUserId: string,
): Promise<KundaliMatch> {
  if (requestingUserId === targetUserId) {
    throw new Error('Cannot check compatibility with yourself');
  }

  const db = await getDatabase();
  const collection = db.collection<KundaliMatch>(KUNDALI_MATCHES_COLLECTION);
  const profiles = db.collection<Profile>('profiles');

  // Canonical ordering to avoid duplicate documents
  const [userAId, userBId] = [requestingUserId, targetUserId].sort();

  // Return cached result if it exists
  const existing = await collection.findOne({ userAId, userBId });
  if (existing) return existing;

  // Fetch both profiles in parallel
  const [reqProfile, tgtProfile] = await Promise.all([
    profiles.findOne({ _id: requestingUserId } as any),
    profiles.findOne({ _id: targetUserId } as any),
  ]);

  if (!reqProfile) throw new Error('Your profile was not found');
  if (!tgtProfile) throw new Error('Target profile was not found');

  const reqHas = hasBirthData(reqProfile);
  const tgtHas = hasBirthData(tgtProfile);

  if (!reqHas && !tgtHas) throw new MissingBirthDataError('both');
  if (!reqHas) throw new MissingBirthDataError('self');
  if (!tgtHas) throw new MissingBirthDataError('target');

  // Determine gender mapping for astrology API (m_ = male, f_ = female)
  const maleProfile = reqProfile.gender === 'M' ? reqProfile : tgtProfile;
  const femaleProfile = reqProfile.gender === 'F' ? reqProfile : tgtProfile;

  // Fetch geo data in parallel for both
  const [maleData, femaleData] = await Promise.all([
    buildBirthData(maleProfile),
    buildBirthData(femaleProfile),
  ]);

  const dashakootResult = await fetchDashakootPoints(maleData, femaleData);

  const received = dashakootResult.total.received_points;
  const tier = getTier(received);
  const summary = generateSummary(dashakootResult);

  const match: KundaliMatch = {
    userAId,
    userBId,
    maleUserId: maleProfile._id,
    femaleUserId: femaleProfile._id,
    dashakootResult,
    tier,
    receivedPoints: received,
    totalPoints: dashakootResult.total.total_points,
    summary,
    createdAt: new Date(),
  };

  await collection.insertOne(match as any);
  return match;
}
