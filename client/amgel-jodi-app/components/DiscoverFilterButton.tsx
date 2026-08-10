'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import FilterSheet, { FilterOptions } from './FilterSheet'

interface Props {
  currentFilters: FilterOptions
  locationOptions: string[]
  onApply: (filters: FilterOptions) => void
}

export default function DiscoverFilterButton({ currentFilters, locationOptions, onApply }: Props) {
  const [open, setOpen] = useState(false)

  const hasAgeFilter = !!(currentFilters.ageMin || currentFilters.ageMax)
  const hasLocationFilter = !!(currentFilters.nativePlaces?.length)
  const activeFilterCount = (hasAgeFilter ? 1 : 0) + (hasLocationFilter ? 1 : 0)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
          activeFilterCount > 0
            ? 'bg-myColor-600 text-white shadow-lg shadow-myColor-500/20'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="relative">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </div>
        <span>Filter</span>
      </button>

      {createPortal(
        <FilterSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          currentFilters={currentFilters}
          locationOptions={locationOptions}
          onApply={onApply}
        />,
        document.body
      )}
    </>
  )
}
