'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../app/context/AuthContext'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | null

interface ConnectionState {
  status: ConnectionStatus
  connectionId: string | null
  isSender: boolean
}

interface ConnectionButtonProps {
  targetUserId: string
  onStatusChange?: (status: ConnectionStatus) => void
}

export default function ConnectionButton({ targetUserId, onStatusChange }: ConnectionButtonProps) {
  const { user } = useAuth()
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: null,
    connectionId: null,
    isSender: false,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch current connection status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await authFetch(`${API_BASE}/connections/status/${targetUserId}`)
        if (response.ok) {
          const data = await response.json()
          setConnectionState({
            status: data.status,
            connectionId: data.connection?._id || null,
            isSender: data.isSender ?? false,
          })
        }
      } catch (error) {
        console.error('Error fetching connection status:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.userId && targetUserId) {
      fetchStatus()
    } else {
      setLoading(false)
    }
  }, [user?.userId, targetUserId])

  // Handle send request
  const handleSendRequest = async () => {
    setActionLoading(true)
    try {
      const response = await authFetch(`${API_BASE}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId }),
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionState({
          status: 'PENDING',
          connectionId: data.connection._id,
          isSender: true,
        })
        onStatusChange?.('PENDING')
      }
    } catch (error) {
      console.error('Error sending request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle cancel request
  const handleCancelRequest = async () => {
    if (!connectionState.connectionId) return
    setActionLoading(true)
    try {
      const response = await authFetch(`${API_BASE}/connections/${connectionState.connectionId}`, {
        method: 'DELETE',
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
      console.error('Error cancelling request:', error)
    } finally {
      setActionLoading(false)
    }
  }

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
        setConnectionState((prev) => ({
          ...prev,
          status: 'ACCEPTED',
        }))
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
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-800">
            Verify your profile to send connection requests and unlock contact details
          </p>
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
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
            <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-800 text-sm">Request sent, awaiting response</span>
          </div>
          <button
            onClick={handleCancelRequest}
            disabled={actionLoading}
            className="px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
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
      <button
        onClick={handleSendRequest}
        disabled={actionLoading}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-myColor-500 to-myColor-600 hover:from-myColor-600 hover:to-myColor-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-myColor-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {actionLoading ? (
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
    </div>
  )
}
