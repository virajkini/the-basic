'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface LoginSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginSheet({ isOpen, onClose }: LoginSheetProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const scrollYRef = useRef(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      scrollYRef.current = window.scrollY

      // Lock body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollYRef.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'

      // Trigger entrance animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })

      // Reset form
      setPhone('')
      setOtp('')
      setStep('phone')
      setError(null)
      setIsClosing(false)
    }
  }, [isOpen])

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setIsVisible(false)

    // Wait for animation to complete
    setTimeout(() => {
      // Unlock body scroll
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''

      // Restore scroll position
      window.scrollTo(0, scrollYRef.current)

      setIsClosing(false)
      onClose()
    }, 300)
  }, [onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  // Detect keyboard on mobile using visualViewport
  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
        window.visualViewport.removeEventListener('scroll', handleResize)
      }
      setKeyboardHeight(0)
    }
  }, [isOpen])

  // Auto-focus input when step changes
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, step])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        handleClose()
        window.dispatchEvent(new Event('loginSuccess'))
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Don't render if not open and not in closing animation
  if (!isOpen && !isClosing) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal Container - Adjusts for keyboard */}
      <div
        className="absolute inset-0 flex items-start md:items-center justify-center p-4 pt-[10vh] md:pt-4 overflow-y-auto"
        style={{
          paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : 16,
        }}
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          style={{
            marginBottom: keyboardHeight > 0 ? 'auto' : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div className="px-6 pb-6 pt-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 text-center pr-10">
                <h2 className="text-2xl font-heading font-bold text-myColor-900">
                  {step === 'phone' ? 'Welcome' : 'Verify OTP'}
                </h2>
                <p className="text-sm text-myColor-500 mt-1">
                  {step === 'phone'
                    ? 'Enter your phone number to continue'
                    : `Code sent to ${phone}`}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-myColor-50 text-myColor-600 hover:bg-myColor-100 hover:text-myColor-800 transition-all duration-200 hover:rotate-90"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm animate-fade-in flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Form Content */}
            <div key={step} className="animate-fade-in">
              {step === 'phone' ? (
                <form onSubmit={handleSendOTP}>
                  <div className="mb-6">
                    <label htmlFor="phone" className="block text-sm font-medium text-myColor-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-myColor-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 1234567890"
                        className="w-full pl-12 pr-4 py-3.5 bg-myColor-50 border-2 border-myColor-100 rounded-xl focus:ring-2 focus:ring-myColor-500 focus:border-myColor-500 focus:bg-white transition-all duration-200 text-myColor-900 placeholder:text-myColor-400"
                        required
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold shadow-lg shadow-myColor-500/30 hover:shadow-xl hover:shadow-myColor-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP}>
                  <div className="mb-6">
                    <label htmlFor="otp" className="block text-sm font-medium text-myColor-700 mb-2">
                      Enter 4-digit OTP
                    </label>
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="0000"
                      maxLength={4}
                      className="w-full px-4 py-4 bg-myColor-50 border-2 border-myColor-100 rounded-xl focus:ring-2 focus:ring-myColor-500 focus:border-myColor-500 focus:bg-white text-center text-3xl tracking-[0.5em] font-bold transition-all duration-200 text-myColor-900 placeholder:text-myColor-300"
                      required
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 4}
                    className="w-full py-3.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold shadow-lg shadow-myColor-500/30 hover:shadow-xl hover:shadow-myColor-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-3 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full py-2.5 text-myColor-600 hover:text-myColor-800 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
