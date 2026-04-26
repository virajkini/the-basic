/** Matches server `FoodPreference` */
export type FoodPreference = 'pure_veg' | 'non_veg' | 'eggetarian'

export const FOOD_PREFERENCE_OPTIONS: { value: FoodPreference | ''; label: string }[] = [
  { value: '', label: 'Prefer not to say' },
  { value: 'pure_veg', label: 'Pure Veg' },
  { value: 'non_veg', label: 'Non-veg' },
  { value: 'eggetarian', label: 'Eggetarian' },
]

export function foodPreferenceLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const row = FOOD_PREFERENCE_OPTIONS.find((o) => o.value === value)
  return row?.label && row.value !== '' ? row.label : null
}
