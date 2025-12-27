'use client'

import { useState, useEffect } from 'react'

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
  const [isAnimating, setIsAnimating] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Reset form when sheet opens
      setPhone('')
      setOtp('')
      setStep('phone')
      setError(null)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  // Handle iOS keyboard visibility
  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      // On iOS, when keyboard opens, viewport height decreases
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      const keyboardHeight = windowHeight - viewportHeight
      setKeyboardHeight(keyboardHeight > 50 ? keyboardHeight : 0) // Only set if significant change
    }

    // Use visualViewport API for better keyboard detection on iOS
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      handleResize() // Initial check
    } else {
      // Fallback for browsers without visualViewport
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen])

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
        // Smooth transition to OTP step
        setTimeout(() => {
          setStep('otp')
        }, 100)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (err) {
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
        // Close sheet and trigger auth check
        onClose()
        // Dispatch event to trigger auth check
       window.dispatchEvent(new Event('loginSuccess'))
        // Small delay to ensure cookies are set
        setTimeout(() => {
        //  window.location.reload()
        }, 100)
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen && !isAnimating) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-all duration-300 ease-out md:bottom-auto md:left-1/2 md:top-1/2 md:right-auto md:w-96 md:rounded-2xl ${
          isOpen
            ? 'translate-y-0 opacity-100 md:translate-x-[-50%] md:translate-y-[-50%] md:scale-100'
            : 'translate-y-full opacity-0 md:translate-x-[-50%] md:translate-y-[-40%] md:scale-95 pointer-events-none'
        }`}
        style={{
          bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0',
          maxHeight: keyboardHeight > 0 
            ? `calc(100vh - ${keyboardHeight}px - env(safe-area-inset-bottom, 0px))`
            : '90vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-myColor-900 animate-fade-in">
              {step === 'phone' ? 'Login' : 'Verify OTP'}
            </h2>
            <button
              onClick={onClose}
              className="text-myColor-600 hover:text-myColor-800 transition-colors hover:rotate-90 duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm animate-fade-in-up">
              {error}
            </div>
          )}

          <div key={step} className="animate-fade-in">
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP}>
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-myColor-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 1234567890"
                    className="w-full px-4 py-2 border border-myColor-300 rounded-lg focus:ring-2 focus:ring-myColor-500 focus:border-transparent transition-all duration-200"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-4">
                  <label htmlFor="otp" className="block text-sm font-medium text-myColor-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-4 py-2 border border-myColor-300 rounded-lg focus:ring-2 focus:ring-myColor-500 focus:border-transparent text-center text-2xl tracking-widest transition-all duration-200"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full py-2 text-myColor-600 hover:text-myColor-800 text-sm transition-colors"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

