'use client'

import { useState, useEffect, useRef } from 'react'

export interface FilterOptions {
  ageMin?: number
  ageMax?: number
  nativePlaces?: string[]
}

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: FilterOptions
  locationOptions: string[]
  onApply: (filters: FilterOptions) => void
}

export default function FilterSheet({ isOpen, onClose, currentFilters, locationOptions, onApply }: FilterSheetProps) {
  const quickLocations = locationOptions.slice(0, 5)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters)
  const [errors, setErrors] = useState<{ ageMin?: string; ageMax?: string }>({})
  const [ageMinInput, setAgeMinInput] = useState<string>('')
  const [ageMaxInput, setAgeMaxInput] = useState<string>('')
  const [locationSearch, setLocationSearch] = useState('')

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  // Push the sheet above the keyboard on mobile using visualViewport
  useEffect(() => {
    if (!isOpen) return
    const sheet = sheetRef.current
    const vv = window.visualViewport
    if (!sheet || !vv) return

    const sync = () => {
      if (window.innerWidth >= 768) return // md: modal, not bottom sheet
      const keyboardHeight = window.innerHeight - vv.height - (vv.offsetTop ?? 0)
      sheet.style.bottom = `${Math.max(0, keyboardHeight)}px`
      sheet.style.maxHeight = `${vv.height - 16}px`
    }

    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)

    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      sheet.style.bottom = ''
      sheet.style.maxHeight = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters)
      setAgeMinInput(currentFilters.ageMin?.toString() || '')
      setAgeMaxInput(currentFilters.ageMax?.toString() || '')
      setLocationSearch('')
      setErrors({})
    }
  }, [isOpen, currentFilters])

  const handleAgeChange = (value: string, field: 'ageMin' | 'ageMax') => {
    if (field === 'ageMin') {
      setAgeMinInput(value)
    } else {
      setAgeMaxInput(value)
    }

    const newErrors = { ...errors }
    delete newErrors[field]
    setErrors(newErrors)

    const num = value ? parseInt(value, 10) : undefined
    setLocalFilters(prev => ({
      ...prev,
      [field]: !isNaN(num as number) ? num : undefined
    }))
  }

  const toggleLocation = (loc: string) => {
    setLocalFilters(prev => {
      const current = prev.nativePlaces ?? []
      const next = current.includes(loc)
        ? current.filter(l => l !== loc)
        : [...current, loc]
      return { ...prev, nativePlaces: next.length ? next : undefined }
    })
  }

  const validateFilters = (): boolean => {
    const newErrors: { ageMin?: string; ageMax?: string } = {}

    if (ageMinInput && ageMinInput.trim() !== '') {
      const num = parseInt(ageMinInput, 10)
      if (isNaN(num)) {
        newErrors.ageMin = 'Enter a valid number'
      } else if (num < 18) {
        newErrors.ageMin = 'Minimum age is 18'
      } else if (num > 80) {
        newErrors.ageMin = 'Maximum age is 80'
      }
    }

    if (ageMaxInput && ageMaxInput.trim() !== '') {
      const num = parseInt(ageMaxInput, 10)
      if (isNaN(num)) {
        newErrors.ageMax = 'Enter a valid number'
      } else if (num < 18) {
        newErrors.ageMax = 'Minimum age is 18'
      } else if (num > 80) {
        newErrors.ageMax = 'Maximum age is 80'
      }
    }

    if (localFilters.ageMin && localFilters.ageMax && localFilters.ageMin > localFilters.ageMax) {
      newErrors.ageMin = 'Min must be less than max'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleClear = () => {
    setLocalFilters({})
    setAgeMinInput('')
    setAgeMaxInput('')
    setLocationSearch('')
    setErrors({})
  }

  const handleApply = () => {
    if (!validateFilters()) return
    onApply(localFilters)
    onClose()
  }

  const hasAgeFilter = localFilters.ageMin !== undefined || localFilters.ageMax !== undefined
  const selectedLocations = localFilters.nativePlaces ?? []
  const hasLocationFilter = selectedLocations.length > 0
  const hasFilters = hasAgeFilter || hasLocationFilter
  const hasErrors = Object.keys(errors).length > 0

  const filteredLocations = locationSearch.trim()
    ? locationOptions.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))
    : locationOptions

  const activeFilterCount = (hasAgeFilter ? 1 : 0) + (hasLocationFilter ? 1 : 0)

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="absolute bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
          bottom-0 left-0 right-0 max-h-[90vh]
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:w-full md:max-w-lg
          animate-slide-up md:animate-fade-in
          flex flex-col"
      >
        {/* Drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 bg-myColor-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm font-medium text-myColor-600 hover:text-myColor-700 hover:bg-myColor-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Age Filter Card */}
          <div className={`rounded-2xl border-2 transition-colors ${hasAgeFilter ? 'border-myColor-200 bg-myColor-50/40' : 'border-gray-100 bg-gray-50/60'}`}>
            {/* Card header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 ${hasAgeFilter ? 'text-myColor-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className={`text-sm font-bold tracking-wide ${hasAgeFilter ? 'text-myColor-700' : 'text-gray-500'}`}>
                  Age Range
                </h3>
              </div>
              {hasAgeFilter && (
                <span className="text-xs font-semibold text-myColor-600 bg-myColor-100 px-2 py-0.5 rounded-full">
                  {localFilters.ageMin ?? '—'} – {localFilters.ageMax ?? '—'}
                </span>
              )}
            </div>

            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Min age</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    placeholder="e.g. 25"
                    value={ageMinInput}
                    onChange={(e) => handleAgeChange(e.target.value, 'ageMin')}
                    onFocus={handleInputFocus}
                    className={`w-full px-3 py-2.5 border rounded-xl bg-white focus:ring-2 outline-none transition-colors text-sm ${
                      errors.ageMin
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-myColor-500 focus:ring-myColor-100'
                    }`}
                  />
                  {errors.ageMin && <p className="mt-1 text-xs text-red-500">{errors.ageMin}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max age</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    placeholder="e.g. 35"
                    value={ageMaxInput}
                    onChange={(e) => handleAgeChange(e.target.value, 'ageMax')}
                    onFocus={handleInputFocus}
                    className={`w-full px-3 py-2.5 border rounded-xl bg-white focus:ring-2 outline-none transition-colors text-sm ${
                      errors.ageMax
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-myColor-500 focus:ring-myColor-100'
                    }`}
                  />
                  {errors.ageMax && <p className="mt-1 text-xs text-red-500">{errors.ageMax}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[{ label: '25–30', min: 25, max: 30 }, { label: '28–35', min: 28, max: 35 }, { label: '30–40', min: 30, max: 40 }].map(opt => {
                  const active = localFilters.ageMin === opt.min && localFilters.ageMax === opt.max
                  return (
                    <button
                      key={opt.label}
                      onClick={() => {
                        if (active) {
                          setLocalFilters(prev => ({ ...prev, ageMin: undefined, ageMax: undefined }))
                          setAgeMinInput('')
                          setAgeMaxInput('')
                        } else {
                          setLocalFilters(prev => ({ ...prev, ageMin: opt.min, ageMax: opt.max }))
                          setAgeMinInput(opt.min.toString())
                          setAgeMaxInput(opt.max.toString())
                        }
                        setErrors({})
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all font-medium ${
                        active
                          ? 'bg-myColor-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-myColor-300 hover:text-myColor-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Location Filter Card */}
          <div className={`rounded-2xl border-2 transition-colors ${hasLocationFilter ? 'border-myColor-200 bg-myColor-50/40' : 'border-gray-100 bg-gray-50/60'}`}>
            {/* Card header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 ${hasLocationFilter ? 'text-myColor-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className={`text-sm font-bold tracking-wide ${hasLocationFilter ? 'text-myColor-700' : 'text-gray-500'}`}>
                  Native Place
                </h3>
              </div>
              {hasLocationFilter && (
                <span className="text-xs font-semibold text-myColor-600 bg-myColor-100 px-2 py-0.5 rounded-full">
                  {selectedLocations.length} selected
                </span>
              )}
            </div>

            <div className="px-4 pb-4 space-y-3">
              {/* Quick select chips */}
              <div className="flex flex-wrap gap-2">
                {quickLocations.map(loc => {
                  const active = selectedLocations.includes(loc)
                  return (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all font-medium ${
                        active
                          ? 'bg-myColor-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-myColor-300 hover:text-myColor-600'
                      }`}
                    >
                      {loc}
                    </button>
                  )
                })}
              </div>

              {/* Search box */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search all places…"
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-myColor-100 focus:border-myColor-400 outline-none transition-colors text-sm"
                />
                {locationSearch && (
                  <button
                    onClick={() => setLocationSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Compact checklist */}
              <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
                {filteredLocations.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400 text-center">No places found</p>
                ) : (
                  filteredLocations.map(loc => {
                    const checked = selectedLocations.includes(loc)
                    return (
                      <label
                        key={loc}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors select-none ${
                          checked ? 'bg-myColor-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-colors`}
                          style={{ width: '17px', height: '17px', backgroundColor: checked ? 'var(--myColor-600, #7c3aed)' : 'transparent', borderColor: checked ? 'var(--myColor-600, #7c3aed)' : '#d1d5db' }}
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm flex-1 ${checked ? 'text-myColor-800 font-medium' : 'text-gray-700'}`}>
                          {loc}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleLocation(loc)} className="sr-only" />
                      </label>
                    )
                  })
                )}
              </div>

              {/* Selected tags */}
              {hasLocationFilter && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLocations.map(loc => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-semibold bg-myColor-100 text-myColor-700 rounded-full"
                    >
                      {loc}
                      <button
                        onClick={() => toggleLocation(loc)}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-myColor-200 transition-colors"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={hasErrors}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              hasErrors
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-myColor-600 text-white hover:bg-myColor-700'
            }`}
          >
            {activeFilterCount > 0 ? `Apply (${activeFilterCount})` : 'Apply Filters'}
          </button>
        </div>

        <div className="h-safe-area-inset-bottom md:hidden" />
      </div>
    </div>
  )
}
