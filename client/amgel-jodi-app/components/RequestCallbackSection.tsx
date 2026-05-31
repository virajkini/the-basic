'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../app/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const LS_KEY = 'userRequestedCallback'

export default function RequestCallbackSection() {
  const { user } = useAuth()
  const [hasRequested, setHasRequested] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY) === 'true') setHasRequested(true)
    } catch {}
    if (user?.phone) setPhone(user.phone)
  }, [user?.phone])

  const openModal = () => {
    setError('')
    setSuccess(false)
    setShowModal(true)
  }

  const closeModal = () => {
    if (success) setHasRequested(true)
    setShowModal(false)
  }

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `Callback Request (${phone.trim()})`,
          phone: phone.trim(),
          subject: 'other',
          message: `User with phone ${phone.trim()} has requested a callback to help create their profile.`,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem(LS_KEY, 'true')
        setSuccess(true)
      } else {
        setError(data.message || data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-myColor-100" />
        <span className="text-xs font-medium text-myColor-300 tracking-widest uppercase">or</span>
        <div className="flex-1 h-px bg-myColor-100" />
      </div>

      {/* Callback card — same shadow as parent card, light tinted bg */}
      <div className="glass-card rounded-2xl px-8 py-7 bg-myColor-50/60 flex flex-col sm:flex-row items-center gap-5">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left">
          {hasRequested ? (
            <>
              <p className="font-semibold text-myColor-800 text-sm">Callback requested</p>
              <p className="text-xs text-myColor-400 mt-0.5">Our team will reach out soon.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-myColor-800 text-sm">Need help? We'll call you.</p>
              <p className="text-xs text-myColor-400 mt-0.5">Our team will create your profile for you.</p>
            </>
          )}
        </div>

        {/* Button */}
        {!hasRequested && (
          <button
            onClick={openModal}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white border border-myColor-200 text-myColor-700 font-semibold text-sm shadow-sm hover:border-myColor-400 hover:bg-myColor-50 transition-all duration-200 active:scale-95"
          >
            Request Callback
          </button>
        )}
      </div>

      {showModal && (
        <CallbackModal
          phone={phone}
          setPhone={setPhone}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          success={success}
        />
      )}
    </>
  )
}

function CallbackModal({
  phone,
  setPhone,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  success,
}: {
  phone: string
  setPhone: (v: string) => void
  onClose: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string
  success: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!success) inputRef.current?.focus()
  }, [success])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-scale-in overflow-hidden">
        {success ? (
          <SuccessView onClose={onClose} />
        ) : (
          <ConfirmView
            phone={phone}
            setPhone={setPhone}
            onClose={onClose}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            error={error}
            inputRef={inputRef}
          />
        )}
      </div>
    </div>
  )
}

function ConfirmView({
  phone,
  setPhone,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  inputRef,
}: {
  phone: string
  setPhone: (v: string) => void
  onClose: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string
  inputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="px-6 pt-6 pb-8">
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-xl font-display font-bold text-myColor-900 mb-1">We'll call you at</h2>
      <p className="text-sm text-myColor-400 mb-6">Edit your number if needed.</p>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-myColor-200 bg-myColor-50/40 text-myColor-900 font-medium text-base focus:border-myColor-500 focus:ring-2 focus:ring-myColor-200 focus:bg-white outline-none transition-all"
          placeholder="Your phone number"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl border border-myColor-200 text-myColor-600 font-semibold text-sm hover:bg-myColor-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-[2] py-3.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-myColor-500/25 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Confirming...
            </>
          ) : (
            'Confirm'
          )}
        </button>
      </div>
    </div>
  )
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 pt-8 pb-10 text-center">
      <div className="relative w-16 h-16 mx-auto mb-5">
        <div className="absolute inset-0 rounded-full bg-myColor-200 animate-ping opacity-40" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-myColor-500 to-myColor-700 flex items-center justify-center shadow-lg shadow-myColor-500/30 animate-scale-in">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-display font-bold text-myColor-900 mb-1">Great! We'll call you soon.</h2>
      <p className="text-sm text-myColor-400 mb-7">Our team will reach out within 24 hours.</p>

      <button
        onClick={onClose}
        className="px-8 py-3 bg-myColor-600 hover:bg-myColor-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-myColor-500/20 transition-all active:scale-95"
      >
        Done
      </button>
    </div>
  )
}
