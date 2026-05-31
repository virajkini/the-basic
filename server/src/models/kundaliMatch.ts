import { ObjectId } from 'mongodb';

export interface KootaResult {
  description: string;
  male_koot_attribute: string;
  female_koot_attribute: string;
  total_points: number;
  received_points: number;
}

export interface DashakootApiResponse {
  dina: KootaResult;
  gana: KootaResult;
  yoni: KootaResult;
  rashi: KootaResult;
  rasyadhipati: KootaResult;
  rajju: KootaResult;
  vedha: KootaResult;
  vashya: KootaResult;
  mahendra: KootaResult;
  streeDeergha: KootaResult;
  total: {
    total_points: number;
    received_points: number;
    minimum_required: number;
  };
}

export type CompatibilityTier = 'LOW' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT';
export type KootaStatus = 'STRONG' | 'MODERATE' | 'WEAK';

export interface KundaliMatch {
  _id?: ObjectId;
  /** Lexicographically smaller userId — canonical pair ordering to prevent duplicates */
  userAId: string;
  /** Lexicographically larger userId */
  userBId: string;
  maleUserId: string;
  femaleUserId: string;
  dashakootResult: DashakootApiResponse;
  tier: CompatibilityTier;
  receivedPoints: number;
  totalPoints: number;
  summary: string;
  createdAt: Date;
}

export const KUNDALI_MATCHES_COLLECTION = 'kundali_matches';
