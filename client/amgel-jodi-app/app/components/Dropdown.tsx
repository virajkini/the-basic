'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  id?: string
  label?: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  searchable?: boolean
}

export default function Dropdown({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error = false,
  disabled = false,
  searchable = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Focus search input when sheet opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, searchable])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // Bottom sheet content
  const bottomSheet = isOpen && typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={() => {
          setIsOpen(false)
          setSearchQuery('')
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[70vh] flex flex-col"
        style={{ animationDuration: '200ms' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-myColor-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-myColor-100">
          <h3 className="text-lg font-semibold text-myColor-900">
            {label || placeholder}
          </h3>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
            }}
            className="p-2 -mr-2 text-myColor-400 hover:text-myColor-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        {searchable && (
          <div className="px-4 py-3 border-b border-myColor-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-myColor-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 bg-myColor-50 border border-myColor-100 rounded-xl text-base focus:outline-none focus:border-myColor-300"
              />
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
          {filteredOptions.length === 0 ? (
            <div className="px-5 py-8 text-center text-myColor-400">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-5 py-4 text-left transition-colors duration-150 flex items-center justify-between border-b border-myColor-50 active:bg-myColor-100 ${
                  option.value === value
                    ? 'bg-myColor-50'
                    : ''
                }`}
              >
                <span className={`text-base ${option.value === value ? 'text-myColor-800 font-medium' : 'text-myColor-600'}`}>
                  {option.label}
                </span>
                {option.value === value && (
                  <svg
                    className="w-5 h-5 text-myColor-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3.5 bg-white border rounded-xl transition-all text-left flex items-center justify-between ${
          error
            ? 'border-red-300'
            : isOpen
            ? 'border-myColor-500 ring-2 ring-myColor-500/20'
            : 'border-myColor-200 hover:border-myColor-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      >
        <span className={selectedOption ? 'text-myColor-900' : 'text-myColor-300'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className="w-5 h-5 text-myColor-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Bottom sheet rendered via portal */}
      {bottomSheet}
    </div>
  )
}
