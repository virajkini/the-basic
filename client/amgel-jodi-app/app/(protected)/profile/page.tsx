'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { useAuth } from '../../context/AuthContext'
import Dropdown from '../../components/Dropdown'
import DatePicker from '../../components/DatePicker'
import ProfileDetailView from '../../../components/ProfileDetailView'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type CreatingFor = 'self' | 'daughter' | 'son' | 'other'
type Gender = 'M' | 'F'
type SalaryRange = '<5L' | '5-15L' | '15-30L' | '30-50L' | '>50L'
type WorkingStatus = 'employed' | 'self-employed' | 'not-working'

interface FormData {
  creatingFor: CreatingFor | ''
  firstName: string
  lastName: string
  dob: string
  gender: Gender | ''
  nativePlace: string
  height: string
  workingStatus: WorkingStatus | ''
  company: string
  designation: string
  workLocation: string
  salaryRange: SalaryRange | ''
  aboutMe: string
  education: string
  placeOfBirth: string
  birthTiming: string
  gothra: string
  nakshatra: string
}

interface FileWithPreview {
  file: File
  preview: string
  id: string
}

interface ExistingImage {
  key: string
  url: string
}

interface Profile {
  _id: string
  creatingFor: CreatingFor
  firstName: string
  lastName: string
  dob: string
  gender: Gender
  nativePlace: string
  height: string
  workingStatus: WorkingStatus | boolean
  company?: string
  designation?: string
  workLocation?: string
  salaryRange?: SalaryRange
  aboutMe?: string
  education?: string
  placeOfBirth?: string
  birthTiming?: string
  gothra?: string
  nakshatra?: string
}

const STEPS = [
  { id: 'basic', title: 'About You', subtitle: 'Let\'s start with the basics' },
  { id: 'photos', title: 'Your Photos', subtitle: 'Show your best self' },
  { id: 'work', title: 'Career & Bio', subtitle: 'Almost there!' },
]

const HEIGHT_OPTIONS = [
  "4'6\" (137 cm)", "4'7\" (140 cm)", "4'8\" (142 cm)", "4'9\" (145 cm)", "4'10\" (147 cm)", "4'11\" (150 cm)",
  "5'0\" (152 cm)", "5'1\" (155 cm)", "5'2\" (157 cm)", "5'3\" (160 cm)", "5'4\" (163 cm)", "5'5\" (165 cm)",
  "5'6\" (168 cm)", "5'7\" (170 cm)", "5'8\" (173 cm)", "5'9\" (175 cm)", "5'10\" (178 cm)", "5'11\" (180 cm)",
  "6'0\" (183 cm)", "6'1\" (185 cm)", "6'2\" (188 cm)", "6'3\" (191 cm)", "6'4\" (193 cm)", "6'5\" (196 cm)",
  "6'6\" (198 cm)", "6'7\" (201 cm)", "6'8\" (203 cm)"
]

const GOTHRA_OPTIONS = [
  "Agastya", "Angirasa", "Atri", "Bharadwaja", "Bhrigu", "Gautama", "Kashyapa", "Vasishta",
  "Vishvamitra", "Jamadagni", "Kanva", "Kutsa", "Kaundinya", "Gargi", "Vats", "Sandilya",
  "Maudgalya", "Sankriti", "Bhadarayana", "Shatamarshana", "Kaushika", "Kaushal", "Katyayana",
  "Upamanyu", "Panini", "Garge", "Kamsha", "Vacch", "Other"
]

const NAKSHATRA_OPTIONS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya",
  "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
  "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

export default function ProfilePage() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    creatingFor: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    nativePlace: '',
    height: '',
    workingStatus: '',
    company: '',
    designation: '',
    workLocation: '',
    salaryRange: '',
    aboutMe: '',
    education: '',
    placeOfBirth: '',
    birthTiming: '',
    gothra: '',
    nakshatra: '',
  })
  const [showKundaliSection, setShowKundaliSection] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasFetched = useRef(false)

  const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'https://amgeljodi.com'

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxFiles = 5

  useEffect(() => {
    if (user?.userId && !hasFetched.current) {
      hasFetched.current = true
      fetchData()
    }
  }, [user?.userId])

  const fetchData = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)

      const [profileRes, imagesRes] = await Promise.all([
        fetch(`${API_BASE}/profiles/${user.userId}`, { credentials: 'include' }),
        fetch(`${API_BASE}/files`, { credentials: 'include' }),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success && profileData.profile) {
          const p = profileData.profile
          setExistingProfile(p)
          let workingStatusValue: WorkingStatus | '' = ''
          if (typeof p.workingStatus === 'boolean') {
            workingStatusValue = p.workingStatus ? 'employed' : 'not-working'
          } else if (p.workingStatus) {
            workingStatusValue = p.workingStatus as WorkingStatus
          }
          setFormData({
            creatingFor: p.creatingFor || '',
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            dob: p.dob || '',
            gender: p.gender || '',
            nativePlace: p.nativePlace || '',
            height: p.height || '',
            workingStatus: workingStatusValue,
            company: p.company || '',
            designation: p.designation || '',
            workLocation: p.workLocation || '',
            salaryRange: p.salaryRange || '',
            aboutMe: p.aboutMe || '',
            education: p.education || '',
            placeOfBirth: p.placeOfBirth || '',
            birthTiming: p.birthTiming || '',
            gothra: p.gothra || '',
            nakshatra: p.nakshatra || '',
          })
          if (p.placeOfBirth || p.birthTiming || p.gothra || p.nakshatra) {
            setShowKundaliSection(true)
          }
        }
      }

      if (imagesRes.ok) {
        const imagesData = await imagesRes.json()
        if (imagesData.success && imagesData.files) {
          setExistingImages(imagesData.files)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  const generateId = () => Math.random().toString(36).substring(2, 15)
  const remainingSlots = maxFiles - existingImages.length - selectedFiles.length

  const validateAndAddFiles = useCallback((files: File[]) => {
    setError(null)

    if (files.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`)
      return
    }

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      setError('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError('Each image must be under 10MB')
      return
    }

    const newFiles: FileWithPreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: generateId(),
    }))

    setSelectedFiles(prev => [...prev, ...newFiles])
  }, [remainingSlots])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) validateAndAddFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      allowedTypes.includes(file.type)
    )
    if (files.length > 0) validateAndAddFiles(files)
  }, [validateAndAddFiles])

  const removeNewFile = (id: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const removeExistingImage = async (key: string) => {
    if (!confirm('Delete this photo?')) return

    try {
      const encodedKey = encodeURIComponent(key)
      const res = await fetch(`${API_BASE}/files/${encodedKey}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setExistingImages(prev => prev.filter(img => img.key !== key))
    } catch {
      setError('Failed to delete image')
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.creatingFor) errors.creatingFor = 'Please select who this profile is for'
      if (!formData.firstName.trim()) errors.firstName = 'First name is required'
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
      if (!formData.dob) errors.dob = 'Date of birth is required'
      if (!formData.gender) errors.gender = 'Please select gender'
      if (!formData.nativePlace.trim()) errors.nativePlace = 'Native place is required'
      if (!formData.height) errors.height = 'Please select height'

      if (formData.dob) {
        const birthDate = new Date(formData.dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        if (age < 18) errors.dob = 'Must be at least 18 years old'
        if (age > 100) errors.dob = 'Please enter a valid date of birth'
      }
    }

    if (step === 1) {
      const totalImages = existingImages.length + selectedFiles.length
      if (totalImages === 0) {
        errors.photos = 'Please upload at least one photo'
      }
    }

    if (step === 2) {
      if (!formData.workingStatus) {
        errors.workingStatus = 'Please select working status'
      }
      if (!existingProfile && !agreedToTerms) {
        errors.terms = 'Please agree to the Terms of Service and Privacy Policy'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
      // Scroll the parent layout's main element to top
      document.querySelector('main')?.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    document.querySelector('main')?.scrollTo(0, 0)
  }

  const uploadNewImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return []

    const compressedFiles = await Promise.all(
      selectedFiles.map(async ({ file }, index) => {
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: file.type as string,
        }
        const compressedFile = await imageCompression(file, compressionOptions)
        setUploadProgress(Math.round(((index + 1) / selectedFiles.length) * 30))
        return new File([compressedFile], file.name, { type: file.type, lastModified: Date.now() })
      })
    )

    const getFileType = (file: File): string => {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'jpeg'
      if (file.type === 'image/png') return 'png'
      if (file.type === 'image/webp') return 'webp'
      return 'jpeg'
    }

    const fileTypes = compressedFiles.map(file => getFileType(file))
    const typesParam = fileTypes.join(',')

    const presignRes = await fetch(
      `${API_BASE}/files/presign?count=${compressedFiles.length}&types=${typesParam}`,
      { credentials: 'include' }
    )

    if (!presignRes.ok) {
      const errorData = await presignRes.json()
      throw new Error(errorData.error || 'Failed to get upload URLs')
    }

    const { urls } = await presignRes.json()
    setUploadProgress(40)

    const uploadedKeys: string[] = []
    for (let i = 0; i < compressedFiles.length; i++) {
      const file = compressedFiles[i]
      const { url, key } = urls[i]

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })

      if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`)
      uploadedKeys.push(key)
      setUploadProgress(40 + Math.round(((i + 1) / compressedFiles.length) * 30))
    }

    return uploadedKeys
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    if (!user?.userId) {
      setError('User ID not found')
      return
    }

    setSaving(true)
    setError(null)
    setUploadProgress(0)

    try {
      await uploadNewImages()
      setUploadProgress(70)

      const birthDate = new Date(formData.dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      const isWorking = formData.workingStatus === 'employed' || formData.workingStatus === 'self-employed'
      const profilePayload = {
        userId: user.userId,
        creatingFor: formData.creatingFor,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        nativePlace: formData.nativePlace.trim(),
        height: formData.height,
        workingStatus: formData.workingStatus,
        company: isWorking && formData.company.trim() ? formData.company.trim() : undefined,
        designation: isWorking && formData.designation.trim() ? formData.designation.trim() : undefined,
        workLocation: isWorking && formData.workLocation.trim() ? formData.workLocation.trim() : undefined,
        salaryRange: isWorking && formData.salaryRange ? formData.salaryRange : undefined,
        education: formData.education.trim() || undefined,
        aboutMe: formData.aboutMe.trim() || undefined,
        placeOfBirth: formData.placeOfBirth.trim() || undefined,
        birthTiming: formData.birthTiming || undefined,
        gothra: formData.gothra || undefined,
        nakshatra: formData.nakshatra || undefined,
      }

      setUploadProgress(80)

      const method = existingProfile ? 'PUT' : 'POST'
      const url = existingProfile
        ? `${API_BASE}/profiles/${user.userId}`
        : `${API_BASE}/profiles`

      const profileRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profilePayload),
      })

      if (!profileRes.ok) {
        const errorData = await profileRes.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }

      setUploadProgress(100)

      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview))
      setSelectedFiles([])

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  // Calculate progress percentage
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-myColor-100 border-t-myColor-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-myColor-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Minimal Progress Bar - Sticky at top */}
      <div className="sticky top-0 z-10 bg-white border-b border-myColor-100">
        <div className="h-1 bg-myColor-100">
          <div
            className="h-full bg-gradient-to-r from-myColor-500 to-myColor-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Header */}
        <div className="px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-myColor-400 uppercase tracking-wider font-medium">
                Step {currentStep + 1} of {STEPS.length}
              </p>
              <h1 className="text-xl font-display font-semibold text-myColor-900 mt-0.5">
                {STEPS[currentStep].title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Preview Button - Only show if profile exists */}
              {existingProfile && (
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-myColor-600 hover:text-myColor-800 hover:bg-myColor-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="hidden sm:inline">Preview</span>
                </button>
              )}
              {/* Step Indicators */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx < currentStep
                        ? 'bg-green-500'
                        : idx === currentStep
                        ? 'bg-myColor-500 w-6'
                        : 'bg-myColor-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-8 animate-fade-in">
              {/* Profile For */}
              <div>
                <label className="block text-sm font-medium text-myColor-800 mb-3">
                  This profile is for
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['self', 'daughter', 'son', 'other'] as CreatingFor[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateFormData('creatingFor', option)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                        formData.creatingFor === option
                          ? 'bg-myColor-600 text-white shadow-lg shadow-myColor-500/25'
                          : 'bg-white border border-myColor-200 text-myColor-600 hover:border-myColor-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {fieldErrors.creatingFor && (
                  <p className="mt-2 text-sm text-red-500">{fieldErrors.creatingFor}</p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-myColor-800 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white border rounded-xl transition-all text-myColor-900 placeholder:text-myColor-300 ${
                      fieldErrors.firstName ? 'border-red-300' : 'border-myColor-200 focus:border-myColor-500'
                    }`}
                    placeholder="First name"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-myColor-800 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white border rounded-xl transition-all text-myColor-900 placeholder:text-myColor-300 ${
                      fieldErrors.lastName ? 'border-red-300' : 'border-myColor-200 focus:border-myColor-500'
                    }`}
                    placeholder="Last name"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-myColor-800 mb-2">
                    Date of Birth
                  </label>
                  <DatePicker
                    id="dob"
                    value={formData.dob}
                    onChange={(value) => updateFormData('dob', value)}
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    placeholder="Select date"
                    error={!!fieldErrors.dob}
                  />
                  {fieldErrors.dob && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.dob}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-myColor-800 mb-2">
                    Gender
                    {existingProfile && <span className="text-xs text-myColor-400 ml-1">(locked)</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['M', 'F'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => !existingProfile && updateFormData('gender', g)}
                        disabled={!!existingProfile}
                        className={`py-3.5 rounded-xl font-medium transition-all duration-200 ${
                          formData.gender === g
                            ? 'bg-myColor-600 text-white shadow-lg shadow-myColor-500/25'
                            : 'bg-white border border-myColor-200 text-myColor-600 hover:border-myColor-400'
                        } ${existingProfile ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {g === 'M' ? 'Male' : 'Female'}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.gender && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>

              {/* Native Place & Height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nativePlace" className="block text-sm font-medium text-myColor-800 mb-2">
                    Native Place
                  </label>
                  <input
                    id="nativePlace"
                    type="text"
                    value={formData.nativePlace}
                    onChange={(e) => updateFormData('nativePlace', e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white border rounded-xl transition-all text-myColor-900 placeholder:text-myColor-300 ${
                      fieldErrors.nativePlace ? 'border-red-300' : 'border-myColor-200 focus:border-myColor-500'
                    }`}
                    placeholder="e.g., Mangalore"
                  />
                  {fieldErrors.nativePlace && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.nativePlace}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-myColor-800 mb-2">
                    Height
                  </label>
                  <Dropdown
                    id="height"
                    label="Select Height"
                    options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
                    value={formData.height}
                    onChange={(value) => updateFormData('height', value)}
                    placeholder="Select"
                    error={!!fieldErrors.height}
                    searchable
                  />
                  {fieldErrors.height && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.height}</p>
                  )}
                </div>
              </div>

              {/* Kundali Section - Collapsible */}
              <div className="pt-4 border-t border-myColor-100">
                <button
                  type="button"
                  onClick={() => setShowKundaliSection(!showKundaliSection)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-myColor-50 to-transparent rounded-xl hover:from-myColor-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-myColor-800">Jatak / Kundali</p>
                      <p className="text-xs text-myColor-400">Optional details</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-myColor-400 transition-transform duration-200 ${showKundaliSection ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showKundaliSection && (
                  <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="placeOfBirth" className="block text-sm font-medium text-myColor-800 mb-2">
                          Place of Birth
                        </label>
                        <input
                          id="placeOfBirth"
                          type="text"
                          value={formData.placeOfBirth}
                          onChange={(e) => updateFormData('placeOfBirth', e.target.value)}
                          className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-300"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label htmlFor="birthTiming" className="block text-sm font-medium text-myColor-800 mb-2">
                          Birth Time
                        </label>
                        <input
                          id="birthTiming"
                          type="time"
                          value={formData.birthTiming}
                          onChange={(e) => updateFormData('birthTiming', e.target.value)}
                          className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="gothra" className="block text-sm font-medium text-myColor-800 mb-2">
                          Gothra
                        </label>
                        <Dropdown
                          id="gothra"
                          label="Select Gothra"
                          options={GOTHRA_OPTIONS.map((g) => ({ value: g, label: g }))}
                          value={formData.gothra}
                          onChange={(value) => updateFormData('gothra', value)}
                          placeholder="Select"
                          searchable
                        />
                      </div>
                      <div>
                        <label htmlFor="nakshatra" className="block text-sm font-medium text-myColor-800 mb-2">
                          Nakshatra
                        </label>
                        <Dropdown
                          id="nakshatra"
                          label="Select Nakshatra"
                          options={NAKSHATRA_OPTIONS.map((n) => ({ value: n, label: n }))}
                          value={formData.nakshatra}
                          onChange={(value) => updateFormData('nakshatra', value)}
                          placeholder="Select"
                          searchable
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-myColor-600 text-sm">
                Add up to 5 photos. Your first photo will be your main profile picture.
              </p>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-myColor-800 mb-3">
                    Current Photos
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((img, index) => (
                      <div key={img.key} className="relative aspect-square group">
                        <div className="w-full h-full rounded-2xl overflow-hidden bg-myColor-100 relative">
                          <img
                            src={img.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          {/* Fallback placeholder */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-myColor-400 -z-10">
                            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">Refresh</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.key)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-myColor-600 text-white text-xs font-medium rounded-full">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Zone */}
              {remainingSlots > 0 && (
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    dragActive
                      ? 'border-myColor-500 bg-myColor-50'
                      : 'border-myColor-200 bg-white hover:border-myColor-400 hover:bg-myColor-50/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-myColor-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-myColor-800 font-medium mb-1">Drop photos here</p>
                  <p className="text-myColor-400 text-sm mb-4">or tap to browse</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-myColor-600 text-white rounded-full font-medium hover:bg-myColor-700 transition-colors shadow-lg shadow-myColor-500/25"
                  >
                    Choose Photos
                  </button>
                  <p className="text-myColor-300 text-xs mt-4">
                    {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} available
                  </p>
                </div>
              )}

              {/* New Selected Files */}
              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-myColor-800 mb-3">
                    Ready to Upload
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedFiles.map((fileData, index) => (
                      <div key={fileData.id} className="relative aspect-square group">
                        <div className="w-full h-full rounded-2xl overflow-hidden bg-myColor-100">
                          <img src={fileData.preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(fileData.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          New
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fieldErrors.photos && (
                <p className="text-sm text-red-500 text-center">{fieldErrors.photos}</p>
              )}
            </div>
          )}

          {/* Step 3: Work & About */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-fade-in">
              {/* Employment Status */}
              <div>
                <label className="block text-sm font-medium text-myColor-800 mb-3">
                  Employment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'employed', label: 'Employed' },
                    { value: 'self-employed', label: 'Business' },
                    { value: 'not-working', label: 'Not Working' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormData('workingStatus', option.value as WorkingStatus)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.workingStatus === option.value
                          ? 'bg-myColor-600 text-white shadow-lg shadow-myColor-500/25'
                          : 'bg-white border border-myColor-200 text-myColor-600 hover:border-myColor-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {fieldErrors.workingStatus && (
                  <p className="mt-2 text-sm text-red-500">{fieldErrors.workingStatus}</p>
                )}
              </div>

              {/* Work Details */}
              {(formData.workingStatus === 'employed' || formData.workingStatus === 'self-employed') && (
                <div className="space-y-4 p-4 bg-myColor-50/50 rounded-2xl animate-fade-in">
                  <p className="text-xs text-myColor-400 font-medium uppercase tracking-wider">Optional Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-myColor-800 mb-2">
                        {formData.workingStatus === 'self-employed' ? 'Business' : 'Company'}
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-300"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="designation" className="block text-sm font-medium text-myColor-800 mb-2">
                        Role
                      </label>
                      <input
                        id="designation"
                        type="text"
                        value={formData.designation}
                        onChange={(e) => updateFormData('designation', e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-300"
                        placeholder="Your role"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="workLocation" className="block text-sm font-medium text-myColor-800 mb-2">
                        Location
                      </label>
                      <input
                        id="workLocation"
                        type="text"
                        value={formData.workLocation}
                        onChange={(e) => updateFormData('workLocation', e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-300"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label htmlFor="salaryRange" className="block text-sm font-medium text-myColor-800 mb-2">
                        Income (INR)
                      </label>
                      <Dropdown
                        id="salaryRange"
                        label="Select Income Range"
                        options={[
                          { value: '<5L', label: '< 5 Lakhs' },
                          { value: '5-15L', label: '5-15 Lakhs' },
                          { value: '15-30L', label: '15-30 Lakhs' },
                          { value: '30-50L', label: '30-50 Lakhs' },
                          { value: '>50L', label: '50+ Lakhs' },
                        ]}
                        value={formData.salaryRange}
                        onChange={(value) => updateFormData('salaryRange', value)}
                        placeholder="Select"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-myColor-800 mb-2">
                  Education <span className="text-myColor-400 font-normal">(optional)</span>
                </label>
                <input
                  id="education"
                  type="text"
                  value={formData.education}
                  onChange={(e) => updateFormData('education', e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-300"
                  placeholder="e.g., B.Tech, MBA"
                />
              </div>

              {/* About Me */}
              <div>
                <label htmlFor="aboutMe" className="block text-sm font-medium text-myColor-800 mb-2">
                  About Me <span className="text-myColor-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="aboutMe"
                  value={formData.aboutMe}
                  onChange={(e) => updateFormData('aboutMe', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3.5 bg-white border border-myColor-200 rounded-xl text-myColor-900 placeholder:text-myColor-300 resize-none"
                  placeholder="Share a bit about yourself, your interests, and what you're looking for..."
                />
                <p className="mt-1.5 text-xs text-myColor-400 text-right">
                  {formData.aboutMe.length}/500
                </p>
              </div>

              {/* Terms Agreement */}
              {!existingProfile && (
                <div className="p-4 bg-myColor-50/50 rounded-2xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked)
                        setFieldErrors(prev => ({ ...prev, terms: '' }))
                      }}
                      className="w-5 h-5 mt-0.5 rounded border-myColor-300 text-myColor-600 focus:ring-myColor-500 flex-shrink-0"
                    />
                    <span className="text-sm text-myColor-700 leading-relaxed">
                      I agree to the{' '}
                      <a href={`${HOME_URL}/terms`} target="_blank" rel="noopener noreferrer" className="text-myColor-600 underline font-medium">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href={`${HOME_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="text-myColor-600 underline font-medium">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {fieldErrors.terms && (
                    <p className="mt-2 text-sm text-red-500">{fieldErrors.terms}</p>
                  )}
                </div>
              )}
            </div>
          )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-myColor-100 safe-area-pb">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* Upload Progress */}
          {saving && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-myColor-700 font-medium">
                  {uploadProgress < 70 ? 'Uploading photos...' : 'Saving profile...'}
                </span>
                <span className="text-sm text-myColor-500">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-myColor-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-myColor-500 to-myColor-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Back Button */}
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={saving}
                className="flex items-center justify-center w-12 h-12 rounded-xl border border-myColor-200 text-myColor-600 hover:bg-myColor-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next/Submit Button */}
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-4 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white font-semibold rounded-xl shadow-lg shadow-myColor-500/25 hover:shadow-xl hover:shadow-myColor-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>{existingProfile ? 'Update Profile' : 'Create Profile'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {showPreview && existingProfile && (
        <ProfileDetailView
          profileId={existingProfile._id}
          images={existingImages.map(img => img.url)}
          onClose={() => setShowPreview(false)}
          isOwnProfile
        />
      )}
    </div>
  )
}
