export type CreatingFor = 'self' | 'daughter' | 'son' | 'other';
export type Gender = 'M' | 'F';
export type SalaryRange = '<5L' | '5-15L' | '15-30L' | '30-50L' | '>50L';

export interface Profile {
  _id: string; // Same as user id: "u_12345"

  // Basic Information
  creatingFor: CreatingFor;
  firstName: string;
  lastName: string;
  dob: string; // Format: "1993-06-10"
  gender: Gender;
  nativePlace: string;
  height: string; // e.g., "5'8"" or "173 cm"

  // Work Information (optional based on workingStatus)
  workingStatus: boolean;
  company?: string;
  designation?: string;
  workLocation?: string;
  salaryRange?: SalaryRange;

  // Additional
  aboutMe?: string;

  // Legacy fields for backwards compatibility
  name?: string; // Will be derived from firstName + lastName
  age?: number; // Will be calculated from dob

  // System fields
  verified: boolean;
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

