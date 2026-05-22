import type { Gender } from '../models/profile.js';

/**
 * Runtime discover ranking (pure function — no DB, no framework imports).
 *
 * For each candidate profile we compute:
 *
 *   final_score = base_score × match_factor × jitter
 *
 * where:
 *   match_factor = (0.55 × age_score) + (0.45 × height_score)
 *                 OR age_score alone when heightCm is missing on either side
 *
 *   base_score   — precomputed quality signal on the profile (default 0.3 if absent)
 *   age_score    — preference curve on age gap (direction depends on viewer gender)
 *   height_score — preference curve on height gap in cm (direction depends on viewer gender)
 *   jitter       — × (1 + (random − 0.5) × 0.06)  → ±3% to avoid frozen ties
 *
 * Age gap (years):
 *   Male viewer (prefers younger female):  diff = viewer.age − profile.age
 *   Female viewer (prefers older male):     diff = profile.age − viewer.age
 *
 *   diff 0–1 → 0.80 | diff 2–4 → 1.00 | diff 5 → 0.80
 *   outside (diff < 0 or diff > 5): max(0, 0.80 − gap_beyond_range × 0.15)
 *
 * Height gap uses heightCm only:
 *   Female viewer (wants taller male): diff = profile.heightCm − viewer.heightCm
 *   Male viewer (wants similar/shorter): diff = viewer.heightCm − profile.heightCm
 *
 * Returns profiles sorted by final_score descending, each with final_score attached.
 */

const DEFAULT_BASE_SCORE = 0.3;
const AGE_WEIGHT = 0.55;
const HEIGHT_WEIGHT = 0.45;
const JITTER_FACTOR = 0.06;

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

function ageScoreFromDiff(diff: number): number {
  if (diff >= 0 && diff <= 1) return 0.8;
  if (diff >= 2 && diff <= 4) return 1.0;
  if (diff === 5) return 0.8;

  const gapBeyond = diff < 0 ? Math.abs(diff) : diff - 5;
  return Math.max(0, 0.8 - gapBeyond * 0.15);
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

function computeAgeScore(
  viewerGender: Gender,
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

  const diff =
    viewerGender === 'M' ? viewerAge - profileAge : profileAge - viewerAge;

  return ageScoreFromDiff(diff);
}

function computeHeightScore(
  viewerGender: Gender,
  viewerHeightCm: number | null,
  profileHeightCm: number | null
): number | null {
  if (viewerHeightCm === null || profileHeightCm === null) return null;

  const diffCm =
    viewerGender === 'F'
      ? profileHeightCm - viewerHeightCm
      : viewerHeightCm - profileHeightCm;

  return viewerGender === 'F'
    ? heightScoreFemaleViewer(diffCm)
    : heightScoreMaleViewer(diffCm);
}

export function rankProfiles<T extends RankableProfile>(
  profiles: T[],
  viewer: RankViewer
): RankedProfile<T>[] {
  if (profiles.length === 0) return [];
  if (viewer.gender !== 'M' && viewer.gender !== 'F') {
    return profiles.map((p) => ({ ...p, final_score: 0 }));
  }

  const viewerHeightCm = toHeightCm(viewer.heightCm);

  const ranked: RankedProfile<T>[] = profiles.map((profile) => {
    const baseScore =
      typeof profile.base_score === 'number' && !Number.isNaN(profile.base_score)
        ? profile.base_score
        : DEFAULT_BASE_SCORE;

    const ageScore = computeAgeScore(viewer.gender, viewer.age, profile.age);
    const profileHeightCm = toHeightCm(profile.heightCm);
    const heightScore = computeHeightScore(viewer.gender, viewerHeightCm, profileHeightCm);

    const matchFactor =
      heightScore === null
        ? ageScore
        : AGE_WEIGHT * ageScore + HEIGHT_WEIGHT * heightScore;

    let finalScore = baseScore * matchFactor;
    finalScore *= 1 + (Math.random() - 0.5) * JITTER_FACTOR;
    finalScore = Math.round(finalScore * 10000) / 10000;

    return {
      ...profile,
      final_score: finalScore,
    };
  });

  ranked.sort((a, b) => b.final_score - a.final_score);
  return ranked;
}
