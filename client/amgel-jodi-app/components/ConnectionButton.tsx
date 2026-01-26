'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { useAuth } from '../app/context/AuthContext'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | null

interface ConnectionState {
  status: ConnectionStatus
  connectionId: string | null
  isSender: boolean
}

interface QuotaStatus {
  dailyRemaining: number
  dailyLimit: number | null
  totalRemaining: number
  totalAvailable: number
}

interface ConnectionButtonProps {
  targetUserId: string
  onStatusChange?: (status: ConnectionStatus) => void
}

// Module-level tracking - stores Promise so second mount can await it
const inFlightRequests = new Map<string, Promise<ConnectionState>>()
const defaultState: ConnectionState = { status: null, connectionId: null, isSender: false }

function ConnectionButton({ targetUserId, onStatusChange }: ConnectionButtonProps) {
  const { user } = useAuth()
  const [connectionState, setConnectionState] = useState<ConnectionState>(defaultState)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Confirmation popup state
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(false)

  // Success animation state
  const [showSuccess, setShowSuccess] = useState(false)

  // Error state
  const [error, setError] = useState<{ type: string; message: string } | null>(null)

  // Fetch current connection status (no caching - always fetch fresh)
  useEffect(() => {
    if (!user?.userId || !targetUserId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchStatus = async () => {
      // Check if request already in flight
      let request = inFlightRequests.get(targetUserId)

      if (!request) {
        // Start new request
        request = (async () => {
          try {
            const response = await authFetch(`${API_BASE}/connections/status/${targetUserId}`)
            if (response.ok) {
              const data = await response.json()
              return {
                status: data.status,
                connectionId: data.connection?._id || null,
                isSender: data.isSender ?? false,
              }
            }
            return defaultState
          } catch (error) {
            console.error('Error fetching connection status:', error)
            return defaultState
          } finally {
            inFlightRequests.delete(targetUserId)
          }
        })()

        inFlightRequests.set(targetUserId, request)
      }

      const result = await request
      if (!cancelled) {
        setConnectionState(result)
        setLoading(false)
      }
    }

    fetchStatus()

    return () => {
      cancelled = true
    }
  }, [user?.userId, targetUserId])

  // Fetch quota and show confirmation popup
  const handleSendClick = useCallback(async () => {
    setQuotaLoading(true)
    setError(null)

    try {
      const response = await authFetch(`${API_BASE}/connections/quota`)
      if (response.ok) {
        const data = await response.json()
        setQuotaStatus(data.quota)
        setShowConfirmPopup(true)
      }
    } catch (error) {
      console.error('Error fetching quota:', error)
      setError({ type: 'FETCH_ERROR', message: 'Failed to check quota. Please try again.' })
    } finally {
      setQuotaLoading(false)
    }
  }, [])

  // Handle confirmed send request
  const handleConfirmSend = useCallback(async () => {
    setShowConfirmPopup(false)
    setActionLoading(true)
    setError(null)

    try {
      const response = await authFetch(`${API_BASE}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId }),
      })

      const data = await response.json()

      if (response.ok) {
        setConnectionState({
          status: 'PENDING',
          connectionId: data.connection._id,
          isSender: true,
        })
        onStatusChange?.('PENDING')

        // Show success animation
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2500)
      } else if (response.status === 429) {
        // Quota exceeded
        setError({
          type: data.error,
          message: data.message || 'You have reached your limit.',
        })
        if (data.quota) {
          setQuotaStatus(data.quota)
        }
      } else {
        setError({
          type: 'SEND_ERROR',
          message: data.error || 'Failed to send request. Please try again.',
        })
      }
    } catch (error) {
      console.error('Error sending request:', error)
      setError({ type: 'NETWORK_ERROR', message: 'Network error. Please try again.' })
    } finally {
      setActionLoading(false)
    }
  }, [targetUserId, onStatusChange])

  // Handle accept request
  const handleAcceptRequest = async () => {
    if (!connectionState.connectionId) return
    setActionLoading(true)
    try {
      const response = await authFetch(`${API_BASE}/connections/${connectionState.connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (response.ok) {
        setConnectionState((prev) => ({ ...prev, status: 'ACCEPTED' }))
        onStatusChange?.('ACCEPTED')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle reject request
  const handleRejectRequest = async () => {
    if (!connectionState.connectionId) return
    setActionLoading(true)
    try {
      const response = await authFetch(`${API_BASE}/connections/${connectionState.connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        setConnectionState({
          status: null,
          connectionId: null,
          isSender: false,
        })
        onStatusChange?.(null)
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Don't show button if viewing own profile
  if (user?.userId === targetUserId) {
    return null
  }

  // Only show to verified users
  if (!user?.verified) {
    return (
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Profile verification pending
            </p>
            <p className="text-xs text-amber-600 mt-1">
              You can send connection requests once your profile is verified
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  // Success animation overlay
  if (showSuccess) {
    return (
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl animate-fade-in">
          {/* Animated checkmark */}
          <div className="relative w-16 h-16 mb-3">
            <svg className="w-16 h-16 text-green-500" viewBox="0 0 52 52">
              <circle
                className="animate-[circle_0.6s_ease-in-out_forwards]"
                cx="26"
                cy="26"
                r="25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  strokeDasharray: 166,
                  strokeDashoffset: 166,
                  animation: 'circle 0.6s ease-in-out forwards',
                }}
              />
              <path
                className="animate-[check_0.3s_0.6s_ease-in-out_forwards]"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27l7.8 7.8L38 18"
                style={{
                  strokeDasharray: 48,
                  strokeDashoffset: 48,
                  animation: 'check 0.3s 0.6s ease-in-out forwards',
                }}
              />
            </svg>
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
                    left: '50%',
                    top: '50%',
                    animation: `confetti 0.8s ${i * 0.1}s ease-out forwards`,
                    transform: `rotate(${i * 45}deg) translateY(-30px)`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-lg font-semibold text-green-700">Request Sent!</p>
          <p className="text-sm text-green-600 mt-1">Waiting for their response</p>
        </div>

        <style jsx>{`
          @keyframes circle {
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes check {
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes confetti {
            0% {
              transform: rotate(var(--rotation)) translateY(0) scale(0);
              opacity: 1;
            }
            100% {
              transform: rotate(var(--rotation)) translateY(-40px) scale(1);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  // Accepted state
  if (connectionState.status === 'ACCEPTED') {
    return (
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-xl">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-800 font-medium">Connected</span>
        </div>
      </div>
    )
  }

  // Pending - User sent the request
  if (connectionState.status === 'PENDING' && connectionState.isSender) {
    return (
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl">
          <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-blue-800 font-medium">Request sent, awaiting response</span>
        </div>
      </div>
    )
  }

  // Pending - User received the request
  if (connectionState.status === 'PENDING' && !connectionState.isSender) {
    return (
      <div className="px-5 py-4 border-t border-gray-100 space-y-3">
        <p className="text-sm text-gray-600 text-center">
          This person wants to connect with you
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRejectRequest}
            disabled={actionLoading}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleAcceptRequest}
            disabled={actionLoading}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-myColor-500 to-myColor-600 hover:from-myColor-600 hover:to-myColor-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-myColor-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // No connection - Show send request button
  return (
    <div className="px-5 py-4 border-t border-gray-100 space-y-3">
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-fade-in">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{error.message}</p>
            {error.type === 'DAILY_LIMIT_EXCEEDED' && (
              <p className="text-xs text-red-500 mt-1">Try again tomorrow</p>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={handleSendClick}
        disabled={actionLoading || quotaLoading}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-myColor-500 to-myColor-600 hover:from-myColor-600 hover:to-myColor-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-myColor-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {(actionLoading || quotaLoading) ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Send Connection Request
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Once accepted, you can view their contact details
      </p>

      {/* Confirmation Popup */}
      {showConfirmPopup && quotaStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-myColor-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Send Connection Request?</h3>
                </div>
              </div>
            </div>

            {/* Quota Info */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Remaining requests for today</span>
                <span className={`font-semibold ${quotaStatus.dailyRemaining === -1 ? 'text-green-600' : quotaStatus.dailyRemaining > 0 ? 'text-myColor-600' : 'text-red-500'}`}>
                  {quotaStatus.dailyRemaining === -1 ? 'Unlimited' : quotaStatus.dailyRemaining}
                </span>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can send only {quotaStatus.dailyLimit ?? 2} requests per day
              </p>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={quotaStatus.dailyRemaining === 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-myColor-500 to-myColor-600 hover:from-myColor-600 hover:to-myColor-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-myColor-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ConnectionButton)
