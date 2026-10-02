/** Matches server `VerificationStatus` (server/src/models/profile.ts) */
export type VerificationStatus =
  | 'pending'
  | 'not_reachable'
  | 'callback'
  | 'verified'
  | 'invalid'
  | 'not_gsb'
  | 'got_married'
  | 'on_hold'

export const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string; badge: string }[] = [
  { value: 'pending', label: 'Pending', badge: 'bg-gray-100 text-gray-700 ring-gray-200' },
  { value: 'not_reachable', label: 'Not reachable', badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  { value: 'callback', label: 'Call back', badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { value: 'on_hold', label: 'On hold', badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { value: 'verified', label: 'Verified', badge: 'bg-green-50 text-green-700 ring-green-200' },
  { value: 'invalid', label: 'Invalid', badge: 'bg-red-50 text-red-700 ring-red-200' },
  { value: 'not_gsb', label: 'Not GSB', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  { value: 'got_married', label: 'Got married', badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
]

export function verificationStatusOption(value: VerificationStatus | null | undefined) {
  return VERIFICATION_STATUS_OPTIONS.find((o) => o.value === value) ?? VERIFICATION_STATUS_OPTIONS[0]
}

/** Matches server DEACTIVATED_VERIFICATION_STATUSES — these users can't browse other profiles. */
export function isDeactivatedStatus(status: VerificationStatus | null | undefined): boolean {
  return status === 'invalid' || status === 'not_gsb' || status === 'got_married'
}
