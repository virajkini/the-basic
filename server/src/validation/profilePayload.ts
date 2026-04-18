import {
  Profile,
  CreatingFor,
  Gender,
  SalaryRange,
  WorkingStatus,
  calculateAge,
  parseHeightToCm,
} from '../models/profile.js';

export const validCreatingFor: CreatingFor[] = ['self', 'daughter', 'son', 'other'];
export const validGenders: Gender[] = ['M', 'F'];
export const validSalaryRanges: SalaryRange[] = ['<5L', '5-15L', '15-30L', '30-50L', '>50L'];
export const validWorkingStatuses: WorkingStatus[] = ['employed', 'self-employed', 'not-working'];

type CreateFail = { ok: false; status: number; error: string };
type CreateOk = { ok: true; data: Omit<Profile, '_id' | 'createdAt' | 'updatedAt'> };

/**
 * Validate body for profile creation (same rules as POST /api/profiles).
 */
export function parseCreateProfileBody(body: unknown): CreateFail | CreateOk {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;
  const {
    creatingFor,
    firstName,
    lastName,
    dob,
    gender,
    nativePlace,
    height,
    workingStatus,
    company,
    designation,
    workLocation,
    salaryRange,
    education,
    aboutMe,
    placeOfBirth,
    birthTiming,
    gothra,
    nakshatra,
    kuldeva,
  } = b;

  if (!creatingFor || !validCreatingFor.includes(creatingFor as CreatingFor)) {
    return { ok: false, status: 400, error: 'Creating for must be one of: self, daughter, son, other' };
  }

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    return { ok: false, status: 400, error: 'First name is required' };
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    return { ok: false, status: 400, error: 'Last name is required' };
  }

  if (!gender || !validGenders.includes(gender as Gender)) {
    return { ok: false, status: 400, error: 'Gender must be M or F' };
  }

  if (!dob || typeof dob !== 'string') {
    return { ok: false, status: 400, error: 'Date of birth (dob) is required' };
  }

  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) {
    return { ok: false, status: 400, error: 'Invalid date of birth format' };
  }

  const age = calculateAge(dob);
  if (age < 18) {
    return { ok: false, status: 400, error: 'Must be at least 18 years old' };
  }

  if (!nativePlace || typeof nativePlace !== 'string' || nativePlace.trim().length === 0) {
    return { ok: false, status: 400, error: 'Native place is required' };
  }

  if (!height || typeof height !== 'string' || height.trim().length === 0) {
    return { ok: false, status: 400, error: 'Height is required' };
  }

  if (!workingStatus || !validWorkingStatuses.includes(workingStatus as WorkingStatus)) {
    return { ok: false, status: 400, error: 'Working status must be one of: employed, self-employed, not-working' };
  }

  if (salaryRange && !validSalaryRanges.includes(salaryRange as SalaryRange)) {
    return { ok: false, status: 400, error: 'Invalid salary range' };
  }

  const isWorking = workingStatus === 'employed' || workingStatus === 'self-employed';
  const heightCm = parseHeightToCm((height as string).trim());
  const profileData: Omit<Profile, '_id' | 'createdAt' | 'updatedAt'> = {
    creatingFor: creatingFor as CreatingFor,
    firstName: (firstName as string).trim(),
    lastName: (lastName as string).trim(),
    name: `${(firstName as string).trim()} ${(lastName as string).trim()}`,
    gender: gender as Gender,
    dob: (dob as string).trim(),
    age,
    nativePlace: (nativePlace as string).trim(),
    height: (height as string).trim(),
    heightCm: heightCm ?? undefined,
    workingStatus: workingStatus as WorkingStatus,
    company: isWorking && typeof company === 'string' && company.trim() ? company.trim() : undefined,
    designation: isWorking && typeof designation === 'string' && designation.trim() ? designation.trim() : undefined,
    workLocation: isWorking && typeof workLocation === 'string' && workLocation.trim() ? workLocation.trim() : undefined,
    salaryRange:
      isWorking && salaryRange && validSalaryRanges.includes(salaryRange as SalaryRange)
        ? (salaryRange as SalaryRange)
        : undefined,
    education: typeof education === 'string' && education.trim() ? education.trim() : undefined,
    aboutMe: typeof aboutMe === 'string' && aboutMe.trim() ? aboutMe.trim() : undefined,
    placeOfBirth: typeof placeOfBirth === 'string' && placeOfBirth.trim() ? placeOfBirth.trim() : undefined,
    birthTiming: typeof birthTiming === 'string' ? birthTiming || undefined : (birthTiming as string | undefined),
    gothra: typeof gothra === 'string' ? gothra || undefined : undefined,
    nakshatra: typeof nakshatra === 'string' ? nakshatra || undefined : undefined,
    kuldeva: typeof kuldeva === 'string' ? kuldeva || undefined : undefined,
    verified: false,
    subscribed: false,
  };

  return { ok: true, data: profileData };
}

export type ProfileUpdateOptions = { allowVerifiedSubscribed?: boolean };

type UpdateFail = { ok: false; status: number; error: string };
type UpdateOk = { ok: true; updateData: Partial<Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>> };

/**
 * Build partial update from body (same rules as PUT /api/profiles/:userId).
 * When allowVerifiedSubscribed is true, verified and subscribed may be set from body (admin only).
 */
export function parseProfileUpdateBody(
  body: unknown,
  existingProfile: Profile,
  options: ProfileUpdateOptions = {}
): UpdateFail | UpdateOk {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;
  const {
    creatingFor,
    firstName,
    lastName,
    dob,
    gender,
    nativePlace,
    height,
    workingStatus,
    company,
    designation,
    workLocation,
    salaryRange,
    education,
    aboutMe,
    placeOfBirth,
    birthTiming,
    gothra,
    nakshatra,
    kuldeva,
    verified,
    subscribed,
  } = b;

  const updateData: Partial<Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>> = {};

  if (creatingFor !== undefined) {
    if (!validCreatingFor.includes(creatingFor as CreatingFor)) {
      return { ok: false, status: 400, error: 'Creating for must be one of: self, daughter, son, other' };
    }
    updateData.creatingFor = creatingFor as CreatingFor;
  }

  if (firstName !== undefined) {
    if (typeof firstName !== 'string' || firstName.trim().length === 0) {
      return { ok: false, status: 400, error: 'Invalid first name' };
    }
    updateData.firstName = firstName.trim();
  }

  if (lastName !== undefined) {
    if (typeof lastName !== 'string' || lastName.trim().length === 0) {
      return { ok: false, status: 400, error: 'Invalid last name' };
    }
    updateData.lastName = lastName.trim();
  }

  if (updateData.firstName || updateData.lastName) {
    const newFirstName = updateData.firstName || existingProfile.firstName;
    const newLastName = updateData.lastName || existingProfile.lastName;
    updateData.name = `${newFirstName} ${newLastName}`;
  }

  if (gender !== undefined) {
    if (!validGenders.includes(gender as Gender)) {
      return { ok: false, status: 400, error: 'Gender must be M or F' };
    }
    updateData.gender = gender as Gender;
  }

  if (dob !== undefined) {
    if (typeof dob !== 'string' || dob.trim().length === 0) {
      return { ok: false, status: 400, error: 'Invalid date of birth' };
    }
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return { ok: false, status: 400, error: 'Invalid date of birth format' };
    }
    updateData.dob = dob.trim();
    updateData.age = calculateAge(dob);
  }

  if (nativePlace !== undefined) {
    if (typeof nativePlace !== 'string' || nativePlace.trim().length === 0) {
      return { ok: false, status: 400, error: 'Invalid native place' };
    }
    updateData.nativePlace = nativePlace.trim();
  }

  if (height !== undefined) {
    if (typeof height !== 'string' || height.trim().length === 0) {
      return { ok: false, status: 400, error: 'Invalid height' };
    }
    updateData.height = height.trim();
    const heightCm = parseHeightToCm(height.trim());
    if (heightCm !== null) {
      updateData.heightCm = heightCm;
    }
  }

  if (workingStatus !== undefined) {
    if (!validWorkingStatuses.includes(workingStatus as WorkingStatus)) {
      return { ok: false, status: 400, error: 'Working status must be one of: employed, self-employed, not-working' };
    }
    updateData.workingStatus = workingStatus as WorkingStatus;
    if (workingStatus === 'not-working') {
      updateData.company = undefined;
      updateData.designation = undefined;
      updateData.workLocation = undefined;
      updateData.salaryRange = undefined;
    }
  }

  if (company !== undefined) {
    updateData.company = typeof company === 'string' && company.trim() ? company.trim() : undefined;
  }

  if (designation !== undefined) {
    updateData.designation = typeof designation === 'string' && designation.trim() ? designation.trim() : undefined;
  }

  if (workLocation !== undefined) {
    updateData.workLocation = typeof workLocation === 'string' && workLocation.trim() ? workLocation.trim() : undefined;
  }

  if (salaryRange !== undefined) {
    if (salaryRange && !validSalaryRanges.includes(salaryRange as SalaryRange)) {
      return { ok: false, status: 400, error: 'Invalid salary range' };
    }
    updateData.salaryRange = (salaryRange as SalaryRange) || undefined;
  }

  if (education !== undefined) {
    updateData.education = typeof education === 'string' && education.trim() ? education.trim() : undefined;
  }

  if (aboutMe !== undefined) {
    updateData.aboutMe = typeof aboutMe === 'string' && aboutMe.trim() ? aboutMe.trim() : undefined;
  }

  if (placeOfBirth !== undefined) {
    updateData.placeOfBirth = typeof placeOfBirth === 'string' && placeOfBirth.trim() ? placeOfBirth.trim() : undefined;
  }

  if (birthTiming !== undefined) {
    updateData.birthTiming = typeof birthTiming === 'string' ? birthTiming || undefined : undefined;
  }

  if (gothra !== undefined) {
    updateData.gothra = typeof gothra === 'string' ? gothra || undefined : undefined;
  }

  if (nakshatra !== undefined) {
    updateData.nakshatra = typeof nakshatra === 'string' ? nakshatra || undefined : undefined;
  }

  if (kuldeva !== undefined) {
    updateData.kuldeva = typeof kuldeva === 'string' ? kuldeva || undefined : undefined;
  }

  if (options.allowVerifiedSubscribed) {
    if (verified !== undefined) {
      if (typeof verified !== 'boolean') {
        return { ok: false, status: 400, error: 'verified must be a boolean when provided' };
      }
      updateData.verified = verified;
    }
    if (subscribed !== undefined) {
      if (typeof subscribed !== 'boolean') {
        return { ok: false, status: 400, error: 'subscribed must be a boolean when provided' };
      }
      updateData.subscribed = subscribed;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { ok: false, status: 400, error: 'No valid fields to update' };
  }

  return { ok: true, updateData };
}
