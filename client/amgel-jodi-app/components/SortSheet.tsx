'use client'

import { useEffect, useRef } from 'react'

export type SortOption = 'recent' | 'updated' | 'age_asc' | 'age_desc' | 'height_asc' | 'height_desc'

interface SortSheetProps {
  isOpen: boolean
  onClose: () => void
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'age_asc', label: 'Age: Youngest First' },
  { value: 'age_desc', label: 'Age: Oldest First' },
  { value: 'height_asc', label: 'Height: Shortest First' },
  { value: 'height_desc', label: 'Height: Tallest First' },
]

export default function SortSheet({ isOpen, onClose, currentSort, onSortChange }: SortSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on escape key
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

  const handleSelect = (value: SortOption) => {
    onSortChange(value)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Mobile: Bottom Sheet / Desktop: Centered Modal */}
      <div
        ref={sheetRef}
        className="absolute bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
          bottom-0 left-0 right-0 max-h-[80vh]
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:w-full md:max-w-md
          animate-slide-up md:animate-fade-in"
      >
        {/* Handle bar (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Sort By</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-1 overflow-y-auto max-h-[60vh]">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentSort === option.value
                  ? 'bg-myColor-50 text-myColor-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {/* Radio button */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentSort === option.value
                  ? 'border-myColor-600'
                  : 'border-gray-300'
              }`}>
                {currentSort === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-myColor-600" />
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom md:hidden" />
      </div>
    </div>
  )
}
