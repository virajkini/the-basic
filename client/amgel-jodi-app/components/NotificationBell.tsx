'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authFetch } from '../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type NotificationType = 'REQUEST_RECEIVED' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'SHORTLISTED' | 'CUSTOM'

interface Notification {
  _id: string
  type: NotificationType
  refId?: string
  actorUserId: string
  actorName?: string
  title?: string
  body?: string
  read: boolean
  createdAt: string
}

// Module-level tracking to survive React Strict Mode remounts
let globalCountFetched = false
let globalEventSource: EventSource | null = null

// Custom event name for broadcasting notification updates
const NOTIFICATION_UPDATE_EVENT = 'notificationCountUpdate'

export default function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count only
  const fetchUnreadCount = async (broadcast = false) => {
    try {
      const response = await authFetch(`${API_BASE}/notifications/unread-count`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
        // Broadcast to all NotificationBell instances (desktop + mobile)
        if (broadcast) {
          window.dispatchEvent(
            new CustomEvent(NOTIFICATION_UPDATE_EVENT, { detail: { count: data.count } })
          )
        }
        return data.count
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
    return null
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

  // Listen for notification update broadcasts from other instances
  useEffect(() => {
    const handleCountUpdate = (event: CustomEvent<{ count: number }>) => {
      setUnreadCount(event.detail.count)
      setHasLoadedNotifications(false) // Trigger refetch when dropdown opens
    }

    window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleCountUpdate as EventListener)
    return () => {
      window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleCountUpdate as EventListener)
    }
  }, [])

  // Initial fetch - only unread count (once globally)
  useEffect(() => {
    if (globalCountFetched) return
    globalCountFetched = true
    fetchUnreadCount(true) // broadcast to all instances (desktop + mobile)
  }, [])

  // Fetch notifications and mark all as read when dropdown opens
  useEffect(() => {
    if (!isOpen) return
    if (!hasLoadedNotifications) {
      fetchNotifications()
    }
    if (unreadCount > 0) {
      markAllAsRead()
    }
  }, [isOpen])

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
        // Fetch fresh count and broadcast to all instances
        try {
          const response = await authFetch(`${API_BASE}/notifications/unread-count`)
          if (response.ok) {
            const data = await response.json()
            // Broadcast to ALL NotificationBell instances via custom event
            window.dispatchEvent(
              new CustomEvent(NOTIFICATION_UPDATE_EVENT, { detail: { count: data.count } })
            )
          }
        } catch (e) {
          // ignore
        }
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
  const getNotificationMessage = (notification: Notification): { title: string; body: string } => {
    const name = notification.actorName || 'Someone'
    switch (notification.type) {
      case 'SHORTLISTED':
        return { title: '❤️ You caught someone\'s attention!', body: 'Someone has shortlisted your profile.' }
      case 'REQUEST_RECEIVED':
        return { title: '❤️ New interest received', body: `${name} wants to connect with you.` }
      case 'REQUEST_ACCEPTED':
        return { title: '🎉 It\'s a match!', body: `Your request has been accepted by ${name}.` }
      case 'REQUEST_REJECTED':
        return { title: `Request not accepted by ${name}`, body: 'Don\'t worry—there are many more compatible profiles.' }
      case 'CUSTOM':
        return { title: notification.title || 'Amgel Jodi', body: notification.body || '' }
      default:
        return { title: 'Amgel Jodi', body: 'You have a new notification' }
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: NotificationType): JSX.Element => {
    switch (type) {
      case 'SHORTLISTED':
        return (
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )
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
      case 'CUSTOM':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

  // Get redirect URL for notification type
  const getNotificationRedirectUrl = (type: NotificationType): string => {
    switch (type) {
      case 'REQUEST_RECEIVED':
        return '/connections?tab=interested'
      case 'REQUEST_ACCEPTED':
        return '/connections?tab=matches'
      default:
        return '/dashboard'
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false)
    router.push(getNotificationRedirectUrl(notification.type))
  }

  return (
    <div className="relative overflow-visible" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-myColor-600 hover:bg-myColor-50 rounded-lg transition-colors overflow-visible"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center z-10">
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
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      !notification.read ? 'bg-myColor-50/50' : ''
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      {(() => {
                        const msg = getNotificationMessage(notification)
                        return (
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{msg.title}</span>
                            {msg.body && <span className="text-gray-600"> — {msg.body}</span>}
                          </p>
                        )
                      })()}
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
