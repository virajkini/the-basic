'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  VERIFICATION_STATUS_OPTIONS,
  verificationStatusOption,
  type VerificationStatus,
} from '@/lib/verificationStatus'

interface Props {
  value: VerificationStatus
  /** Status currently persisted on the server, when `value` is an unsaved form value. Defaults to `value`. */
  savedValue?: VerificationStatus
  onChange: (next: VerificationStatus) => void
  /** Shown in the confirmation dialog, e.g. the profile's name */
  subjectLabel?: string
  disabled?: boolean
  busy?: boolean
  className?: string
}

/**
 * Status dropdown, colored by the current status. Moving an already-verified profile OUT of
 * 'verified' revokes their access, so that change asks for confirmation; every other change applies directly.
 */
export default function VerificationStatusSelect({ value, savedValue = value, onChange, subjectLabel, disabled, busy, className = '' }: Props) {
  const [pending, setPending] = useState<VerificationStatus | null>(null)
  const [mounted, setMounted] = useState(false)
  const current = verificationStatusOption(value)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending])

  const handleSelect = (next: VerificationStatus) => {
    if (next === value) return
    if (value === 'verified' && savedValue === 'verified') {
      setPending(next)
      return
    }
    onChange(next)
  }

  const confirm = () => {
    if (pending) onChange(pending)
    setPending(null)
  }

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        <select
          value={value}
          onChange={(e) => handleSelect(e.target.value as VerificationStatus)}
          disabled={disabled || busy}
          aria-label="Verification status"
          className={`w-full appearance-none rounded-full py-1.5 pl-3 pr-8 text-xs font-semibold ring-1 ring-inset cursor-pointer focus:outline-none focus:ring-2 focus:ring-myColor-500 disabled:cursor-wait disabled:opacity-60 ${current.badge}`}
        >
          {VERIFICATION_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-white text-gray-900">
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          {busy ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
          ) : (
            <svg className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </div>

      {mounted &&
        pending &&
        createPortal(
          <div
            className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-confirm-title"
            onClick={() => setPending(null)}
          >
            <div
              className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="verification-confirm-title" className="text-lg font-semibold text-gray-900">
                Remove verification?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {subjectLabel ? <span className="font-medium text-gray-900">{subjectLabel}</span> : 'This profile'} is
                currently verified. Changing to{' '}
                <span className="font-medium text-gray-900">{verificationStatusOption(pending).label}</span> will
                revoke verified access (full photos, PDF, Kundali).
              </p>
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Change status
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
