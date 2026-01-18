export type CreatingFor = 'self' | 'daughter' | 'son' | 'other';
export type Gender = 'M' | 'F';
export type SalaryRange = '<5L' | '5-15L' | '15-30L' | '30-50L' | '>50L';
export type WorkingStatus = 'employed' | 'self-employed' | 'not-working';

export interface Profile {
  _id: string; // Same as user id: "u_12345"

  // Basic Information
  creatingFor: CreatingFor;
  firstName: string;
  lastName: string;
  dob: string; // Format: "1993-06-10"
  gender: Gender;
  nativePlace: string;
  height: string; // Display format: e.g., "5'8\" (173 cm)"
  heightCm?: number; // Height in centimeters for sorting/filtering

  // Work Information (all optional)
  workingStatus: WorkingStatus | boolean; // Support legacy boolean
  company?: string;
  designation?: string;
  workLocation?: string;
  salaryRange?: SalaryRange;

  // Additional
  education?: string;
  aboutMe?: string;

  // Jatak/Kundali Information (optional)
  placeOfBirth?: string;
  birthTiming?: string; // Format: "HH:MM" (24-hour)
  gothra?: string;
  nakshatra?: string;

  // Legacy fields for backwards compatibility
  name?: string; // Will be derived from firstName + lastName
  age?: number; // Will be calculated from dob

  // System fields
  verified: boolean;
  subscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to calculate age from DOB
export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// Helper function to parse height string and extract cm value
// Supports formats: "5'7\" (170 cm)", "5'7\"", "170 cm", "170"
export function parseHeightToCm(height: string): number | null {
  if (!height) return null;

  // Try to extract cm from parentheses: "5'7\" (170 cm)"
  const cmMatch = height.match(/\((\d+)\s*cm\)/);
  if (cmMatch) {
    return parseInt(cmMatch[1], 10);
  }

  // Try to parse standalone cm: "170 cm" or "170"
  const standaloneCm = height.match(/^(\d+)\s*(?:cm)?$/);
  if (standaloneCm) {
    return parseInt(standaloneCm[1], 10);
  }

  // Try to parse feet/inches: "5'7\"" or "5'7"
  const feetInchMatch = height.match(/(\d+)'(\d+)/);
  if (feetInchMatch) {
    const feet = parseInt(feetInchMatch[1], 10);
    const inches = parseInt(feetInchMatch[2], 10);
    return Math.round(feet * 30.48 + inches * 2.54);
  }

  return null;
}


