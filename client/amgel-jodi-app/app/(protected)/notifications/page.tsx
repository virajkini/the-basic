'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import posthog from 'posthog-js'
import Link from 'next/link'
import { authFetch } from '../../utils/authFetch'

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (skip = 0, append = false) => {
    if (skip === 0) setLoading(true)
    else setLoadingMore(true)

    try {
      const response = await authFetch(`${API_BASE}/notifications?limit=20&skip=${skip}`)
      if (response.ok) {
        const data = await response.json()
        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications])
        } else {
          setNotifications(data.notifications)
        }
        setHasMore(data.notifications.length === 20)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Initial fetch + mark all as read
  useEffect(() => {
    fetchNotifications()
    authFetch(`${API_BASE}/notifications/read-all`, { method: 'PATCH' }).catch(() => {})
  }, [fetchNotifications])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchNotifications(notifications.length, true)
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, notifications.length, fetchNotifications])

  // Mark as read when notification enters viewport
  const markAsRead = async (notificationId: string) => {
    try {
      await authFetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      )
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
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Get notification message
  const getNotificationMessage = (notification: Notification): { title: string; description: string } => {
    const name = notification.actorName || 'Someone'
    switch (notification.type) {
      case 'SHORTLISTED':
        return {
          title: '❤️ You caught someone\'s attention!',
          description: 'Someone has shortlisted your profile. Open the app to discover more matches.',
        }
      case 'REQUEST_RECEIVED':
        return {
          title: '❤️ New interest received',
          description: `${name} wants to connect with you. Open the app and review their profile now.`,
        }
      case 'REQUEST_ACCEPTED':
        return {
          title: '🎉 It\'s a match!',
          description: `Your request has been accepted by ${name}. You can now view their contact details.`,
        }
      case 'REQUEST_REJECTED':
        return {
          title: `Request not accepted by ${name}`,
          description: 'Don\'t worry—there are many more compatible profiles waiting for you.',
        }
      case 'CUSTOM':
        return {
          title: notification.title || 'Amgel Jodi',
          description: notification.body || '',
        }
      default:
        return {
          title: 'Notification',
          description: 'You have a new notification',
        }
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: NotificationType): JSX.Element => {
    switch (type) {
      case 'SHORTLISTED':
        return (
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )
      case 'REQUEST_RECEIVED':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        )
      case 'REQUEST_ACCEPTED':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'REQUEST_REJECTED':
        return (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'CUSTOM':
        return (
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        )
    }
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  // Get link for notification
  const getNotificationLink = (notification: Notification): string => {
    switch (notification.type) {
      case 'REQUEST_RECEIVED': return '/connections?tab=interested'
      case 'REQUEST_ACCEPTED': return '/connections?tab=matches'
      default: return '/dashboard'
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-myColor-600 hover:text-myColor-700 font-medium px-4 py-2 hover:bg-myColor-50 rounded-lg transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              When you receive connection requests or updates, they will appear here.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-myColor-600 hover:text-myColor-700 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const message = getNotificationMessage(notification)
              return (
                <Link
                  key={notification._id}
                  href={getNotificationLink(notification)}
                  onClick={() => {
                    posthog.capture('notification_clicked', {
                      notification_type: notification.type,
                    })
                  }}
                  className={`block bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
                    !notification.read
                      ? 'border-myColor-200 bg-myColor-50/30'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex gap-4">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {message.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-myColor-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{message.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(notification.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Loading more indicator */}
            <div ref={observerRef} className="py-4">
              {loadingMore && (
                <div className="flex justify-center">
                  <svg className="w-6 h-6 animate-spin text-myColor-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>

            {!hasMore && notifications.length > 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No more notifications</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
