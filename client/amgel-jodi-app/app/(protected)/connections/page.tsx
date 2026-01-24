'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../utils/authFetch'
import ProfileDetailView from '../../../components/ProfileDetailView'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type TabType = 'accepted' | 'received' | 'sent'

interface Connection {
  _id: string
  fromUserId: string
  toUserId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  profile?: {
    _id: string
    firstName: string
    lastName?: string
    age: number
    nativePlace: string
    images: string[]
  }
}

export default function ConnectionsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('accepted')
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; images: string[] } | null>(null)

  // Fetch connections based on active tab
  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true)
      try {
        let url = `${API_BASE}/connections?`
        if (activeTab === 'received') {
          url += 'type=received&status=PENDING'
        } else if (activeTab === 'sent') {
          url += 'type=sent&status=PENDING'
        } else {
          url += 'status=ACCEPTED'
        }

        const response = await authFetch(url)
        if (response.ok) {
          const data = await response.json()

          // Fetch profiles for each connection
          const connectionsWithProfiles = await Promise.all(
            data.connections.map(async (conn: Connection) => {
              const otherUserId = activeTab === 'sent' ? conn.toUserId :
                                  activeTab === 'received' ? conn.fromUserId :
                                  (conn.fromUserId === user?.userId ? conn.toUserId : conn.fromUserId)

              try {
                const profileRes = await authFetch(`${API_BASE}/profiles/view/${otherUserId}`)
                if (profileRes.ok) {
                  const profileData = await profileRes.json()
                  const filesRes = await authFetch(`${API_BASE}/files/${otherUserId}`)
                  const filesData = filesRes.ok ? await filesRes.json() : { images: [] }

                  return {
                    ...conn,
                    profile: {
                      ...profileData.profile,
                      images: filesData.images || [],
                    },
                  }
                }
              } catch {
                // Profile fetch failed
              }
              return conn
            })
          )

          setConnections(connectionsWithProfiles)
        }
      } catch (error) {
        console.error('Error fetching connections:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()
  }, [activeTab, user?.userId])

  // Handle accept request
  const handleAccept = async (connectionId: string) => {
    setActionLoading(connectionId)
    try {
      const response = await authFetch(`${API_BASE}/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (response.ok) {
        setConnections((prev) => prev.filter((c) => c._id !== connectionId))
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle reject request
  const handleReject = async (connectionId: string) => {
    setActionLoading(connectionId)
    try {
      const response = await authFetch(`${API_BASE}/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        setConnections((prev) => prev.filter((c) => c._id !== connectionId))
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
    {
      id: 'accepted',
      label: 'Connected',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'received',
      label: 'Requests',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
    },
    {
      id: 'sent',
      label: 'Pending',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const renderConnectionCard = (connection: Connection) => {
    const profile = connection.profile
    if (!profile) return null

    return (
      <div
        key={connection._id}
        onClick={() => setSelectedProfile({ id: profile._id, images: profile.images })}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex gap-4 p-4">
          {/* Profile Image */}
          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
            {profile.images?.[0] ? (
              <img
                src={profile.images[0]}
                alt={profile.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {profile.firstName}{profile.lastName ? ` ${profile.lastName}` : ''}, {profile.age}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {profile.nativePlace}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              {activeTab === 'received' && (
                <>
                  <button
                    onClick={() => handleReject(connection._id)}
                    disabled={actionLoading === connection._id}
                    className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(connection._id)}
                    disabled={actionLoading === connection._id}
                    className="px-3 py-1.5 text-sm text-white bg-myColor-500 hover:bg-myColor-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === connection._id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Accept
                  </button>
                </>
              )}

              {activeTab === 'sent' && (
                <span className="px-3 py-1.5 text-sm text-amber-700 bg-amber-50 rounded-lg flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Waiting for response
                </span>
              )}

              {activeTab === 'accepted' && (
                <span className="px-3 py-1.5 text-sm text-green-700 bg-green-50 rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Connected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderEmptyState = () => {
    const messages = {
      received: {
        title: 'No new requests',
        subtitle: 'When someone wants to connect with you, their request will show up here',
        icon: (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        ),
      },
      sent: {
        title: 'No pending requests',
        subtitle: 'Requests you send will appear here while waiting for the other person to accept',
        icon: (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      accepted: {
        title: 'No connections yet',
        subtitle: 'When you and another person both accept each other, you\'ll be connected and appear here',
        icon: (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    }

    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {messages[activeTab].icon}
        </div>
        <h3 className="font-medium text-gray-900 mb-1">{messages[activeTab].title}</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">{messages[activeTab].subtitle}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-500 mt-1">Your matches and connection requests</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 mb-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'text-myColor-700 bg-myColor-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Info Banner */}
        {activeTab === 'sent' && connections.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>These requests are waiting for the other person to accept. Once they accept, you'll both be connected.</span>
            </p>
          </div>
        )}

        {activeTab === 'received' && connections.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>These people want to connect with you. Accept to become connected and see their full profile.</span>
            </p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : connections.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-4">
            {connections.map(renderConnectionCard)}
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetailView
          profileId={selectedProfile.id}
          images={selectedProfile.images}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  )
}
