'use client'

import { memo } from 'react'
import type { FullProfile } from '../hooks/useProfileData'
import ConnectionButton from './ConnectionButton'

interface ProfileDetailsProps {
  profile: FullProfile
  isMobile: boolean
}

// Format date to relative time or readable format
const formatLastUpdated = (dateString?: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  if (diffDays < 7) return `Updated ${diffDays} days ago`
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
  return `Updated ${date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
}

const ProfileDetails = memo(({ profile, isMobile }: ProfileDetailsProps) => (
  <div className={`p-5 space-y-4 ${!isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
    {/* Basic Info Row */}
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm">
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 2a1 1 0 00-1 1v18a1 1 0 001 1h2a1 1 0 001-1v-1h2v1a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H6zm1 2h6v3h-2V6H9v1H7V4zm0 5h2v1h2V9h2v3h-2v-1H9v1H7V9zm0 5h2v1h2v-1h2v3h-2v-1H9v1H7v-3z"/>
        </svg>
        <span className="text-gray-700">{profile.height}</span>
      </div>

      {profile.workingStatus && profile.designation && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-700">{profile.designation}</span>
        </div>
      )}
    </div>

    {/* Work Details */}
    {profile.workingStatus ? (
      <div className="space-y-3">
        {profile.company && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Company</p>
              <p className="text-gray-800">{profile.company}</p>
            </div>
          </div>
        )}

        {profile.workLocation && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Work Location</p>
              <p className="text-gray-800">{profile.workLocation}</p>
            </div>
          </div>
        )}

        {profile.salaryRange && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Salary Range</p>
              <p className="text-gray-800">{profile.salaryRange}</p>
            </div>
          </div>
        )}
      </div>
    ) : (
      <p className="text-gray-500 text-sm">Not currently working</p>
    )}

    {/* About Me */}
    {profile.aboutMe && (
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">About</p>
        <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
      </div>
    )}

    {/* Connection Button */}
    <ConnectionButton targetUserId={profile._id} />

    {/* Last Updated */}
    {profile.updatedAt && (
      <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatLastUpdated(profile.updatedAt)}</span>
      </div>
    )}

    <div className="h-6" />
  </div>
))

ProfileDetails.displayName = 'ProfileDetails'

export default ProfileDetails
