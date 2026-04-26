'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { authFetch } from '../../utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

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
  phone: string
  userCreatedAt: string
  hasProfile: boolean
  name: string | null
  isVerified: boolean
  isSubscribed: boolean
  profileCreatedAt: string | null
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
  verified: boolean
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
  verified: false,
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
    verified: Boolean(p.verified),
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
    placeOfBirth: form.placeOfBirth || undefined,
    birthTiming: form.birthTiming || undefined,
    gothra: form.gothra || undefined,
    nakshatra: form.nakshatra || undefined,
    kuldeva: form.kuldeva || undefined,
  }
  if (mode === 'create') {
    base.verified = form.verified
    base.subscribed = form.subscribed
  } else {
    base.verified = form.verified
    base.subscribed = form.subscribed
  }
  return base
}

export default function OnboardingTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')
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

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      setError(null)
      const q = userSearch.trim() ? `?q=${encodeURIComponent(userSearch.trim())}` : ''
      const res = await authFetch(`${API_BASE}/admin/users${q}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load users')
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial list only; use Refresh / Apply filter
  }, [])

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
      await loadUsers()
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
        if (data.profile) {
          setForm(profileToForm(data.profile as Record<string, unknown>))
        } else {
          setForm(emptyForm())
        }
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
      await loadUsers()
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
      const imgRes = await authFetch(`${API_BASE}/admin/users/${editorUserId}/files`)
      if (imgRes.ok) {
        const imgData = await imgRes.json()
        const files = (imgData.files || []) as Array<{ key: string; url: string }>
        setExistingImages(files.map((f) => ({ key: f.key, url: f.url })))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingImages(false)
    }
  }

  const deleteImage = async (key: string) => {
    if (!editorUserId) return
    try {
      setError(null)
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const updateField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Create user</h2>
        <p className="text-sm text-gray-600">Adds a row in <code className="text-xs bg-gray-100 px-1 rounded">users</code>. They can sign in later with OTP on this phone.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. 9198xxxxxxx"
              className="px-3 py-2 border border-gray-300 rounded-lg w-64"
            />
          </div>
          <button
            type="button"
            onClick={createUserByPhone}
            disabled={creatingUser}
            className="px-4 py-2 bg-myColor-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {creatingUser ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-end">
          <h2 className="text-lg font-semibold text-gray-900 mr-auto">All users</h2>
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Filter by phone…"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
          />
          <button
            type="button"
            onClick={() => loadUsers()}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            Apply filter / Refresh
          </button>
        </div>
        {loadingUsers ? (
          <div className="p-8 text-center text-gray-500">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{u.phone}</td>
                      <td className="px-4 py-3 text-xs font-mono">{u.userId}</td>
                      <td className="px-4 py-3 text-sm">{u.hasProfile ? (u.name || 'Yes') : '—'}</td>
                      <td className="px-4 py-3 text-sm">{u.hasProfile ? (u.isVerified ? 'Yes' : 'No') : '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEditor(u.userId, u.hasProfile)}
                          className="text-sm px-3 py-1 rounded bg-myColor-100 text-myColor-800 hover:bg-myColor-200"
                        >
                          {u.hasProfile ? 'Edit profile' : 'Create profile'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editorOpen && editorUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeEditor}>
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editorHasProfile ? 'Edit profile' : 'Create profile'}
                </h2>
                <p className="text-sm text-gray-500 font-mono">{editorUserId}</p>
              </div>
              <button type="button" onClick={closeEditor} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
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
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.verified} onChange={(e) => updateField('verified', e.target.checked)} />
                  Verified
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.subscribed} onChange={(e) => updateField('subscribed', e.target.checked)} />
                  Subscribed
                </label>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h3 className="font-medium text-gray-900">Photos (stored under this user in S3)</h3>
                <p className="text-xs text-gray-500">Max 5 originals. Processing to compressed/blurred may take a minute after upload.</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.key} className="relative w-24 h-24 border rounded overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => deleteImage(img.key)}
                        className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
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

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeEditor} className="flex-1 py-2 border border-gray-300 rounded-lg">
                  Close
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-2 bg-myColor-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {savingProfile ? 'Saving…' : editorHasProfile ? 'Save profile' : 'Create profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
