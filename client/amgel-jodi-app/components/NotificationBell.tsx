'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type NotificationType = 'REQUEST_RECEIVED' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED'

interface Notification {
  _id: string
  type: NotificationType
  refId: string
  actorUserId: string
  actorName?: string
  read: boolean
  createdAt: string
}

// Module-level tracking to survive React Strict Mode remounts
let globalCountFetched = false
let globalEventSource: EventSource | null = null

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const setUnreadCountRef = useRef(setUnreadCount)
  const setHasLoadedRef = useRef(setHasLoadedNotifications)

  // Keep refs updated
  setUnreadCountRef.current = setUnreadCount
  setHasLoadedRef.current = setHasLoadedNotifications

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      const response = await authFetch(`${API_BASE}/notifications/unread-count`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Fetch notifications (called when dropdown opens)
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await authFetch(`${API_BASE}/notifications?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setHasLoadedNotifications(true)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch - only unread count (once globally)
  useEffect(() => {
    if (globalCountFetched) return
    globalCountFetched = true
    fetchUnreadCount()
  }, [])

  // Fetch notifications when dropdown opens for the first time
  useEffect(() => {
    if (isOpen && !hasLoadedNotifications) {
      fetchNotifications()
    }
  }, [isOpen, hasLoadedNotifications])

  // SSE connection for real-time updates (single global connection)
  useEffect(() => {
    if (globalEventSource) return

    let reconnectTimeout: NodeJS.Timeout
    let consecutiveErrors = 0
    const MAX_RETRIES = 3

    const connectSSE = async () => {
      // If we've had too many consecutive errors, stop trying
      if (consecutiveErrors >= MAX_RETRIES) {
        console.warn('SSE: Max retries reached, stopping reconnection attempts')
        return
      }

      const eventSource = new EventSource(`${API_BASE}/notifications/stream`, {
        withCredentials: true,
      })

      eventSource.addEventListener('NEW_NOTIFICATION', async () => {
        consecutiveErrors = 0 // Reset on successful message
        // Fetch fresh count
        try {
          const response = await authFetch(`${API_BASE}/notifications/unread-count`)
          if (response.ok) {
            const data = await response.json()
            setUnreadCountRef.current(data.count)
          }
        } catch (e) {
          // ignore
        }
        setHasLoadedRef.current(false)
      })

      eventSource.onopen = () => {
        consecutiveErrors = 0 // Reset on successful connection
      }

      eventSource.onerror = () => {
        eventSource.close()
        globalEventSource = null
        consecutiveErrors++

        // Reconnect with exponential backoff
        if (consecutiveErrors < MAX_RETRIES) {
          const delay = Math.min(2000 * Math.pow(2, consecutiveErrors - 1), 30000)
          reconnectTimeout = setTimeout(connectSSE, delay)
        }
        // If max retries reached, don't reconnect
      }

      globalEventSource = eventSource
    }

    connectSSE()

    return () => {
      clearTimeout(reconnectTimeout)
      // Don't close on unmount - keep connection alive
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await authFetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await authFetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Get notification message
  const getNotificationMessage = (type: NotificationType): string => {
    switch (type) {
      case 'REQUEST_RECEIVED':
        return 'sent you a connection request'
      case 'REQUEST_ACCEPTED':
        return 'accepted your connection request'
      case 'REQUEST_REJECTED':
        return 'declined your connection request'
      default:
        return 'sent you a notification'
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: NotificationType): JSX.Element => {
    switch (type) {
      case 'REQUEST_RECEIVED':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        )
      case 'REQUEST_ACCEPTED':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'REQUEST_REJECTED':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-myColor-600 hover:bg-myColor-50 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setIsOpen(false)} />

          <div className="fixed inset-x-3 top-16 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-myColor-600 hover:text-myColor-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification._id)
                      }
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      !notification.read ? 'bg-myColor-50/50' : ''
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{notification.actorName || 'Someone'}</span>{' '}
                        {getNotificationMessage(notification.type)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-myColor-500 rounded-full mt-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full py-3 text-center text-sm text-myColor-600 hover:bg-gray-50 font-medium transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}
