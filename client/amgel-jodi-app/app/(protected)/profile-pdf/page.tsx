'use client'

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const FAMILY_DETAILS_MAX = 2000

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfilePdfItem {
  key: string
  fileName: string
  sizeBytes: number
  createdAt: string
  signedUrl: string
}

interface ListResponse {
  success: boolean
  items: ProfilePdfItem[]
  count: number
  max: number
}

interface ProfileData {
  firstName?: string
  lastName?: string
  dob?: string
  gender?: 'M' | 'F'
  nativePlace?: string
  height?: string
  foodPreference?: 'pure_veg' | 'non_veg' | 'eggetarian' | null
  education?: string
  aboutMe?: string
  workingStatus?: 'employed' | 'self-employed' | 'not-working' | boolean
  company?: string
  designation?: string
  workLocation?: string
  salaryRange?: string
  placeOfBirth?: string
  birthTiming?: string
  gothra?: string
  nakshatra?: string
  kuldeva?: string
}

// ─── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
}

const FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Personal',
    fields: [
      { key: 'dob', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'height', label: 'Height' },
      { key: 'nativePlace', label: 'Native Place' },
      { key: 'foodPreference', label: 'Food Preference' },
      { key: 'education', label: 'Education' },
    ],
  },
  {
    title: 'About',
    fields: [{ key: 'aboutMe', label: 'About Me' }],
  },
  {
    title: 'Contact',
    fields: [{ key: 'phone', label: 'Mobile Number' }],
  },
  {
    title: 'Career',
    fields: [
      { key: 'workingStatus', label: 'Working Status' },
      { key: 'company', label: 'Company' },
      { key: 'designation', label: 'Designation' },
      { key: 'workLocation', label: 'Work Location' },
      { key: 'salaryRange', label: 'Salary Range' },
    ],
  },
  {
    title: 'Jatak / Kundali',
    fields: [
      { key: 'placeOfBirth', label: 'Place of Birth' },
      { key: 'birthTiming', label: 'Birth Time' },
      { key: 'gothra', label: 'Gothra' },
      { key: 'nakshatra', label: 'Nakshatra' },
      { key: 'kuldeva', label: 'Kuldeva' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length >= 10) {
    const last4 = d.slice(-4)
    return `+91 ●●●●● ●${last4}`
  }
  return '●●●●●●●●●●'
}

function formatFoodPref(food: ProfileData['foodPreference']): string | null {
  if (!food) return null
  switch (food) {
    case 'pure_veg': return 'Pure Vegetarian'
    case 'non_veg': return 'Non-Vegetarian'
    case 'eggetarian': return 'Eggetarian'
    default: return null
  }
}

function formatWorkStatus(status: ProfileData['workingStatus']): string | null {
  if (status === undefined || status === null) return null
  if (typeof status === 'boolean') return status ? 'Employed' : 'Not working'
  switch (status) {
    case 'employed': return 'Employed'
    case 'self-employed': return 'Self-employed'
    case 'not-working': return 'Not working'
    default: return null
  }
}

function formatDobAge(dob: string): string {
  const d = new Date(dob)
  if (isNaN(d.getTime())) return dob
  const dobStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const ageMs = Date.now() - d.getTime()
  const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25))
  return `${dobStr} · ${age} yrs`
}

function formatSalaryRange(range: string): string {
  switch (range) {
    case '<5L': return 'Below ₹5L p.a.'
    case '5-15L': return '₹5–15L p.a.'
    case '15-30L': return '₹15–30L p.a.'
    case '30-50L': return '₹30–50L p.a.'
    case '>50L': return 'Above ₹50L p.a.'
    default: return range
  }
}

function getFieldDisplayValue(key: string, profile: ProfileData, phone: string): string | null {
  switch (key) {
    case 'dob': return profile.dob ? formatDobAge(profile.dob) : null
    case 'gender': return profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : null
    case 'height': return profile.height || null
    case 'nativePlace': return profile.nativePlace || null
    case 'foodPreference': return formatFoodPref(profile.foodPreference)
    case 'education': return profile.education || null
    case 'aboutMe': {
      const t = profile.aboutMe?.trim()
      if (!t) return null
      return t.length > 48 ? `"${t.slice(0, 48)}…"` : `"${t}"`
    }
    case 'phone': return phone ? maskPhone(phone) : 'Your registered number'
    case 'workingStatus': return formatWorkStatus(profile.workingStatus)
    case 'company': return profile.company || null
    case 'designation': return profile.designation || null
    case 'workLocation': return profile.workLocation || null
    case 'salaryRange': return profile.salaryRange ? formatSalaryRange(profile.salaryRange) : null
    case 'placeOfBirth': return profile.placeOfBirth || null
    case 'birthTiming': return profile.birthTiming || null
    case 'gothra': return profile.gothra || null
    case 'nakshatra': return profile.nakshatra || null
    case 'kuldeva': return profile.kuldeva || null
    default: return null
  }
}

function buildInitialSelection(profile: ProfileData, phone: string): Set<string> {
  const keys = new Set<string>()
  for (const group of FIELD_GROUPS) {
    for (const field of group.fields) {
      if (getFieldDisplayValue(field.key, profile, phone) !== null) {
        keys.add(field.key)
      }
    }
  }
  return keys
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePdfPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [items, setItems] = useState<ProfilePdfItem[]>([])
  const [max, setMax] = useState(5)
  const [familyDetails, setFamilyDetails] = useState('')
  const [familyDetailsOpen, setFamilyDetailsOpen] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ProfilePdfItem | null>(null)
  const [readyItem, setReadyItem] = useState<ProfilePdfItem | null>(null)
  const [shareBusy, setShareBusy] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const res = await authFetch(`${API_BASE}/profile-pdfs`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Something went wrong (${res.status})`)
      }
      const data: ListResponse = await res.json()
      setItems(data.items || [])
      setMax(data.max ?? 5)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user?.userId) {
      setLoadingProfile(false)
      return
    }
    authFetch(`${API_BASE}/profiles/${user.userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setProfile(data.profile)
          setSelectedFields(buildInitialSelection(data.profile, user.phone || ''))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [user?.userId, user?.phone])

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const limitReached = items.length >= max
  const isVerified = user?.verified === true

  const handleGenerate = async () => {
    if (generating || limitReached || !isVerified) return
    setGenerating(true)
    setError(null)
    try {
      const res = await authFetch(`${API_BASE}/profile-pdfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyDetails: familyDetails.trim(),
          includedFields: Array.from(selectedFields),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 409) throw new Error(body?.message || 'Maximum PDFs saved. Delete one to make a new one.')
        if (res.status === 403) throw new Error('Verification needed before creating a bio-data file.')
        throw new Error(body?.error || body?.message || `Could not create file (${res.status})`)
      }
      const data: { item: ProfilePdfItem } = await res.json()
      setItems(prev => [data.item, ...prev])
      setFamilyDetails('')
      setReadyItem(data.item)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create file')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (item: ProfilePdfItem) => {
    setDeletingKey(item.key)
    setError(null)
    try {
      const res = await authFetch(
        `${API_BASE}/profile-pdfs/${encodeURIComponent(item.key)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Could not delete (${res.status})`)
      }
      setItems(prev => prev.filter(x => x.key !== item.key))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    } finally {
      setDeletingKey(null)
      setPendingDelete(null)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#F4F6FA',
        backgroundImage:
          'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    >
      {/* Page header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-myColor-100/80 shadow-sm shadow-myColor-900/[0.04]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 -ml-1 rounded-xl text-myColor-700 hover:bg-myColor-50 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-display font-bold text-myColor-900 flex-1">Bio-Data</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3">
            <span className="text-sm leading-relaxed flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-500 text-sm font-medium shrink-0">Dismiss</button>
          </div>
        )}

        {!isVerified ? (
          <div className="rounded-2xl bg-white border border-myColor-100 p-8 text-center shadow-sm">
            <IllustrationVerifiedPending className="w-40 h-24 mx-auto mb-6 text-amber-600/80" />
            <h2 className="text-lg font-semibold text-myColor-900 mb-2">Verification needed</h2>
            <p className="text-myColor-600 text-sm mb-6">You can use this after your profile is verified.</p>
            <Link href="/dashboard" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-myColor-600 text-white text-sm font-medium">
              Back
            </Link>
          </div>
        ) : (
          <>
            {/* ── Main creation card ── */}
            <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(109,40,217,0.07)] border border-myColor-100/60 overflow-hidden">

              {/* Card header */}
              <div className="px-5 pt-5 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-myColor-400 mb-1.5">New File</p>
                <h2 className="font-display text-xl font-bold text-myColor-900 leading-tight">Create your Bio-Data</h2>
                <p className="mt-1.5 text-sm text-myColor-600 leading-relaxed">
                  Deselect any fields that you don&apos;t want included in the bio-data file.
                </p>
              </div>

              <div className="border-t border-gray-100/80" />

              {/* Field groups */}
              {loadingProfile ? (
                <div className="px-5 py-5 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-16 bg-myColor-100 rounded animate-pulse" />
                      <div className="h-9 bg-gray-50 rounded-lg animate-pulse" />
                      <div className="h-9 bg-gray-50 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : profile ? (
                <div>
                  {FIELD_GROUPS.map((group, gi) => {
                    const phone = user?.phone || ''
                    const visibleFields = group.fields.filter(
                      f => getFieldDisplayValue(f.key, profile, phone) !== null
                    )
                    if (visibleFields.length === 0) return null
                    return (
                      <div key={group.title} className={gi > 0 ? 'border-t border-gray-100/80' : ''}>
                        <div className="px-5 pt-4 pb-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-myColor-400">
                            {group.title}
                          </p>
                        </div>
                        <div className="px-4 pb-3 space-y-0.5">
                          {visibleFields.map(field => {
                            const value = getFieldDisplayValue(field.key, profile, phone)
                            const isSelected = selectedFields.has(field.key)
                            return (
                              <button
                                key={field.key}
                                type="button"
                                onClick={() => toggleField(field.key)}
                                className={`flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-xl transition-all ${
                                  isSelected
                                    ? 'hover:bg-myColor-50/70'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                {/* Checkbox */}
                                <span
                                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                    isSelected
                                      ? 'bg-myColor-600 border-myColor-600 shadow-sm shadow-myColor-600/30'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </span>

                                {/* Label */}
                                <span className={`text-sm flex-1 font-medium leading-none transition-colors ${
                                  isSelected ? 'text-myColor-900' : 'text-gray-400'
                                }`}>
                                  {field.label}
                                </span>

                                {/* Value preview */}
                                {value && (
                                  <span className={`text-xs shrink-0 max-w-[130px] sm:max-w-[180px] truncate text-right transition-opacity ${
                                    isSelected ? 'text-myColor-500' : 'text-gray-300'
                                  }`}>
                                    {value}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-myColor-500">Could not load profile.</p>
                </div>
              )}

              {/* Edit profile nudge */}
              <div className="px-5 py-3 border-t border-gray-100/80">
                <p className="text-xs text-myColor-500 leading-relaxed">
                  Want to change any details?{' '}
                  <Link
                    href="/profile"
                    className="font-semibold text-myColor-600 hover:text-myColor-800 transition-colors"
                  >
                    <svg className="w-3 h-3 inline-block align-middle mb-0.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </Link>
                </p>
              </div>

              <div className="border-t border-gray-100/80" />

              {/* Extra info at bottom */}
              <div className="px-5 pt-3 pb-4">
                <button
                  type="button"
                  onClick={() => setFamilyDetailsOpen(o => !o)}
                  disabled={generating}
                  className="w-full flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-myColor-50/70 transition-colors text-left disabled:opacity-50"
                >
                  <span className="inline-flex shrink-0 rounded-lg bg-myColor-100 p-2 text-myColor-600">
                    <IconUsersFamily className="w-4 h-4" aria-hidden />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-myColor-900">Add Extra Info</span>
                    <span className="block text-xs text-myColor-500 mt-0.5">Family details, alternate number</span>
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 text-myColor-500 transition-transform ${familyDetailsOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {familyDetailsOpen && (
                  <div className="mt-2 px-1">
                    <textarea
                      value={familyDetails}
                      onChange={e => setFamilyDetails(e.target.value.slice(0, FAMILY_DETAILS_MAX))}
                      rows={4}
                      maxLength={FAMILY_DETAILS_MAX}
                      disabled={generating}
                      className="w-full px-4 py-3 text-sm bg-myColor-50/60 border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-400 resize-none focus:outline-none focus:ring-2 focus:ring-myColor-300 focus:border-myColor-300 disabled:opacity-50"
                      placeholder="Family details, alternate contact number…"
                    />
                    <p className="mt-1 text-xs text-myColor-400 text-right tabular-nums">
                      {familyDetails.length}/{FAMILY_DETAILS_MAX}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100/80" />

              {/* Action button */}
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || limitReached}
                  className={[
                    'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all',
                    generating || limitReached
                      ? 'bg-myColor-100 text-myColor-400 cursor-not-allowed'
                      : 'bg-myColor-700 text-white hover:bg-myColor-800 active:bg-myColor-900 shadow-sm shadow-myColor-700/25',
                  ].join(' ')}
                >
                  {generating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Creating…
                    </>
                  ) : limitReached ? (
                    `Limit reached (${max})`
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Bio-Data
                    </>
                  )}
                </button>
              </div>

              {limitReached && (
                <p className="px-5 pb-4 -mt-1 text-xs text-center text-myColor-600">
                  Delete a saved file below to create a new one.
                </p>
              )}
            </section>

            {/* ── Saved files ── */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-myColor-700">
                  <IconFilePdf className="w-4 h-4 text-myColor-500" aria-hidden />
                  Saved files
                </span>
                <span className="inline-flex items-center rounded-full bg-myColor-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-myColor-700">
                  {items.length}/{max}
                </span>
              </div>

              {loadingList ? (
                <div className="space-y-3">
                  <div className="h-16 rounded-xl bg-white border border-myColor-100 animate-pulse" />
                  <div className="h-16 rounded-xl bg-white border border-myColor-100 animate-pulse" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-myColor-200 bg-white/60 py-10 text-center">
                  <IllustrationEmptyPdf className="w-20 h-20 mx-auto mb-3 text-myColor-300" />
                  <p className="text-sm text-myColor-500">No files yet</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map(item => (
                    <li
                      key={item.key}
                      className="flex items-center gap-2 sm:gap-3 bg-white border border-myColor-100 rounded-xl p-3 pr-2 shadow-sm shadow-myColor-900/[0.04]"
                    >
                      <span className="shrink-0 inline-flex rounded-lg bg-myColor-50 p-2 text-myColor-600">
                        <IconFilePdf className="w-5 h-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-myColor-900 truncate" title={item.fileName}>{item.fileName}</div>
                        <div className="text-xs text-myColor-500">{formatRelative(item.createdAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => sharePdfWithWhatsApp(item, setShareBusy)}
                        disabled={shareBusy === item.key}
                        className="shrink-0 px-2.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-medium hover:bg-emerald-100 disabled:opacity-60 md:hidden"
                        title="Share via WhatsApp"
                      >
                        {shareBusy === item.key ? (
                          <svg className="w-5 h-5 animate-spin mx-auto" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <IconWhatsApp className="w-5 h-5 mx-auto" aria-hidden />
                        )}
                      </button>
                      <a
                        href={item.signedUrl}
                        download={item.fileName}
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-2 rounded-lg border border-myColor-200 bg-myColor-50 text-sm font-medium text-myColor-700 hover:bg-myColor-100 transition-colors"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        className="shrink-0 p-2 text-myColor-400 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Delete"
                      >
                        {deletingKey === item.key ? (
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg px-8 py-7 max-w-sm w-full text-center border border-myColor-100">
            <div className="w-10 h-10 mx-auto mb-4 border-2 border-myColor-200 border-t-myColor-600 rounded-full animate-spin" />
            <p className="text-base font-medium text-myColor-900">Creating your bio-data…</p>
          </div>
        </div>
      )}

      {/* Ready modal */}
      {readyItem && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-myColor-100" role="dialog" aria-labelledby="ready-title">
            <h2 id="ready-title" className="text-2xl font-display font-bold text-myColor-900 text-center mb-2">Ready!</h2>
            <p className="text-sm text-myColor-600 text-center mb-6 line-clamp-2" title={readyItem.fileName}>{readyItem.fileName}</p>
            <div className="flex flex-col gap-2">
              <a
                href={readyItem.signedUrl}
                download={readyItem.fileName}
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-myColor-600 text-white font-semibold hover:bg-myColor-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Download
              </a>
              <div className="flex flex-col gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => readyItem && sharePdfWithWhatsApp(readyItem, setShareBusy)}
                  disabled={shareBusy === readyItem.key}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-emerald-600/30 bg-emerald-50 text-emerald-900 font-semibold hover:bg-emerald-100 disabled:opacity-60"
                >
                  {shareBusy === readyItem.key ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <IconWhatsApp className="w-5 h-5" aria-hidden />
                  )}
                  Share on WhatsApp
                </button>
                <p className="text-[11px] text-center text-myColor-500 leading-snug px-1">
                  If your phone supports it, the PDF is shared directly. Otherwise open WhatsApp and attach the downloaded file.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReadyItem(null)}
              className="w-full mt-3 py-2.5 text-sm font-medium text-myColor-600 hover:text-myColor-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => (deletingKey ? null : setPendingDelete(null))}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full border border-myColor-100"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-title"
          >
            <h3 id="del-title" className="text-lg font-semibold text-myColor-900">Delete this file?</h3>
            <p className="text-sm text-myColor-600 mt-2 break-all">{pendingDelete.fileName}</p>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={!!deletingKey}
                className="px-4 py-2 rounded-lg text-sm font-medium text-myColor-700 hover:bg-myColor-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete)}
                disabled={!!deletingKey}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingKey ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Utility functions ────────────────────────────────────────────────────────

async function fetchPdfAsFile(item: ProfilePdfItem): Promise<File | null> {
  try {
    const res = await fetch(item.signedUrl, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) return null
    const blob = await res.blob()
    return new File([blob], item.fileName, { type: 'application/pdf' })
  } catch {
    return null
  }
}

async function sharePdfWithWhatsApp(
  item: ProfilePdfItem,
  setBusy: Dispatch<SetStateAction<string | null>>
) {
  setBusy(item.key)
  try {
    const file = await fetchPdfAsFile(item)
    if (
      file &&
      typeof navigator !== 'undefined' &&
      navigator.share &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({ files: [file], title: item.fileName, text: 'Bio-data PDF from Amgel Jodi' })
      return
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
  } finally {
    setBusy(null)
  }
  const message = encodeURIComponent(
    `Hi — sharing my matrimony bio-data (${item.fileName}). Please find the PDF attached in this chat, or ask me to send it. — Amgel Jodi`
  )
  window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const diffSec = (Date.now() - d.getTime()) / 1000
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} days ago`
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Icons & Illustrations ───────────────────────────────────────────────────

function IconUsersFamily({ className, 'aria-hidden': ariaHidden }: { className?: string; 'aria-hidden'?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden={ariaHidden}>
      <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function IconFilePdf({ className, 'aria-hidden': ariaHidden }: { className?: string; 'aria-hidden'?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden}>
      <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M14 2v5h5" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M9 13.5h6M9 17h4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M8.5 10h3l-.75 2.25h-1.5L8.5 10z" fill="currentColor" opacity={0.35} />
    </svg>
  )
}

function IconWhatsApp({ className, 'aria-hidden': ariaHidden }: { className?: string; 'aria-hidden'?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={ariaHidden}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function IllustrationVerifiedPending({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 200" fill="none" aria-hidden>
      <ellipse cx="160" cy="180" rx="120" ry="12" fill="currentColor" opacity="0.12" />
      <rect x="60" y="40" width="200" height="120" rx="16" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="3" />
      <path d="M100 95h120M100 115h80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <circle cx="220" cy="65" r="28" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="3" />
      <path d="M208 65l8 8 18-18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  )
}

function IllustrationEmptyPdf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden>
      <path d="M56 36h56l40 40v104a12 12 0 01-12 12H56a12 12 0 01-12-12V48a12 12 0 0112-12z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" opacity="0.35" />
      <path d="M112 36v40h40" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" opacity="0.35" />
    </svg>
  )
}
