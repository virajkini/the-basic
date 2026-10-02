'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import imageCompression from 'browser-image-compression'
import { authFetch } from '../../utils/authFetch'
import { FOOD_PREFERENCE_OPTIONS, type FoodPreference } from '@/lib/foodPreference'
import { verificationStatusOption, type VerificationStatus } from '@/lib/verificationStatus'
import VerificationStatusFilter, { type VerificationFilterValue } from '@/components/admin/VerificationStatusFilter'
import LoadMoreButton from '@/components/admin/LoadMoreButton'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const PAGE_SIZE = 20

/** Same values as user profile form: `app/(protected)/profile/page.tsx` */
const HEIGHT_OPTIONS = [
  "4'6\" (137 cm)", "4'7\" (140 cm)", "4'8\" (142 cm)", "4'9\" (145 cm)", "4'10\" (147 cm)", "4'11\" (150 cm)",
  "5'0\" (152 cm)", "5'1\" (155 cm)", "5'2\" (157 cm)", "5'3\" (160 cm)", "5'4\" (163 cm)", "5'5\" (165 cm)",
  "5'6\" (168 cm)", "5'7\" (170 cm)", "5'8\" (173 cm)", "5'9\" (175 cm)", "5'10\" (178 cm)", "5'11\" (180 cm)",
  "6'0\" (183 cm)", "6'1\" (185 cm)", "6'2\" (188 cm)", "6'3\" (191 cm)", "6'4\" (193 cm)", "6'5\" (196 cm)",
  "6'6\" (198 cm)", "6'7\" (201 cm)", "6'8\" (203 cm)",
]

interface AdminUserRow {
  userId: string
  phone: string | null
  email: string | null
  userCreatedAt: string
  hasProfile: boolean
  name: string | null
  isVerified: boolean
  verificationStatus: VerificationStatus | null
  isSubscribed: boolean
  profileCreatedAt: string | null
  profileUpdatedAt: string | null
  profileLastActive: string | null
  unseenConnectionRequests: number
}

function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Read-only status pill — status is changed from the Profiles tab only. */
function StatusBadge({ status }: { status: VerificationStatus }) {
  const o = verificationStatusOption(status)
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset whitespace-nowrap ${o.badge}`}>
      {o.label}
    </span>
  )
}

type ProfileForm = {
  creatingFor: string
  firstName: string
  lastName: string
  dob: string
  gender: 'M' | 'F'
  nativePlace: string
  height: string
  workingStatus: string
  company: string
  designation: string
  workLocation: string
  salaryRange: string
  education: string
  aboutMe: string
  placeOfBirth: string
  birthTiming: string
  gothra: string
  nakshatra: string
  kuldeva: string
  foodPreference: FoodPreference | ''
  subscribed: boolean
}

const emptyForm = (): ProfileForm => ({
  creatingFor: 'self',
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'M',
  nativePlace: '',
  height: '',
  workingStatus: 'employed',
  company: '',
  designation: '',
  workLocation: '',
  salaryRange: '5-15L',
  education: '',
  aboutMe: '',
  placeOfBirth: '',
  birthTiming: '',
  gothra: '',
  nakshatra: '',
  kuldeva: '',
  foodPreference: '',
  subscribed: false,
})

function normalizeWorkingStatus(ws: unknown): string {
  if (ws === true) return 'employed'
  if (ws === false) return 'not-working'
  if (typeof ws === 'string' && ws) return ws
  return 'employed'
}

function profileToForm(p: Record<string, unknown>): ProfileForm {
  return {
    creatingFor: (p.creatingFor as string) || 'self',
    firstName: (p.firstName as string) || '',
    lastName: (p.lastName as string) || '',
    dob: (p.dob as string) || '',
    gender: (p.gender as 'M' | 'F') || 'M',
    nativePlace: (p.nativePlace as string) || '',
    height: (p.height as string) || '',
    workingStatus: normalizeWorkingStatus(p.workingStatus),
    company: (p.company as string) || '',
    designation: (p.designation as string) || '',
    workLocation: (p.workLocation as string) || '',
    salaryRange: (p.salaryRange as string) || '',
    education: (p.education as string) || '',
    aboutMe: (p.aboutMe as string) || '',
    placeOfBirth: (p.placeOfBirth as string) || '',
    birthTiming: (p.birthTiming as string) || '',
    gothra: (p.gothra as string) || '',
    nakshatra: (p.nakshatra as string) || '',
    kuldeva: (p.kuldeva as string) || '',
    foodPreference:
      p.foodPreference === 'pure_veg' ||
      p.foodPreference === 'non_veg' ||
      p.foodPreference === 'eggetarian'
        ? (p.foodPreference as FoodPreference)
        : '',
    subscribed: Boolean(p.subscribed),
  }
}

function buildProfilePayload(form: ProfileForm, mode: 'create' | 'edit'): Record<string, unknown> {
  const isWorking = form.workingStatus === 'employed' || form.workingStatus === 'self-employed'
  const base: Record<string, unknown> = {
    creatingFor: form.creatingFor,
    firstName: form.firstName,
    lastName: form.lastName,
    dob: form.dob,
    gender: form.gender,
    nativePlace: form.nativePlace,
    height: form.height,
    workingStatus: form.workingStatus,
    company: isWorking ? form.company || undefined : undefined,
    designation: isWorking ? form.designation || undefined : undefined,
    workLocation: isWorking ? form.workLocation || undefined : undefined,
    salaryRange: isWorking && form.salaryRange ? form.salaryRange : undefined,
    education: form.education || undefined,
    aboutMe: form.aboutMe || undefined,
    placeOfBirth: form.placeOfBirth,
    birthTiming: form.birthTiming,
    gothra: form.gothra || undefined,
    nakshatra: form.nakshatra || undefined,
    kuldeva: form.kuldeva || undefined,
  }
  if (mode === 'edit') {
    base.foodPreference = form.foodPreference || null
  } else if (form.foodPreference) {
    base.foodPreference = form.foodPreference
  }
  base.subscribed = form.subscribed
  return base
}

export default function OnboardingTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false)
  const [usersHasMore, setUsersHasMore] = useState(false)
  const [usersTotal, setUsersTotal] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Partial<Record<VerificationStatus, number>>>({})
  const usersRequestRef = useRef(0)
  const [userSearch, setUserSearch] = useState('')
  /** Search actually sent to the server — applied on Enter / button, not on every keystroke */
  const [appliedSearch, setAppliedSearch] = useState('')
  const [unseenSort, setUnseenSort] = useState<'desc' | 'asc' | null>(null)
  const [statusFilter, setStatusFilter] = useState<VerificationFilterValue>('all')
  const [newPhone, setNewPhone] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorUserId, setEditorUserId] = useState<string | null>(null)
  const [editorHasProfile, setEditorHasProfile] = useState(false)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [savingProfile, setSavingProfile] = useState(false)

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<Array<{ key: string; url: string }>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [imageLightbox, setImageLightbox] = useState<{ url: string; key: string } | null>(null)
  const [imageDeleteKey, setImageDeleteKey] = useState<string | null>(null)
  const [imageDeleteBusy, setImageDeleteBusy] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!imageLightbox && !imageDeleteKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setImageLightbox(null)
      if (!imageDeleteBusy) setImageDeleteKey(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imageLightbox, imageDeleteKey, imageDeleteBusy])

  /** reset: load the first page (replacing the list); otherwise append the next page. */
  const loadUsers = async (reset = true) => {
    const requestId = ++usersRequestRef.current
    try {
      if (reset) setLoadingUsers(true)
      else setLoadingMoreUsers(true)
      setError(null)
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: String(reset ? 0 : users.length),
      })
      if (appliedSearch) params.set('q', appliedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (unseenSort) params.set('unseenSort', unseenSort)
      const res = await authFetch(`${API_BASE}/admin/users?${params}`)
      if (requestId !== usersRequestRef.current) return // superseded by a newer search/filter/sort
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load users')
      }
      const data = await res.json()
      if (requestId !== usersRequestRef.current) return
      const rows: AdminUserRow[] = data.users || []
      setUsers((prev) => (reset ? rows : [...prev, ...rows]))
      setUsersHasMore(!!data.hasMore)
      setUsersTotal(data.total ?? 0)
      if (data.statusCounts) {
        setStatusCounts(data.statusCounts)
        setTotalUsers(data.totalUsers ?? 0)
      }
    } catch (e) {
      if (requestId === usersRequestRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to load users')
      }
    } finally {
      if (requestId === usersRequestRef.current) {
        setLoadingUsers(false)
        setLoadingMoreUsers(false)
      }
    }
  }

  // First page on mount and whenever the applied search, status filter or sort changes
  useEffect(() => {
    loadUsers(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, statusFilter, unseenSort])

  const applySearch = () => {
    const next = userSearch.trim()
    if (next !== appliedSearch) setAppliedSearch(next)
    else loadUsers(true) // same search → acts as Refresh
  }

  const cycleUnseenSort = () => {
    setUnseenSort((prev) => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null))
  }

  const createUserByPhone = async () => {
    const phone = newPhone.replace(/\s+/g, '').replace(/^\+/, '')
    if (!phone) {
      setError('Enter a phone number')
      return
    }
    try {
      setCreatingUser(true)
      setError(null)
      const res = await authFetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create user')
      }
      setNewPhone('')
      await loadUsers(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const openEditor = async (userId: string, hasProfile: boolean) => {
    try {
      setError(null)
      setEditorUserId(userId)
      setEditorHasProfile(hasProfile)
      setImageFiles([])
      if (hasProfile) {
        const res = await authFetch(`${API_BASE}/admin/users/${userId}`)
        if (!res.ok) throw new Error('Failed to load user')
        const data = await res.json()
        setForm(data.profile ? profileToForm(data.profile as Record<string, unknown>) : emptyForm())
        const imgRes = await authFetch(`${API_BASE}/admin/users/${userId}/files`)
        if (imgRes.ok) {
          const imgData = await imgRes.json()
          const files = (imgData.files || []) as Array<{ key: string; url: string }>
          setExistingImages(files.map((f) => ({ key: f.key, url: f.url })))
        } else {
          setExistingImages([])
        }
      } else {
        setForm(emptyForm())
        setExistingImages([])
      }
      setEditorOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open editor')
    }
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditorUserId(null)
    setForm(emptyForm())
    setExistingImages([])
    setImageFiles([])
    setImageLightbox(null)
    setImageDeleteKey(null)
  }

  const saveProfile = async () => {
    if (!editorUserId) return
    try {
      setSavingProfile(true)
      setError(null)
      const payload = buildProfilePayload(form, editorHasProfile ? 'edit' : 'create')
      const url = `${API_BASE}/admin/users/${editorUserId}/profile`
      const res = await authFetch(url, {
        method: editorHasProfile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.details || 'Save failed')
      }
      setEditorHasProfile(true)
      // Patch the row in place so the admin keeps their position in the paginated list
      const savedName = `${form.firstName} ${form.lastName}`.trim() || null
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === editorUserId
            ? {
                ...u,
                hasProfile: true,
                name: savedName,
                isSubscribed: form.subscribed,
                verificationStatus: u.verificationStatus ?? 'pending',
                profileCreatedAt: u.profileCreatedAt ?? new Date().toISOString(),
                profileUpdatedAt: new Date().toISOString(),
              }
            : u
        )
      )
      closeEditor()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingProfile(false)
    }
  }

  const getFileType = (file: File): string => {
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'jpeg'
    if (file.type === 'image/png') return 'png'
    if (file.type === 'image/webp') return 'webp'
    return 'jpeg'
  }

  const uploadPendingImages = async () => {
    if (!editorUserId || imageFiles.length === 0) return
    try {
      setUploadingImages(true)
      setError(null)
      const compressedFiles = await Promise.all(
        imageFiles.map((file) =>
          imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: file.type,
          }).then(
            (blob) =>
              new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
          )
        )
      )
      const typesParam = compressedFiles.map((f) => getFileType(f)).join(',')
      const presignRes = await authFetch(
        `${API_BASE}/admin/users/${editorUserId}/files/presign?count=${compressedFiles.length}&types=${typesParam}`
      )
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}))
        throw new Error(err.error || 'Presign failed')
      }
      const { urls } = await presignRes.json()
      for (let i = 0; i < compressedFiles.length; i++) {
        const file = compressedFiles[i]
        const { url } = urls[i]
        const putRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
        if (!putRes.ok) throw new Error(`Upload failed for ${file.name}`)
      }
      setImageFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Refresh image list from S3 and save all keys to profile.photoKeys
      const imgRes = await authFetch(`${API_BASE}/admin/users/${editorUserId}/files`)
      if (imgRes.ok) {
        const imgData = await imgRes.json()
        const files = (imgData.files || []) as Array<{ key: string; url: string }>
        const refreshed = files.map((f) => ({ key: f.key, url: f.url }))
        setExistingImages(refreshed)

        // Persist photoKeys to the profile document
        const saveRes = await authFetch(`${API_BASE}/admin/users/${editorUserId}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoKeys: refreshed.map((f) => f.key) }),
        })
        if (!saveRes.ok) {
          throw new Error('Images uploaded but failed to save photoKeys to profile')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeProfileImage = async (key: string) => {
    if (!editorUserId) return
    const res = await authFetch(`${API_BASE}/admin/users/${editorUserId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Delete failed')
    }
    setExistingImages((prev) => prev.filter((x) => x.key !== key))
  }

  const confirmDeleteImage = async () => {
    if (!imageDeleteKey) return
    const keyToRemove = imageDeleteKey
    try {
      setImageDeleteBusy(true)
      setError(null)
      await removeProfileImage(keyToRemove)
      setImageDeleteKey(null)
      setImageLightbox((cur) => (cur?.key === keyToRemove ? null : cur))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setImageDeleteBusy(false)
    }
  }

  const updateField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const imageModals =
    mounted &&
    (imageLightbox || imageDeleteKey) &&
    createPortal(
      <>
        {imageLightbox && (
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onClick={() => setImageLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setImageLightbox(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Close preview"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageLightbox.url}
              alt="Profile photo preview"
              className="max-h-[min(90vh,900px)] max-w-full w-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="mt-3 text-center text-sm text-white/70">Click outside or press Esc to close</p>
          </div>
        )}
        {imageDeleteKey && (
          <div
            className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-photo-title"
            onClick={() => !imageDeleteBusy && setImageDeleteKey(null)}
          >
            <div
              className="w-full max-w-md rounded-t-2xl sm:rounded-xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="admin-delete-photo-title" className="text-lg font-semibold text-gray-900">
                Remove this photo?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                It will be deleted from storage for this user. You cannot undo this action.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={imageDeleteBusy}
                  onClick={() => setImageDeleteKey(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={imageDeleteBusy}
                  onClick={() => void confirmDeleteImage()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {imageDeleteBusy ? 'Removing…' : 'Remove photo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    )

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Create user</h2>
        <p className="text-sm text-gray-600">Adds a row in <code className="text-xs bg-gray-100 px-1 rounded">users</code>. They can sign in later with OTP on this phone.</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="sm:w-64">
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. 9198xxxxxxx"
              inputMode="tel"
              className="px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg w-full"
            />
          </div>
          <button
            type="button"
            onClick={createUserByPhone}
            disabled={creatingUser}
            className="px-4 py-2.5 sm:py-2 bg-myColor-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {creatingUser ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <h2 className="text-lg font-semibold text-gray-900 sm:mr-auto">All users ({totalUsers})</h2>
            <div className="flex gap-2">
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Filter by phone or email…"
                className="flex-1 sm:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
              />
              <button
                type="button"
                onClick={applySearch}
                className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <span className="sm:hidden">Search</span>
                <span className="hidden sm:inline">Apply filter / Refresh</span>
              </button>
            </div>
          </div>
          <VerificationStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            counts={statusCounts}
            total={totalUsers}
          />
          <button
            type="button"
            onClick={cycleUnseenSort}
            className="md:hidden inline-flex items-center gap-1 text-xs font-medium text-gray-600"
          >
            Sort by unseen requests
            <span className="text-gray-400">{unseenSort === 'desc' ? '↓' : unseenSort === 'asc' ? '↑' : '↕'}</span>
          </button>
        </div>
        {loadingUsers ? (
          <div className="p-8 text-center text-gray-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No users found</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="md:hidden divide-y divide-gray-100">
              {users.map((u) => (
                <li key={u.userId} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {u.hasProfile ? u.name || 'Unnamed profile' : <span className="text-gray-400 font-normal">No profile</span>}
                      </p>
                      {u.phone ? (
                        <a href={`tel:+${u.phone.replace(/^\+/, '')}`} className="block text-sm font-medium text-myColor-700">
                          {u.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600 truncate">{u.email || '—'}</p>
                      )}
                      <p className="text-[11px] font-mono text-gray-400 truncate">{u.userId}</p>
                    </div>
                    {(u.unseenConnectionRequests ?? 0) > 0 && (
                      <span
                        title="Unseen connection requests"
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-medium"
                      >
                        {u.unseenConnectionRequests} unseen
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-[11px] text-gray-500">
                    <span>Created: {formatAdminDate(u.profileCreatedAt ?? undefined)}</span>
                    <span>Last active: {formatAdminDate(u.profileLastActive ?? undefined)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {u.hasProfile && u.verificationStatus && <StatusBadge status={u.verificationStatus} />}
                    <button
                      type="button"
                      onClick={() => openEditor(u.userId, u.hasProfile)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full bg-myColor-100 text-myColor-800 hover:bg-myColor-200 ${u.hasProfile ? 'ml-auto' : 'flex-1'}`}
                    >
                      {u.hasProfile ? 'Edit' : 'Create profile'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Created at</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Updated at</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Last active</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      <button
                        type="button"
                        onClick={cycleUnseenSort}
                        title="Pending requests since last active (or updated at). Click to sort: high → low → default."
                        className="inline-flex items-center gap-1 hover:text-gray-800 focus:outline-none focus:text-myColor-600"
                      >
                        Unseen conn. requests
                        <span className="text-[10px] normal-case tracking-normal text-gray-400">
                          {unseenSort === 'desc' ? '↓' : unseenSort === 'asc' ? '↑' : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{u.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono">{u.userId}</td>
                      <td className="px-4 py-3 text-sm">{u.hasProfile ? (u.name || 'Yes') : '—'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {u.hasProfile && u.verificationStatus ? <StatusBadge status={u.verificationStatus} /> : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {formatAdminDate(u.profileCreatedAt ?? undefined)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {formatAdminDate(u.profileUpdatedAt ?? undefined)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {formatAdminDate(u.profileLastActive ?? undefined)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={
                            (u.unseenConnectionRequests ?? 0) > 0
                              ? 'inline-flex min-w-[1.5rem] justify-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium'
                              : 'text-gray-400'
                          }
                        >
                          {u.unseenConnectionRequests ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEditor(u.userId, u.hasProfile)}
                          className="text-sm px-3 py-1 rounded bg-myColor-100 text-myColor-800 hover:bg-myColor-200 whitespace-nowrap"
                        >
                          {u.hasProfile ? 'Edit profile' : 'Create profile'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <LoadMoreButton
                onClick={() => loadUsers(false)}
                loading={loadingMoreUsers}
                hasMore={usersHasMore}
                loaded={users.length}
                total={usersTotal}
              />
            </div>
          </>
        )}
      </div>

      {editorOpen && editorUserId && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeEditor}>
          <div
            className="bg-white sm:rounded-2xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-gray-100 flex justify-between items-center gap-3 shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editorHasProfile ? 'Edit profile' : 'Create profile'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-mono truncate">{editorUserId}</p>
              </div>
              <button type="button" onClick={closeEditor} aria-label="Close" className="shrink-0 -mr-2 p-2 text-gray-400 hover:text-gray-600 text-2xl leading-none">
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Creating for</span>
                  <select
                    value={form.creatingFor}
                    onChange={(e) => updateField('creatingFor', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2"
                  >
                    <option value="self">self</option>
                    <option value="daughter">daughter</option>
                    <option value="son">son</option>
                    <option value="other">other</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Gender</span>
                  <select
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value as 'M' | 'F')}
                    className="w-full border rounded-lg px-2 py-2"
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">First name</span>
                  <input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Last name</span>
                  <input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Date of birth (YYYY-MM-DD)</span>
                  <input value={form.dob} onChange={(e) => updateField('dob', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Native place</span>
                  <input value={form.nativePlace} onChange={(e) => updateField('nativePlace', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Height</span>
                  <select
                    value={form.height}
                    onChange={(e) => updateField('height', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2 bg-white"
                  >
                    <option value="">— Select height —</option>
                    {form.height && !HEIGHT_OPTIONS.includes(form.height) && (
                      <option value={form.height}>{form.height}</option>
                    )}
                    {HEIGHT_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Working status</span>
                  <select
                    value={form.workingStatus}
                    onChange={(e) => updateField('workingStatus', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2"
                  >
                    <option value="employed">employed</option>
                    <option value="self-employed">self-employed</option>
                    <option value="not-working">not-working</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Salary range</span>
                  <select
                    value={form.salaryRange}
                    onChange={(e) => updateField('salaryRange', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2"
                    disabled={form.workingStatus === 'not-working'}
                  >
                    <option value="">—</option>
                    <option value="<5L">&lt;5L</option>
                    <option value="5-15L">5-15L</option>
                    <option value="15-30L">15-30L</option>
                    <option value="30-50L">30-50L</option>
                    <option value=">50L">&gt;50L</option>
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Company</span>
                  <input value={form.company} onChange={(e) => updateField('company', e.target.value)} className="w-full border rounded-lg px-2 py-2" disabled={form.workingStatus === 'not-working'} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Designation</span>
                  <input value={form.designation} onChange={(e) => updateField('designation', e.target.value)} className="w-full border rounded-lg px-2 py-2" disabled={form.workingStatus === 'not-working'} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Work location</span>
                  <input value={form.workLocation} onChange={(e) => updateField('workLocation', e.target.value)} className="w-full border rounded-lg px-2 py-2" disabled={form.workingStatus === 'not-working'} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Education</span>
                  <input value={form.education} onChange={(e) => updateField('education', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">About me</span>
                  <textarea value={form.aboutMe} onChange={(e) => updateField('aboutMe', e.target.value)} rows={3} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Place of birth</span>
                  <input value={form.placeOfBirth} onChange={(e) => updateField('placeOfBirth', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Birth timing</span>
                  <input value={form.birthTiming} onChange={(e) => updateField('birthTiming', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Gothra</span>
                  <input value={form.gothra} onChange={(e) => updateField('gothra', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 block mb-1">Nakshatra</span>
                  <input value={form.nakshatra} onChange={(e) => updateField('nakshatra', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Kuldeva</span>
                  <input value={form.kuldeva} onChange={(e) => updateField('kuldeva', e.target.value)} className="w-full border rounded-lg px-2 py-2" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-gray-600 block mb-1">Food preference (optional)</span>
                  <select
                    value={form.foodPreference}
                    onChange={(e) =>
                      updateField('foodPreference', (e.target.value || '') as FoodPreference | '')
                    }
                    className="w-full border rounded-lg px-2 py-2 bg-white"
                  >
                    {FOOD_PREFERENCE_OPTIONS.map((o) => (
                      <option key={o.value || 'unset'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.subscribed} onChange={(e) => updateField('subscribed', e.target.checked)} />
                  Subscribed
                </label>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h3 className="font-medium text-gray-900">Photos (stored under this user in S3)</h3>
                <p className="text-xs text-gray-500">Max 5 originals. Processing to compressed/blurred may take a minute after upload.</p>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((img) => (
                    <div key={img.key} className="flex w-28 flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setImageLightbox({ url: img.url, key: img.key })}
                        className="relative block h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-left ring-offset-2 transition-shadow hover:ring-2 hover:ring-myColor-400 focus:outline-none focus:ring-2 focus:ring-myColor-500"
                        aria-label="View photo larger"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setImageLightbox({ url: img.url, key: img.key })}
                          className="text-xs font-medium text-myColor-700 hover:underline"
                        >
                          View full size
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageDeleteKey(img.key)}
                          className="text-left text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove…
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="text-sm"
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                />
                <button
                  type="button"
                  disabled={uploadingImages || imageFiles.length === 0}
                  onClick={uploadPendingImages}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {uploadingImages ? 'Uploading…' : 'Upload selected images'}
                </button>
              </div>

            </div>
            <div className="flex gap-3 px-4 py-3 sm:p-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-100 shrink-0">
              <button type="button" onClick={closeEditor} className="flex-1 py-2.5 sm:py-2 border border-gray-300 rounded-lg">
                Close
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex-1 py-2.5 sm:py-2 bg-myColor-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : editorHasProfile ? 'Save profile' : 'Create profile'}
              </button>
            </div>
          </div>
        </div>
      )}
      {imageModals}
    </div>
  )
}
