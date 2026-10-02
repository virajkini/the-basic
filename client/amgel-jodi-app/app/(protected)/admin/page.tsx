'use client'

import { useState, useEffect, useMemo } from 'react'
import { authFetch } from '../../utils/authFetch'
import OnboardingTab from './OnboardingTab'
import ImageUploadTab from './ImageUploadTab'
import NotificationSender from '../../../components/admin/NotificationSender'
import VerificationStatusSelect from '../../../components/admin/VerificationStatusSelect'
import VerificationStatusFilter, { type VerificationFilterValue } from '../../../components/admin/VerificationStatusFilter'
import type { VerificationStatus } from '@/lib/verificationStatus'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface Profile {
  userId: string
  phone: string | null
  email: string | null
  name: string
  gender: 'M' | 'F' | null
  isVerified: boolean
  verificationStatus: VerificationStatus
  isSubscribed: boolean
  createdAt: string
}

interface ContactMessage {
  _id: string
  name: string
  email?: string
  phone?: string
  subject: string
  message: string
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

interface MessageCounts {
  total: number
  new: number
  inProgress: number
  resolved: number
  closed: number
}

type Tab = 'profiles' | 'messages' | 'onboarding' | 'imageUpload' | 'notifications'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profiles')

  // Profile state
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; profile: Profile | null }>({ open: false, profile: null })
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [profileSearch, setProfileSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VerificationFilterValue>('all')

  // Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [messageCounts, setMessageCounts] = useState<MessageCounts | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageStatusFilter, setMessageStatusFilter] = useState<string>('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [updatingMessage, setUpdatingMessage] = useState(false)

  // Shared state
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hostname = window.location.hostname
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1')
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (activeTab === 'messages' && messages.length === 0) {
      fetchMessages()
    }
  }, [activeTab])

  // Profile functions
  const fetchProfiles = async () => {
    try {
      setLoadingProfiles(true)
      setError(null)

      const response = await authFetch(`${API_BASE}/admin/profiles`)

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.')
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch profiles')
        }
        return
      }

      const data = await response.json()
      if (data.success && data.profiles) {
        setProfiles(data.profiles)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles')
    } finally {
      setLoadingProfiles(false)
    }
  }

  const updateVerificationStatus = async (userId: string, status: VerificationStatus) => {
    try {
      setUpdating(userId)
      setError(null)

      const response = await authFetch(`${API_BASE}/admin/profiles/${userId}/verification-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to update verification status')
        return
      }

      setProfiles((prev) =>
        prev.map((profile) =>
          profile.userId === userId
            ? { ...profile, verificationStatus: status, isVerified: status === 'verified' }
            : profile
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update verification status')
    } finally {
      setUpdating(null)
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<VerificationStatus, number>> = {}
    for (const p of profiles) counts[p.verificationStatus] = (counts[p.verificationStatus] ?? 0) + 1
    return counts
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase()
    return profiles.filter((p) => {
      if (statusFilter !== 'all' && p.verificationStatus !== statusFilter) return false
      if (!q) return true
      return [p.name, p.phone, p.email, p.userId].some((v) => v?.toLowerCase().includes(q))
    })
  }, [profiles, profileSearch, statusFilter])

  const openDeleteModal = (profile: Profile) => {
    setDeleteModal({ open: true, profile })
    setDeleteConfirmation('')
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteModal({ open: false, profile: null })
    setDeleteConfirmation('')
  }

  const deleteUser = async () => {
    if (!deleteModal.profile || deleteConfirmation.toLowerCase() !== 'delete') return

    try {
      setDeleting(true)
      setError(null)

      const response = await authFetch(`${API_BASE}/admin/users/${deleteModal.profile.userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to delete user')
      }

      setProfiles((prev) => prev.filter((profile) => profile.userId !== deleteModal.profile?.userId))
      closeDeleteModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  // Message functions
  const fetchMessages = async () => {
    try {
      setLoadingMessages(true)
      setError(null)

      const url = messageStatusFilter
        ? `${API_BASE}/contact/admin/messages?status=${messageStatusFilter}`
        : `${API_BASE}/contact/admin/messages`

      const response = await authFetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch messages')
        return
      }

      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
        setMessageCounts(data.counts)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages()
    }
  }, [messageStatusFilter])

  const updateMessageStatus = async (messageId: string, status: string, adminNotes?: string) => {
    try {
      setUpdatingMessage(true)
      setError(null)

      const response = await authFetch(`${API_BASE}/contact/admin/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update message')
      }

      const data = await response.json()
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data.message : msg))
      )
      setSelectedMessage(null)
      fetchMessages() // Refresh counts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message')
    } finally {
      setUpdatingMessage(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      'general': 'General Inquiry',
      'account': 'Account Help',
      'technical': 'Technical Support',
      'feedback': 'Feedback & Suggestions',
      'report': 'Report an Issue',
      'partnership': 'Partnership Inquiry',
      'other': 'Other'
    }
    return labels[subject] || subject
  }

  if (loadingProfiles && activeTab === 'profiles') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && profiles.length === 0 && messages.length === 0 && activeTab === 'profiles') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={activeTab === 'profiles' ? fetchProfiles : fetchMessages}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; badge?: number; show: boolean }[] = [
    { key: 'profiles', label: `Profiles (${profiles.length})`, show: true },
    { key: 'messages', label: 'Messages', badge: messageCounts?.new, show: true },
    { key: 'onboarding', label: 'Onboarding', show: true },
    { key: 'notifications', label: 'Notifications', show: true },
    { key: 'imageUpload', label: 'Image Upload', show: isLocalhost },
  ]

  return (
    <div className="container mx-auto px-4 py-5 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage user profiles and contact messages</p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Tabs — horizontally scrollable on small screens */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex gap-5 sm:gap-6 w-max">
          {tabs.filter((t) => t.show).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === t.key
                  ? 'border-myColor-600 text-myColor-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
              {!!t.badge && t.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{t.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                type="search"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                placeholder="Search name, phone, email or user ID"
                className="w-full sm:max-w-md pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-myColor-500 focus:border-myColor-500"
              />
            </div>
            <VerificationStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              counts={statusCounts}
              total={profiles.length}
            />
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow px-6 py-10 text-center text-sm text-gray-500">No profiles found</div>
          ) : (
            <>
              {/* Mobile: cards */}
              <ul className="space-y-3 md:hidden">
                {filteredProfiles.map((profile) => (
                  <li key={profile.userId} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{profile.name}</p>
                        <p className="text-[11px] font-mono text-gray-400 truncate">{profile.userId}</p>
                      </div>
                      {profile.isSubscribed && (
                        <span className="shrink-0 inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700">
                          Subscribed
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-0.5 text-sm">
                      {profile.phone ? (
                        <a href={`tel:+${profile.phone.replace(/^\+/, '')}`} className="block text-myColor-700 font-medium">
                          {profile.phone}
                        </a>
                      ) : (
                        <p className="text-gray-400">No phone</p>
                      )}
                      {profile.email && <p className="text-gray-600 truncate">{profile.email}</p>}
                      <p className="text-xs text-gray-400">Joined {formatDate(profile.createdAt)}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <VerificationStatusSelect
                        value={profile.verificationStatus}
                        onChange={(next) => updateVerificationStatus(profile.userId, next)}
                        subjectLabel={profile.name}
                        busy={updating === profile.userId}
                        className="flex-1"
                      />
                      {isLocalhost && (
                        <button
                          onClick={() => openDeleteModal(profile)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscribed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        {isLocalhost && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProfiles.map((profile, index) => (
                        <tr key={profile.userId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                            <p className="text-xs font-mono text-gray-400">{profile.userId}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{profile.phone || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{profile.email || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <VerificationStatusSelect
                              value={profile.verificationStatus}
                              onChange={(next) => updateVerificationStatus(profile.userId, next)}
                              subjectLabel={profile.name}
                              busy={updating === profile.userId}
                              className="w-40"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${profile.isSubscribed ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {profile.isSubscribed ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(profile.createdAt)}</td>
                          {isLocalhost && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() => openDeleteModal(profile)}
                                className="px-3 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredProfiles.length}</span> of{' '}
            <span className="font-semibold">{profiles.length}</span> profiles
          </div>
        </div>
      )}

      {activeTab === 'onboarding' && <OnboardingTab />}

      {activeTab === 'imageUpload' && isLocalhost && <ImageUploadTab />}

      {activeTab === 'notifications' && <NotificationSender />}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <>
          {/* Filter and Stats */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <select
              value={messageStatusFilter}
              onChange={(e) => setMessageStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-myColor-500 focus:border-myColor-500"
            >
              <option value="">All Messages</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {messageCounts && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">New: {messageCounts.new}</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">In Progress: {messageCounts.inProgress}</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Resolved: {messageCounts.resolved}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">Closed: {messageCounts.closed}</span>
              </div>
            )}
          </div>

          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No messages found</td>
                      </tr>
                    ) : (
                      messages.map((msg) => (
                        <tr key={msg._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(msg.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{msg.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{msg.email || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{msg.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getSubjectLabel(msg.subject)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={msg.message}>
                            {msg.message.length > 100 ? msg.message.substring(0, 100) + '...' : msg.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(msg.status)}`}>
                              {msg.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedMessage(msg)}
                              className="px-3 py-1 rounded text-xs font-medium bg-myColor-100 text-myColor-700 hover:bg-myColor-200"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Total messages: <span className="font-semibold">{messageCounts?.total || 0}</span>
          </div>
        </>
      )}

      {/* Delete User Modal */}
      {deleteModal.open && deleteModal.profile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeDeleteModal}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delete User Account</h2>
                  <p className="text-sm text-gray-500">This cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{deleteModal.profile.name}</p>
                <p className="text-sm text-gray-600">{deleteModal.profile.phone}</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">Type <span className="font-bold">DELETE</span> to confirm:</p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={deleting}
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={closeDeleteModal} disabled={deleting} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={deleteUser} disabled={deleteConfirmation.toLowerCase() !== 'delete' || deleting} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedMessage(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedMessage.createdAt)}</p>
                </div>
                <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Name</label>
                  <p className="font-medium text-gray-900">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Email</label>
                  <p className="font-medium text-gray-900">{selectedMessage.email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Phone</label>
                  <p className="font-medium text-gray-900">{selectedMessage.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Subject</label>
                  <p className="font-medium text-gray-900">{getSubjectLabel(selectedMessage.subject)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 uppercase">Current Status</label>
                  <p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedMessage.status)}`}>
                      {selectedMessage.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Message</label>
                <p className="mt-1 p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              {selectedMessage.adminNotes && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Admin Notes</label>
                  <p className="mt-1 p-4 bg-yellow-50 rounded-lg text-gray-700">{selectedMessage.adminNotes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100">
              <label className="text-xs text-gray-500 uppercase mb-2 block">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateMessageStatus(selectedMessage._id, status)}
                    disabled={updatingMessage || selectedMessage.status === status}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      selectedMessage.status === status
                        ? 'bg-myColor-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
