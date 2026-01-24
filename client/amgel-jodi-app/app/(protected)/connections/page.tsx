'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../utils/authFetch'
import ProfileDetailView from '../../../components/ProfileDetailView'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

type TabType = 'matches' | 'interested' | 'awaiting'

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
    height?: string
    designation?: string
    images: string[]
  }
}

export default function ConnectionsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('matches')
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; images: string[] } | null>(null)

  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true)
      try {
        let url = `${API_BASE}/connections?`
        if (activeTab === 'interested') {
          url += 'type=received&status=PENDING'
        } else if (activeTab === 'awaiting') {
          url += 'type=sent&status=PENDING'
        } else {
          url += 'status=ACCEPTED'
        }

        const response = await authFetch(url)
        if (response.ok) {
          const data = await response.json()

          const connectionsWithProfiles = await Promise.all(
            data.connections.map(async (conn: Connection) => {
              const otherUserId = activeTab === 'awaiting' ? conn.toUserId :
                                  activeTab === 'interested' ? conn.fromUserId :
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

  const tabs: { id: TabType; label: string; sublabel: string }[] = [
    { id: 'matches', label: 'Matches', sublabel: 'Connected' },
    { id: 'interested', label: 'Interested', sublabel: 'In You' },
    { id: 'awaiting', label: 'Sent', sublabel: 'Awaiting' },
  ]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const renderConnectionCard = (connection: Connection) => {
    const profile = connection.profile
    if (!profile) return null

    return (
      <div
        key={connection._id}
        className="group bg-white rounded-2xl border border-myColor-100 overflow-hidden hover:shadow-lg hover:shadow-myColor-500/10 hover:border-myColor-200 transition-all duration-200"
      >
        <div
          onClick={() => setSelectedProfile({ id: profile._id, images: profile.images })}
          className="flex gap-4 p-4 cursor-pointer"
        >
          {/* Profile Image */}
          <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-myColor-100 to-myColor-200">
            {profile.images?.[0] ? (
              <img
                src={profile.images[0]}
                alt={profile.firstName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-10 h-10 text-myColor-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 py-1">
            <h3 className="font-semibold text-myColor-900 text-lg">
              {profile.firstName}{profile.lastName ? ` ${profile.lastName}` : ''}, {profile.age}
            </h3>

            <div className="flex items-center gap-3 mt-1.5 text-sm text-myColor-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {profile.nativePlace}
              </span>
              {profile.height && (
                <span className="text-myColor-400">•</span>
              )}
              {profile.height && (
                <span>{profile.height.split('(')[0].trim()}</span>
              )}
            </div>

            {profile.designation && (
              <p className="text-sm text-myColor-400 mt-1 truncate">
                {profile.designation}
              </p>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center">
            <svg className="w-5 h-5 text-myColor-300 group-hover:text-myColor-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          {activeTab === 'interested' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(connection._id)}
                disabled={actionLoading === connection._id}
                className="flex-1 py-2.5 text-sm font-medium text-myColor-600 bg-myColor-50 hover:bg-myColor-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Not Interested
              </button>
              <button
                onClick={() => handleAccept(connection._id)}
                disabled={actionLoading === connection._id}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-myColor-500 to-myColor-600 hover:from-myColor-600 hover:to-myColor-700 rounded-xl shadow-md shadow-myColor-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading === connection._id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                Accept
              </button>
            </div>
          )}

          {activeTab === 'awaiting' && (
            <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-xl">
              <span className="text-sm text-amber-700 font-medium">Awaiting their response</span>
              <span className="text-xs text-amber-500">{formatTimeAgo(connection.createdAt)}</span>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-xl">
              <span className="text-sm text-green-700 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You're connected!
              </span>
              <span className="text-xs text-green-500">{formatTimeAgo(connection.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEmptyState = () => {
    const states = {
      interested: {
        title: 'No requests yet',
        subtitle: 'When someone shows interest in your profile, they\'ll appear here. Keep your profile updated to attract more interest!',
        icon: (
          <svg className="w-12 h-12 text-myColor-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
      },
      awaiting: {
        title: 'No pending requests',
        subtitle: 'When you express interest in someone, they\'ll show here until they respond. Browse profiles to find your match!',
        icon: (
          <svg className="w-12 h-12 text-myColor-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      matches: {
        title: 'No matches yet',
        subtitle: 'When both you and someone else express mutual interest, you\'ll be matched and appear here. Start exploring profiles!',
        icon: (
          <svg className="w-12 h-12 text-myColor-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    }

    return (
      <div className="text-center py-16 px-4">
        <div className="w-24 h-24 mx-auto mb-6 bg-myColor-50 rounded-full flex items-center justify-center">
          {states[activeTab].icon}
        </div>
        <h3 className="text-xl font-display font-semibold text-myColor-900 mb-2">
          {states[activeTab].title}
        </h3>
        <p className="text-myColor-500 max-w-sm mx-auto leading-relaxed">
          {states[activeTab].subtitle}
        </p>
      </div>
    )
  }

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-myColor-100 p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-myColor-100 rounded-xl" />
            <div className="flex-1 py-1">
              <div className="h-5 bg-myColor-100 rounded-lg w-36 mb-3" />
              <div className="h-4 bg-myColor-100 rounded w-28 mb-2" />
              <div className="h-4 bg-myColor-100 rounded w-20" />
            </div>
          </div>
          <div className="h-10 bg-myColor-100 rounded-xl mt-4" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-myColor-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-display font-semibold text-myColor-900">
            Connections
          </h1>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 text-center rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-myColor-600 text-white shadow-lg shadow-myColor-500/25'
                    : 'bg-myColor-50 text-myColor-600 hover:bg-myColor-100'
                }`}
              >
                <span className="block text-sm">{tab.label}</span>
                <span className={`block text-xs mt-0.5 ${activeTab === tab.id ? 'text-myColor-200' : 'text-myColor-400'}`}>
                  {tab.sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Count Badge */}
        {!loading && connections.length > 0 && (
          <p className="text-sm text-myColor-500 mb-4">
            {connections.length} {connections.length === 1 ? 'profile' : 'profiles'}
          </p>
        )}

        {loading ? renderSkeleton() : connections.length === 0 ? renderEmptyState() : (
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
