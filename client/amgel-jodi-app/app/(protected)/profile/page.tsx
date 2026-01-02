'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { useAuth } from '../../context/AuthContext'
import Dropdown from '../../components/Dropdown'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type CreatingFor = 'self' | 'daughter' | 'son' | 'other'
type Gender = 'M' | 'F'
type SalaryRange = '<5L' | '5-15L' | '15-30L' | '30-50L' | '>50L'

interface FormData {
  creatingFor: CreatingFor | ''
  firstName: string
  lastName: string
  dob: string
  gender: Gender | ''
  nativePlace: string
  height: string
  workingStatus: boolean | null
  company: string
  designation: string
  workLocation: string
  salaryRange: SalaryRange | ''
  aboutMe: string
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
  workingStatus: boolean
  company?: string
  designation?: string
  workLocation?: string
  salaryRange?: SalaryRange
  aboutMe?: string
}

const STEPS = ['Basic Info', 'Photos', 'Work & About']

const HEIGHT_OPTIONS = [
  "4'6\" (137 cm)", "4'7\" (140 cm)", "4'8\" (142 cm)", "4'9\" (145 cm)", "4'10\" (147 cm)", "4'11\" (150 cm)",
  "5'0\" (152 cm)", "5'1\" (155 cm)", "5'2\" (157 cm)", "5'3\" (160 cm)", "5'4\" (163 cm)", "5'5\" (165 cm)",
  "5'6\" (168 cm)", "5'7\" (170 cm)", "5'8\" (173 cm)", "5'9\" (175 cm)", "5'10\" (178 cm)", "5'11\" (180 cm)",
  "6'0\" (183 cm)", "6'1\" (185 cm)", "6'2\" (188 cm)", "6'3\" (191 cm)", "6'4\" (193 cm)", "6'5\" (196 cm)",
  "6'6\" (198 cm)", "6'7\" (201 cm)", "6'8\" (203 cm)"
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
    workingStatus: null,
    company: '',
    designation: '',
    workLocation: '',
    salaryRange: '',
    aboutMe: '',
  })
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasFetched = useRef(false)

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxFiles = 5

  // Fetch existing profile and images
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


      // Fetch profile and images in parallel
      const [profileRes, imagesRes] = await Promise.all([
        fetch(`${API_BASE}/profiles/${user.userId}`, { credentials: 'include' }),
        fetch(`${API_BASE}/files`, { credentials: 'include' }),
      ])

      // Handle existing profile
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success && profileData.profile) {
          const p = profileData.profile
          setExistingProfile(p)
          setFormData({
            creatingFor: p.creatingFor || '',
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            dob: p.dob || '',
            gender: p.gender || '',
            nativePlace: p.nativePlace || '',
            height: p.height || '',
            workingStatus: p.workingStatus ?? null,
            company: p.company || '',
            designation: p.designation || '',
            workLocation: p.workLocation || '',
            salaryRange: p.salaryRange || '',
            aboutMe: p.aboutMe || '',
          })
        }
      }

      // Handle existing images
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

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  // File handling
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

  // Validation
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

      // Age validation
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
      if (formData.workingStatus === null) {
        errors.workingStatus = 'Please select working status'
      }
      if (formData.workingStatus === true) {
        if (!formData.company.trim()) errors.company = 'Company is required'
        if (!formData.designation.trim()) errors.designation = 'Designation is required'
        if (!formData.workLocation.trim()) errors.workLocation = 'Work location is required'
        if (!formData.salaryRange) errors.salaryRange = 'Please select salary range'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    window.scrollTo(0, 0)
  }

  // Upload images
  const uploadNewImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return []

    const compressedFiles = await Promise.all(
      selectedFiles.map(async ({ file }, index) => {
        const compressionOptions = {
          maxSizeMB: 1.5,
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

  // Submit form
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
      // Upload new images first
      await uploadNewImages()
      setUploadProgress(70)

      // Calculate age
      const birthDate = new Date(formData.dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      // Prepare profile data
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
        company: formData.workingStatus ? formData.company.trim() : undefined,
        designation: formData.workingStatus ? formData.designation.trim() : undefined,
        workLocation: formData.workingStatus ? formData.workLocation.trim() : undefined,
        salaryRange: formData.workingStatus ? formData.salaryRange : undefined,
        aboutMe: formData.aboutMe.trim() || undefined,
      }

      setUploadProgress(80)

      // Create or update profile
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

      // Clean up and redirect
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-myColor-200 border-t-myColor-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-myColor-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-myColor-900 mb-2">
            {existingProfile ? 'Edit Your Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-myColor-600">
            {existingProfile ? 'Update your information below' : 'Let\'s set up your matrimonial profile'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-myColor-600 text-white shadow-lg shadow-myColor-500/30'
                        : 'bg-myColor-100 text-myColor-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-xs mt-2 hidden md:block ${
                    index === currentStep ? 'text-myColor-700 font-medium' : 'text-myColor-400'
                  }`}>
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 md:mx-4 rounded ${
                    index < currentStep ? 'bg-green-500' : 'bg-myColor-100'
                  }`} style={{ minWidth: '40px' }} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-myColor-600 md:hidden">
            Step {currentStep + 1}: {STEPS[currentStep]}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              {/* Creating For */}
              <div>
                <label className="block text-sm font-medium text-myColor-700 mb-3">
                  This profile is for <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['self', 'daughter', 'son', 'other'] as CreatingFor[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateFormData('creatingFor', option)}
                      className={`py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 capitalize ${
                        formData.creatingFor === option
                          ? 'border-myColor-600 bg-myColor-50 text-myColor-700'
                          : 'border-myColor-100 hover:border-myColor-300 text-myColor-600'
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-myColor-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                      fieldErrors.firstName ? 'border-red-300' : 'border-myColor-100'
                    }`}
                    placeholder="Enter first name"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-myColor-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                      fieldErrors.lastName ? 'border-red-300' : 'border-myColor-100'
                    }`}
                    placeholder="Enter last name"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-myColor-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateFormData('dob', e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                      fieldErrors.dob ? 'border-red-300' : 'border-myColor-100'
                    }`}
                  />
                  {fieldErrors.dob && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.dob}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-myColor-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['M', 'F'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateFormData('gender', g)}
                        className={`py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                          formData.gender === g
                            ? 'border-myColor-600 bg-myColor-50 text-myColor-700'
                            : 'border-myColor-100 hover:border-myColor-300 text-myColor-600'
                        }`}
                      >
                        {g === 'M' ? 'Male' : 'Female'}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.gender && (
                    <p className="mt-2 text-sm text-red-500">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>

              {/* Native Place & Height */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nativePlace" className="block text-sm font-medium text-myColor-700 mb-2">
                    Native Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nativePlace"
                    type="text"
                    value={formData.nativePlace}
                    onChange={(e) => updateFormData('nativePlace', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                      fieldErrors.nativePlace ? 'border-red-300' : 'border-myColor-100'
                    }`}
                    placeholder="e.g., Mangalore, Goa"
                  />
                  {fieldErrors.nativePlace && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.nativePlace}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-myColor-700 mb-2">
                    Height <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="height"
                    options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
                    value={formData.height}
                    onChange={(value) => updateFormData('height', value)}
                    placeholder="Select height"
                    error={!!fieldErrors.height}
                    searchable
                  />
                  {fieldErrors.height && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.height}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-myColor-900 mb-2">
                  Upload Your Photos
                </h3>
                <p className="text-myColor-600 text-sm mb-4">
                  Add at least 1 photo (maximum 5). The first photo will be your primary profile picture.
                </p>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-myColor-700 mb-3">
                      Current Photos ({existingImages.length})
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {existingImages.map((img, index) => (
                        <div key={img.key} className="relative aspect-square">
                          <div className="w-full h-full rounded-xl overflow-hidden border-2 border-myColor-100">
                            <img src={img.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.key)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-myColor-600 text-white text-xs rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag & Drop Zone */}
                {remainingSlots > 0 && (
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                      dragActive
                        ? 'border-myColor-500 bg-myColor-50'
                        : 'border-myColor-200 hover:border-myColor-300 bg-white'
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
                    <div className="w-14 h-14 bg-myColor-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-7 h-7 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-myColor-700 font-medium mb-2">Drag & drop photos here</p>
                    <p className="text-myColor-500 text-sm mb-4">or click to browse</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2.5 bg-myColor-100 text-myColor-700 rounded-xl font-medium hover:bg-myColor-200 transition-colors"
                    >
                      Select Photos
                    </button>
                    <p className="text-myColor-400 text-xs mt-4">
                      {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                )}

                {/* New Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-myColor-700 mb-3">
                      New Photos to Upload ({selectedFiles.length})
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {selectedFiles.map((fileData, index) => (
                        <div key={fileData.id} className="relative aspect-square">
                          <div className="w-full h-full rounded-xl overflow-hidden border-2 border-myColor-100 bg-myColor-50">
                            <img src={fileData.preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewFile(fileData.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">
                            New
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fieldErrors.photos && (
                  <p className="mt-4 text-sm text-red-500">{fieldErrors.photos}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Work & About */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              {/* Working Status */}
              <div>
                <label className="block text-sm font-medium text-myColor-700 mb-3">
                  Are you currently working? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateFormData('workingStatus', true)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                      formData.workingStatus === true
                        ? 'border-myColor-600 bg-myColor-50 text-myColor-700'
                        : 'border-myColor-100 hover:border-myColor-300 text-myColor-600'
                    }`}
                  >
                    Yes, I'm working
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData('workingStatus', false)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                      formData.workingStatus === false
                        ? 'border-myColor-600 bg-myColor-50 text-myColor-700'
                        : 'border-myColor-100 hover:border-myColor-300 text-myColor-600'
                    }`}
                  >
                    Not working
                  </button>
                </div>
                {fieldErrors.workingStatus && (
                  <p className="mt-2 text-sm text-red-500">{fieldErrors.workingStatus}</p>
                )}
              </div>

              {/* Work Details (conditional) */}
              {formData.workingStatus === true && (
                <div className="space-y-4 p-4 bg-myColor-50 rounded-xl animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-myColor-700 mb-2">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                          fieldErrors.company ? 'border-red-300' : 'border-myColor-100'
                        }`}
                        placeholder="Company name"
                      />
                      {fieldErrors.company && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.company}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="designation" className="block text-sm font-medium text-myColor-700 mb-2">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="designation"
                        type="text"
                        value={formData.designation}
                        onChange={(e) => updateFormData('designation', e.target.value)}
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                          fieldErrors.designation ? 'border-red-300' : 'border-myColor-100'
                        }`}
                        placeholder="Your role"
                      />
                      {fieldErrors.designation && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.designation}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="workLocation" className="block text-sm font-medium text-myColor-700 mb-2">
                        Work Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="workLocation"
                        type="text"
                        value={formData.workLocation}
                        onChange={(e) => updateFormData('workLocation', e.target.value)}
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                          fieldErrors.workLocation ? 'border-red-300' : 'border-myColor-100'
                        }`}
                        placeholder="City / Country"
                      />
                      {fieldErrors.workLocation && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.workLocation}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="salaryRange" className="block text-sm font-medium text-myColor-700 mb-2">
                        Annual Salary (INR) <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        id="salaryRange"
                        options={[
                          { value: '<5L', label: 'Less than 5 Lakhs' },
                          { value: '5-15L', label: '5 - 15 Lakhs' },
                          { value: '15-30L', label: '15 - 30 Lakhs' },
                          { value: '30-50L', label: '30 - 50 Lakhs' },
                          { value: '>50L', label: 'More than 50 Lakhs' },
                        ]}
                        value={formData.salaryRange}
                        onChange={(value) => updateFormData('salaryRange', value)}
                        placeholder="Select range"
                        error={!!fieldErrors.salaryRange}
                      />
                      {fieldErrors.salaryRange && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.salaryRange}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* About Me */}
              <div>
                <label htmlFor="aboutMe" className="block text-sm font-medium text-myColor-700 mb-2">
                  About Me <span className="text-myColor-400">(Optional)</span>
                </label>
                <textarea
                  id="aboutMe"
                  value={formData.aboutMe}
                  onChange={(e) => updateFormData('aboutMe', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-white border-2 border-myColor-100 rounded-xl transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself, your interests, hobbies, and what you're looking for..."
                />
                <p className="mt-1 text-xs text-myColor-400 text-right">
                  {formData.aboutMe.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {saving && uploadProgress > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-myColor-700 font-medium">
                  {uploadProgress < 70 ? 'Uploading photos...' : 'Saving profile...'}
                </span>
                <span className="text-sm text-myColor-600">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-myColor-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-myColor-500 to-myColor-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-myColor-100">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={saving}
                className="px-6 py-3 text-myColor-700 font-medium rounded-xl hover:bg-myColor-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white font-semibold rounded-xl shadow-lg shadow-myColor-500/30 hover:shadow-xl hover:shadow-myColor-500/40 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    {existingProfile ? 'Update Profile' : 'Create Profile'}
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
    </div>
  )
}
