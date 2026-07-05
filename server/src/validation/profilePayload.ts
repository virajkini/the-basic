import {
  Profile,
  CreatingFor,
  Gender,
  SalaryRange,
  WorkingStatus,
  FoodPreference,
  FOOD_PREFERENCE_VALUES,
  calculateAge,
  parseHeightToCm,
} from '../models/profile.js';

export const validCreatingFor: CreatingFor[] = ['self', 'daughter', 'son', 'other'];
export const validGenders: Gender[] = ['M', 'F'];
export const validSalaryRanges: SalaryRange[] = ['<5L', '5-15L', '15-30L', '30-50L', '>50L'];
export const validWorkingStatuses: WorkingStatus[] = ['employed', 'self-employed', 'not-working'];

/** Matches app user ids (e.g. u_00123, u_stage_001) */
const USER_ID_PATTERN = /^u_[A-Za-z0-9_-]+$/;
const MAX_FAVORITE_USER_IDS = 200;

export function parsePrimaryPhotoKeyInput(
  raw: unknown,
  userId: string
): { ok: false; status: number; error: string } | { ok: true; value: string | null | undefined } {
  if (raw === undefined) {
    return { ok: true, value: undefined };
  }
  if (raw === null || raw === '') {
    return { ok: true, value: null };
  }
  if (typeof raw !== 'string') {
    return { ok: false, status: 400, error: 'primaryPhotoKey must be a string, null, or omitted' };
  }
  const expectedPrefix = `profiles/${userId}/original/`;
  const rest = raw.startsWith(expectedPrefix) ? raw.slice(expectedPrefix.length) : '';
  if (!rest || rest.includes('/') || rest.includes('..')) {
    return { ok: false, status: 400, error: 'primaryPhotoKey must be a key under profiles/{userId}/original/' };
  }
  return { ok: true, value: raw };
}

export function parsePhotoKeysInput(
  raw: unknown,
  userId: string
): { ok: false; status: number; error: string } | { ok: true; value: string[] } {
  if (!Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'photoKeys must be an array' };
  }
  if (raw.length > 5) {
    return { ok: false, status: 400, error: 'photoKeys cannot exceed 5 items' };
  }
  const expectedPrefix = `profiles/${userId}/original/`;
  const validated: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      return { ok: false, status: 400, error: 'photoKeys must contain strings' };
    }
    const rest = item.startsWith(expectedPrefix) ? item.slice(expectedPrefix.length) : '';
    if (!rest || rest.includes('/') || rest.includes('..')) {
      return { ok: false, status: 400, error: `Invalid key in photoKeys: ${item}` };
    }
    validated.push(item);
  }
  return { ok: true, value: validated };
}

export function parseFavoriteUserIdsInput(
  raw: unknown,
  ownUserId: string
): { ok: false; status: number; error: string } | { ok: true; favoriteUserIds: string[] } {
  if (!Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'favoriteUserIds must be an array' };
  }
  if (raw.length > MAX_FAVORITE_USER_IDS) {
    return { ok: false, status: 400, error: `favoriteUserIds cannot exceed ${MAX_FAVORITE_USER_IDS} entries` };
  }
  const seen = new Set<string>();
  const favoriteUserIds: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      return { ok: false, status: 400, error: 'Each favoriteUserIds entry must be a string' };
    }
    const id = item.trim();
    if (!USER_ID_PATTERN.test(id)) {
      return { ok: false, status: 400, error: 'Invalid user id in favoriteUserIds' };
    }
    if (id === ownUserId) {
      return { ok: false, status: 400, error: 'Cannot include your own user id in favoriteUserIds' };
    }
    if (!seen.has(id)) {
      seen.add(id);
      favoriteUserIds.push(id);
    }
  }
  return { ok: true, favoriteUserIds };
}

type CreateFail = { ok: false; status: number; error: string };
type CreateOk = { ok: true; data: Omit<Profile, '_id' | 'createdAt' | 'updatedAt'> };

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
    foodPreference,
    primaryPhotoKey: primaryPhotoKeyRaw,
    photoKeys: photoKeysRaw,
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

  let foodPreferenceForCreate: FoodPreference | undefined;
  if (foodPreference !== undefined && foodPreference !== null && foodPreference !== '') {
    if (typeof foodPreference !== 'string' || !FOOD_PREFERENCE_VALUES.includes(foodPreference as FoodPreference)) {
      return { ok: false, status: 400, error: 'foodPreference must be pure_veg, non_veg, or eggetarian' };
    }
    foodPreferenceForCreate = foodPreference as FoodPreference;
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
    ...(foodPreferenceForCreate !== undefined ? { foodPreference: foodPreferenceForCreate } : {}),
  };

  const uid = typeof b.userId === 'string' ? b.userId : '';

  if (primaryPhotoKeyRaw !== undefined) {
    if (!uid) {
      return { ok: false, status: 400, error: 'userId is required when setting primaryPhotoKey' };
    }
    const pk = parsePrimaryPhotoKeyInput(primaryPhotoKeyRaw, uid);
    if (!pk.ok) {
      return { ok: false, status: pk.status, error: pk.error };
    }
    if (pk.value !== undefined) {
      (profileData as { primaryPhotoKey?: string | null }).primaryPhotoKey = pk.value ?? null;
    }
  }

  if (photoKeysRaw !== undefined) {
    if (!uid) {
      return { ok: false, status: 400, error: 'userId is required when setting photoKeys' };
    }
    const pk = parsePhotoKeysInput(photoKeysRaw, uid);
    if (!pk.ok) {
      return { ok: false, status: pk.status, error: pk.error };
    }
    (profileData as { photoKeys?: string[] }).photoKeys = pk.value;
  }

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
    foodPreference,
    verified,
    subscribed,
    favoriteUserIds,
    primaryPhotoKey: primaryPhotoKeyRaw,
    photoKeys: photoKeysRaw,
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
    // Allow empty string so clearing the field actually unsets it in MongoDB
    updateData.placeOfBirth = typeof placeOfBirth === 'string' ? placeOfBirth.trim() : undefined;
  }

  if (birthTiming !== undefined) {
    // Allow empty string so clearing the field actually unsets it in MongoDB
    updateData.birthTiming = typeof birthTiming === 'string' ? birthTiming : undefined;
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

  if (foodPreference !== undefined) {
    if (foodPreference === null || foodPreference === '') {
      updateData.foodPreference = null;
    } else if (typeof foodPreference === 'string' && FOOD_PREFERENCE_VALUES.includes(foodPreference as FoodPreference)) {
      updateData.foodPreference = foodPreference as FoodPreference;
    } else {
      return { ok: false, status: 400, error: 'foodPreference must be pure_veg, non_veg, eggetarian, or empty' };
    }
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

  if (favoriteUserIds !== undefined) {
    const parsedFav = parseFavoriteUserIdsInput(favoriteUserIds, existingProfile._id);
    if (!parsedFav.ok) {
      return { ok: false, status: parsedFav.status, error: parsedFav.error };
    }
    updateData.favoriteUserIds = parsedFav.favoriteUserIds;
  }

  if (primaryPhotoKeyRaw !== undefined) {
    const pk = parsePrimaryPhotoKeyInput(primaryPhotoKeyRaw, existingProfile._id);
    if (!pk.ok) {
      return { ok: false, status: pk.status, error: pk.error };
    }
    if (pk.value !== undefined) {
      updateData.primaryPhotoKey = pk.value;
    }
  }

  if (photoKeysRaw !== undefined) {
    const pk = parsePhotoKeysInput(photoKeysRaw, existingProfile._id);
    if (!pk.ok) {
      return { ok: false, status: pk.status, error: pk.error };
    }
    updateData.photoKeys = pk.value;
  }

  if (Object.keys(updateData).length === 0) {
    return { ok: false, status: 400, error: 'No valid fields to update' };
  }

  return { ok: true, updateData };
}
