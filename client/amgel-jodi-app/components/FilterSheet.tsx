'use client'

import { useState, useEffect, useRef } from 'react'

export interface FilterOptions {
  ageMin?: number
  ageMax?: number
}

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: FilterOptions
  onApply: (filters: FilterOptions) => void
}

export default function FilterSheet({ isOpen, onClose, currentFilters, onApply }: FilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters)
  const [errors, setErrors] = useState<{ ageMin?: string; ageMax?: string }>({})
  const [ageMinInput, setAgeMinInput] = useState<string>('')
  const [ageMaxInput, setAgeMaxInput] = useState<string>('')

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters)
      setAgeMinInput(currentFilters.ageMin?.toString() || '')
      setAgeMaxInput(currentFilters.ageMax?.toString() || '')
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
    setErrors({})
  }

  const handleApply = () => {
    if (!validateFilters()) return
    onApply(localFilters)
    onClose()
  }

  const hasFilters = localFilters.ageMin !== undefined || localFilters.ageMax !== undefined
  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="absolute bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
          bottom-0 left-0 right-0 max-h-[85vh]
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:w-full md:max-w-lg
          animate-slide-up md:animate-fade-in
          flex flex-col"
      >
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
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

        <div className="flex-1 p-6 overflow-y-auto min-h-[200px]">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Enter age range (18-80)</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Age
              </label>
              <input
                type="number"
                min="18"
                max="80"
                placeholder="e.g. 25"
                value={ageMinInput}
                onChange={(e) => handleAgeChange(e.target.value, 'ageMin')}
                onFocus={handleInputFocus}
                className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 outline-none transition-colors ${
                  errors.ageMin
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-myColor-500 focus:ring-myColor-100'
                }`}
              />
              {errors.ageMin && (
                <p className="mt-1 text-xs text-red-500">{errors.ageMin}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Age
              </label>
              <input
                type="number"
                min="18"
                max="80"
                placeholder="e.g. 35"
                value={ageMaxInput}
                onChange={(e) => handleAgeChange(e.target.value, 'ageMax')}
                onFocus={handleInputFocus}
                className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 outline-none transition-colors ${
                  errors.ageMax
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-myColor-500 focus:ring-myColor-100'
                }`}
              />
              {errors.ageMax && (
                <p className="mt-1 text-xs text-red-500">{errors.ageMax}</p>
              )}
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-2">Quick select</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setLocalFilters(prev => ({ ...prev, ageMin: 25, ageMax: 30 })); setAgeMinInput('25'); setAgeMaxInput('30'); setErrors({}) }}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  25-30
                </button>
                <button
                  onClick={() => { setLocalFilters(prev => ({ ...prev, ageMin: 28, ageMax: 35 })); setAgeMinInput('28'); setAgeMaxInput('35'); setErrors({}) }}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  28-35
                </button>
                <button
                  onClick={() => { setLocalFilters(prev => ({ ...prev, ageMin: 30, ageMax: 40 })); setAgeMinInput('30'); setAgeMaxInput('40'); setErrors({}) }}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  30-40
                </button>
              </div>
            </div>
          </div>
        </div>

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
            Apply Filters
          </button>
        </div>

        <div className="h-safe-area-inset-bottom md:hidden" />
      </div>
    </div>
  )
}
