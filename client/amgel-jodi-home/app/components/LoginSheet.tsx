'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Script from 'next/script'
import msg91 from '../services/msg91'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧' },
] as const

type Country = (typeof COUNTRIES)[number]

interface LoginSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginSheet({ isOpen, onClose }: LoginSheetProps) {
  // Form state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // MSG91 state
  const [scriptLoaded, setScriptLoaded] = useState(msg91.isScriptLoaded())
  const [captchaReady, setCaptchaReady] = useState(false)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // Initialize MSG91 when ready
  const initializeMSG91 = useCallback(async () => {
    if (!scriptLoaded) return

    // Wait a bit for DOM to be ready
    await new Promise((r) => setTimeout(r, 100))

    const success = await msg91.initialize()
    if (success) {
      // Watch for captcha to appear
      const container = document.getElementById(msg91.getCaptchaContainerId())
      if (container) {
        const checkCaptcha = () => {
          if (container.children.length > 0) {
            setCaptchaReady(true)
            return true
          }
          return false
        }

        // Check immediately
        if (!checkCaptcha()) {
          // Watch for changes
          const observer = new MutationObserver(() => {
            if (checkCaptcha()) {
              observer.disconnect()
            }
          })
          observer.observe(container, { childList: true, subtree: true })

          // Cleanup after 10 seconds
          setTimeout(() => observer.disconnect(), 10000)
        }
      }
    }
  }, [scriptLoaded])

  // Handle script load
  const handleScriptLoad = useCallback(() => {
    msg91.markScriptLoaded()
    setScriptLoaded(true)
  }, [])

  // Handle modal open
  useEffect(() => {
    if (!isOpen) return

    // Lock body scroll
    scrollYRef.current = window.scrollY
    document.body.style.cssText = `overflow:hidden;position:fixed;top:-${scrollYRef.current}px;left:0;right:0;`

    // Show modal
    requestAnimationFrame(() => setIsVisible(true))

    // Reset form
    setPhone('')
    setOtp('')
    setStep('phone')
    setError(null)
    setSelectedCountry(COUNTRIES[0])
    setShowCountryDropdown(false)
    setCaptchaReady(msg91.isInitialized())

    // Initialize MSG91 if not already done
    if (!msg91.isInitialized()) {
      initializeMSG91()
    }
  }, [isOpen, initializeMSG91])

  // Re-initialize when script loads
  useEffect(() => {
    if (scriptLoaded && isOpen && !msg91.isInitialized()) {
      initializeMSG91()
    }
  }, [scriptLoaded, isOpen, initializeMSG91])

  // Handle modal close
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setIsVisible(false)

    setTimeout(() => {
      document.body.style.cssText = ''
      window.scrollTo(0, scrollYRef.current)
      setIsClosing(false)
      onClose()
    }, 300)
  }, [onClose])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
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
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, step])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showCountryDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCountryDropdown])

  // Format phone with country code
  const formatPhone = (num: string) => selectedCountry.dialCode + num.replace(/\D/g, '')

  // Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!msg91.isCaptchaVerified()) {
      setError('Please complete the captcha verification')
      return
    }

    setLoading(true)
    try {
      await msg91.sendOtp(formatPhone(phone))
      setStep('otp')
    } catch (err) {
      console.error('Send OTP error:', err)
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const accessToken = await msg91.verifyOtp(otp)

      const response = await fetch(`${API_BASE}/auth/msg91/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken, phone: formatPhone(phone) }),
      })

      const data = await response.json()

      if (response.ok) {
        handleClose()
        window.dispatchEvent(new Event('loginSuccess'))
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true)
    setError(null)
    try {
      await msg91.resendOtp()
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Change number - captcha stays verified
  const handleChangeNumber = () => {
    setStep('phone')
    setOtp('')
    setError(null)
  }

  // Backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }

  if (!isOpen && !isClosing) return null

  return (
    <>
      <Script
        src="https://verify.msg91.com/otp-provider.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />

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
          className="absolute inset-0 flex items-start justify-center p-4 pt-[12vh] md:pt-[15vh] overflow-y-auto"
          style={{
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : 16,
          }}
          onClick={handleBackdropClick}
        >
          <div
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Avatar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <div className="px-6 pb-6 pt-12">
              {/* Header */}
              <div className="text-center mb-6 relative">
                <h2 className="text-2xl font-heading font-bold text-myColor-900">
                  {step === 'phone' ? 'Welcome' : 'Verify OTP'}
                </h2>
                <p className="text-sm text-myColor-500 mt-1">
                  {step === 'phone'
                    ? 'Enter your phone number to continue'
                    : `Code sent to +${selectedCountry.dialCode} ${phone}`}
                </p>
                <button
                  onClick={handleClose}
                  className="absolute -top-8 -right-2 w-10 h-10 flex items-center justify-center rounded-full bg-myColor-50 text-myColor-600 hover:bg-myColor-100 transition-all hover:rotate-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Phone Step */}
              {step === 'phone' && (
                <form onSubmit={handleSendOTP}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-myColor-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex">
                      {/* Country Dropdown */}
                      <div ref={dropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1.5 px-3 py-3.5 bg-myColor-50 border-2 border-r-0 border-myColor-100 rounded-l-xl hover:bg-myColor-100 transition-colors focus:outline-none"
                        >
                          <span className="text-xl">{selectedCountry.flag}</span>
                          <span className="text-sm font-medium text-myColor-700">
                            +{selectedCountry.dialCode}
                          </span>
                          <svg
                            className={`w-4 h-4 text-myColor-400 transition-transform ${
                              showCountryDropdown ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-myColor-100 rounded-xl shadow-lg z-50 overflow-hidden">
                            {COUNTRIES.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setShowCountryDropdown(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-myColor-50 transition-colors ${
                                  selectedCountry.code === country.code ? 'bg-myColor-50' : ''
                                }`}
                              >
                                <span className="text-xl">{country.flag}</span>
                                <span className="flex-1 text-left text-sm text-myColor-800">
                                  {country.name}
                                </span>
                                <span className="text-sm text-myColor-500">+{country.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Phone Input */}
                      <input
                        ref={inputRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="flex-1 px-4 py-3.5 bg-myColor-50 border-2 border-l-0 border-myColor-100 rounded-r-xl focus:outline-none focus:bg-white transition-colors text-myColor-900 placeholder:text-myColor-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Captcha */}
                  <div className="mb-4 flex justify-center min-h-[78px] relative">
                    {!captchaReady && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[300px] h-[74px] bg-myColor-100 rounded-lg overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-r from-myColor-100 via-myColor-50 to-myColor-100 animate-shimmer" />
                        </div>
                      </div>
                    )}
                    <div
                      id={msg91.getCaptchaContainerId()}
                      className={`transition-opacity duration-300 ${captchaReady ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !phone}
                    className="w-full py-3.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold shadow-lg shadow-myColor-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading && <Spinner />}
                    {loading ? 'Sending...' : 'Send OTP'}
                    {!loading && <ArrowIcon />}
                  </button>
                </form>
              )}

              {/* OTP Step */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-myColor-700 mb-2">
                      Enter 4-digit OTP
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="0000"
                      maxLength={4}
                      className="w-full px-4 py-4 bg-myColor-50 border-2 border-myColor-100 rounded-xl focus:outline-none focus:bg-white text-center text-3xl tracking-[0.5em] font-bold text-myColor-900 placeholder:text-myColor-300"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 4}
                    className="w-full py-3.5 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-xl font-semibold shadow-lg shadow-myColor-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
                  >
                    {loading && <Spinner />}
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                    {!loading && <ArrowIcon />}
                  </button>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      className="py-2 text-myColor-600 hover:text-myColor-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Change Number
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="py-2 text-myColor-600 hover:text-myColor-800 text-sm font-medium disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}
