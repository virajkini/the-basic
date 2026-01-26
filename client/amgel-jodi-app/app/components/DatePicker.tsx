'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DatePickerProps {
  id?: string
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  minDate?: string // YYYY-MM-DD format
  maxDate?: string // YYYY-MM-DD format
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select date',
  error = false,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Parse current value or use defaults
  const parseDate = (dateStr: string) => {
    if (!dateStr) {
      // Default to 25 years ago
      const defaultYear = new Date().getFullYear() - 25
      return { year: defaultYear, month: 0, day: 1 }
    }
    const [year, month, day] = dateStr.split('-').map(Number)
    return { year, month: month - 1, day }
  }

  const { year: selectedYear, month: selectedMonth, day: selectedDay } = parseDate(value)

  // Calculate min/max years
  const maxYear = maxDate ? parseInt(maxDate.split('-')[0]) : new Date().getFullYear() - 18
  const minYear = minDate ? parseInt(minDate.split('-')[0]) : maxYear - 80

  // Get days in selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)

  // Calculate picker position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const pickerHeight = 320 // Approximate picker height

      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom
      const shouldOpenAbove = spaceBelow < pickerHeight && rect.top > pickerHeight

      setPickerPosition({
        top: shouldOpenAbove ? rect.top - pickerHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 280),
      })
    }
  }, [isOpen])

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        pickerRef.current && !pickerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true)
    }
  }

  const updateDate = (newYear: number, newMonth: number, newDay: number) => {
    // Ensure day is valid for the month
    const maxDay = getDaysInMonth(newYear, newMonth)
    const validDay = Math.min(newDay, maxDay)

    const dateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`
    onChange(dateStr)
  }

  const handleYearChange = (year: number) => {
    updateDate(year, selectedMonth, selectedDay)
  }

  const handleMonthChange = (month: number) => {
    updateDate(selectedYear, month, selectedDay)
  }

  const handleDayChange = (day: number) => {
    updateDate(selectedYear, selectedMonth, day)
    setIsOpen(false) // Close after selecting day
  }

  // Format display value
  const formatDisplayValue = () => {
    if (!value) return null
    const date = new Date(selectedYear, selectedMonth, selectedDay)
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const displayValue = formatDisplayValue()

  // Generate year options (descending order)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  // Picker content
  const pickerContent = isOpen && typeof document !== 'undefined' ? createPortal(
    <div
      ref={pickerRef}
      style={{
        position: 'fixed',
        top: pickerPosition.top,
        left: pickerPosition.left,
        width: pickerPosition.width,
        zIndex: 9999,
      }}
      className="bg-white border-2 border-myColor-100 rounded-xl shadow-xl shadow-myColor-900/10 overflow-hidden animate-fade-in"
    >
      {/* Month & Year Selectors */}
      <div className="flex border-b border-myColor-100">
        {/* Month Selector */}
        <div className="flex-1 border-r border-myColor-100">
          <div className="px-3 py-2 text-xs font-medium text-myColor-400 bg-myColor-50">Month</div>
          <div className="h-32 overflow-y-auto">
            {MONTHS.map((month, idx) => (
              <button
                key={month}
                type="button"
                onClick={() => handleMonthChange(idx)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  idx === selectedMonth
                    ? 'bg-myColor-100 text-myColor-700 font-medium'
                    : 'text-myColor-600 hover:bg-myColor-50'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Year Selector */}
        <div className="w-24">
          <div className="px-3 py-2 text-xs font-medium text-myColor-400 bg-myColor-50">Year</div>
          <div className="h-32 overflow-y-auto">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => handleYearChange(year)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  year === selectedYear
                    ? 'bg-myColor-100 text-myColor-700 font-medium'
                    : 'text-myColor-600 hover:bg-myColor-50'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day Grid */}
      <div className="p-3">
        <div className="text-xs font-medium text-myColor-400 mb-2">Day</div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayChange(day)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                day === selectedDay
                  ? 'bg-myColor-600 text-white'
                  : 'text-myColor-600 hover:bg-myColor-100'
              }`}
            >
              {day}
            </button>
          ))}
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
        <span className={displayValue ? 'text-myColor-900' : 'text-myColor-300'}>
          {displayValue || placeholder}
        </span>
        <svg
          className="w-5 h-5 text-myColor-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Picker rendered via portal */}
      {pickerContent}
    </div>
  )
}
