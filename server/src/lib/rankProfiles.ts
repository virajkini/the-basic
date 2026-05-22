import type { Gender } from '../models/profile.js';

/**
 * Runtime discover ranking (pure function — no DB, no framework imports).
 *
 * For each candidate profile we compute:
 *
 *   final_score = min(1, base_score × match_factor × jitter)
 *
 * Viewer segment (from gender + age) selects:
 *   - ageWeight / heightWeight for match_factor blending
 *   - age sweet-spot range (years of preferred gap)
 *   - fixed cm height tiers OR proportional 10% band when viewer is "tall"
 *
 *   match_factor = ageWeight × age_score + heightWeight × height_score
 *                  OR age_score alone when heightCm is missing on either side
 *
 *   base_score   — precomputed quality (default 0.3 if absent)
 *   jitter       — × (1 + (random − 0.5) × 0.06)  → ±3%
 *
 * Age diff direction:
 *   Male viewer:   diff = viewer.age − profile.age  (positive = she is younger)
 *   Female viewer: diff = profile.age − viewer.age  (positive = he is older)
 *
 * Age curve (per segment sweet spot [min, max]):
 *   diff inside range → 1.00
 *   1 year outside    → 0.80
 *   each further year → −0.15 from 0.80, floor 0
 *
 * Height (heightCm only):
 *   Non-tall viewers: fixed cm tiers (heightScoreFemaleViewer / heightScoreMaleViewer)
 *   Tall viewers (M ≥185 cm, F ≥168 cm): proportional band = 10% of viewer height
 *
 * Segments:
 *   YOUNG_MALE  M 22–27 | PRIME_MALE  M 28–33 | MATURE_MALE  M 34+
 *   YOUNG_FEMALE F 21–25 | PRIME_FEMALE F 26–30 | MATURE_FEMALE F 31+
 *   Missing/invalid age → PRIME_MALE or PRIME_FEMALE by gender
 */

const DEFAULT_BASE_SCORE = 0.3;
const JITTER_FACTOR = 0.06;
const TALL_MALE_THRESHOLD_CM = 185;
const TALL_FEMALE_THRESHOLD_CM = 168;

type Segment =
  | 'YOUNG_MALE'
  | 'PRIME_MALE'
  | 'MATURE_MALE'
  | 'YOUNG_FEMALE'
  | 'PRIME_FEMALE'
  | 'MATURE_FEMALE';

interface WeightProfile {
  ageWeight: number;
  heightWeight: number;
}

interface AgeSweetSpot {
  min: number;
  max: number;
}

const SEGMENT_WEIGHTS: Record<Segment, WeightProfile> = {
  YOUNG_MALE: { ageWeight: 0.55, heightWeight: 0.45 },
  PRIME_MALE: { ageWeight: 0.6, heightWeight: 0.4 },
  MATURE_MALE: { ageWeight: 0.65, heightWeight: 0.35 },
  YOUNG_FEMALE: { ageWeight: 0.6, heightWeight: 0.4 },
  PRIME_FEMALE: { ageWeight: 0.55, heightWeight: 0.3 },
  MATURE_FEMALE: { ageWeight: 0.75, heightWeight: 0.25 },
};

const SEGMENT_AGE_SWEET_SPOT: Record<Segment, AgeSweetSpot> = {
  YOUNG_MALE: { min: 2, max: 4 },
  PRIME_MALE: { min: 1, max: 3 },
  MATURE_MALE: { min: 0, max: 3 },
  YOUNG_FEMALE: { min: 4, max: 8 },
  PRIME_FEMALE: { min: 2, max: 5 },
  MATURE_FEMALE: { min: 0, max: 3 },
};

export interface RankViewer {
  gender: Gender;
  age?: number | null;
  heightCm?: number | null;
}

export interface RankableProfile {
  age?: number | null;
  base_score?: number;
  heightCm?: number | null;
}

export type RankedProfile<T extends RankableProfile> = T & { final_score: number };

function toHeightCm(value: number | null | undefined): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  return null;
}

function isMaleSegment(segment: Segment): boolean {
  return segment.endsWith('_MALE');
}

function detectSegment(viewer: RankViewer): Segment {
  const age = viewer.age;
  const validAge = typeof age === 'number' && !Number.isNaN(age);

  if (viewer.gender === 'M') {
    if (!validAge || age < 22) return 'PRIME_MALE';
    if (age <= 27) return 'YOUNG_MALE';
    if (age <= 33) return 'PRIME_MALE';
    return 'MATURE_MALE';
  }

  if (!validAge || age < 21) return 'PRIME_FEMALE';
  if (age <= 25) return 'YOUNG_FEMALE';
  if (age <= 30) return 'PRIME_FEMALE';
  return 'MATURE_FEMALE';
}

function isTallViewer(viewer: RankViewer): boolean {
  if (viewer.heightCm == null) return false;
  if (viewer.gender === 'M') return viewer.heightCm >= TALL_MALE_THRESHOLD_CM;
  if (viewer.gender === 'F') return viewer.heightCm >= TALL_FEMALE_THRESHOLD_CM;
  return false;
}

function ageScoreFromSweetSpot(diff: number, sweet: AgeSweetSpot): number {
  if (diff >= sweet.min && diff <= sweet.max) return 1.0;

  const yearsOutside = diff < sweet.min ? sweet.min - diff : diff - sweet.max;

  if (yearsOutside === 1) return 0.8;
  return Math.max(0, 0.8 - (yearsOutside - 1) * 0.15);
}

function computeAgeScore(
  segment: Segment,
  viewerAge: number | null | undefined,
  profileAge: number | null | undefined
): number {
  if (
    viewerAge === null ||
    viewerAge === undefined ||
    profileAge === null ||
    profileAge === undefined ||
    Number.isNaN(viewerAge) ||
    Number.isNaN(profileAge)
  ) {
    return 0;
  }

  const diff = isMaleSegment(segment)
    ? viewerAge - profileAge
    : profileAge - viewerAge;

  return ageScoreFromSweetSpot(diff, SEGMENT_AGE_SWEET_SPOT[segment]);
}

function heightScoreFemaleViewer(diffCm: number): number {
  if (diffCm < 0) return 0.1;
  if (diffCm >= 15) return 0.75;
  if (diffCm >= 10) return 1.0;
  if (diffCm >= 8) return 0.8;
  if (diffCm >= 5) return 0.6;
  return 0.2;
}

function heightScoreMaleViewer(diffCm: number): number {
  if (diffCm < 0) return 0.15;
  if (diffCm >= 13) return 0.5;
  if (diffCm >= 8) return 0.8;
  if (diffCm >= 0 && diffCm <= 5) return 1.0;
  return 0.8;
}

function computeHeightScore(
  viewerGender: Gender,
  viewerHeightCm: number,
  profileHeightCm: number
): number {
  const diffCm =
    viewerGender === 'F'
      ? profileHeightCm - viewerHeightCm
      : viewerHeightCm - profileHeightCm;

  return viewerGender === 'F'
    ? heightScoreFemaleViewer(diffCm)
    : heightScoreMaleViewer(diffCm);
}

function heightScoreProportional(
  viewerGender: Gender,
  viewerHeightCm: number,
  profileHeightCm: number
): number {
  const band = viewerHeightCm * 0.1;

  if (viewerGender === 'F') {
    const diff = profileHeightCm - viewerHeightCm;
    if (diff < 0) return 0.1;
    if (diff <= band * 0.5) return 0.6;
    if (diff <= band) return 1.0;
    return Math.max(0.4, 1.0 - ((diff - band) / band) * 0.6);
  }

  const diff = viewerHeightCm - profileHeightCm;
  if (diff < 0) return 0.15;
  if (diff <= band) return 1.0;
  return Math.max(0.3, 1.0 - ((diff - band) / band) * 0.7);
}

export function rankProfiles<T extends RankableProfile>(
  profiles: T[],
  viewer: RankViewer
): RankedProfile<T>[] {
  if (profiles.length === 0) return [];
  if (viewer.gender !== 'M' && viewer.gender !== 'F') {
    return profiles.map((p) => ({ ...p, final_score: 0 }));
  }

  const segment = detectSegment(viewer);
  const weights = SEGMENT_WEIGHTS[segment];
  const tall = isTallViewer(viewer);
  const viewerHeightCm = toHeightCm(viewer.heightCm);

  const ranked: RankedProfile<T>[] = profiles.map((profile) => {
    const baseScore =
      typeof profile.base_score === 'number' && !Number.isNaN(profile.base_score)
        ? profile.base_score
        : DEFAULT_BASE_SCORE;

    const ageScore = computeAgeScore(segment, viewer.age, profile.age);

    let heightScore: number | null = null;
    const profileHeightCm = toHeightCm(profile.heightCm);

    if (viewerHeightCm !== null && profileHeightCm !== null) {
      heightScore = tall
        ? heightScoreProportional(viewer.gender, viewerHeightCm, profileHeightCm)
        : computeHeightScore(viewer.gender, viewerHeightCm, profileHeightCm);
    }

    const matchFactor =
      heightScore === null
        ? ageScore
        : weights.ageWeight * ageScore + weights.heightWeight * heightScore;

    let finalScore = baseScore * matchFactor;
    finalScore *= 1 + (Math.random() - 0.5) * JITTER_FACTOR;
    finalScore = Math.min(1, Math.round(finalScore * 10000) / 10000);

    return {
      ...profile,
      final_score: finalScore,
    };
  });

  ranked.sort((a, b) => b.final_score - a.final_score);
  return ranked;
}
