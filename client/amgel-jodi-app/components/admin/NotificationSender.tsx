'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '../../app/utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

interface UserProfile {
  userId: string
  phone: string | null
  email: string | null
  name: string
  gender: 'M' | 'F' | null
  isVerified: boolean
  isSubscribed: boolean
  hasFcmToken: boolean
}

export default function NotificationSender() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ message: string; isError: boolean } | null>(null)
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<'M' | 'F' | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authFetch(`${API_BASE}/admin/profiles`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.profiles)
        }
      } catch (e) {
        console.error('Failed to fetch users', e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter((u) => {
    if (genderFilter && u.gender !== genderFilter) return false
    const q = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      (u.phone || '').includes(searchQuery) ||
      (u.email || '').toLowerCase().includes(q)
    )
  })

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.userId)))
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0

  const sendToSelected = async () => {
    if (!canSend || selectedIds.size === 0) return
    setSending(true)
    setResult(null)
    try {
      const res = await authFetch(`${API_BASE}/admin/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds), title: title.trim(), body: body.trim(), ...(imageUrl.trim() && { imageUrl: imageUrl.trim() }) }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ message: `Sent to ${data.sent} user(s)${data.failed > 0 ? `, ${data.failed} failed` : ''}`, isError: false })
        setSelectedIds(new Set())
      } else {
        setResult({ message: data.error || 'Failed to send', isError: true })
      }
    } catch (e) {
      setResult({ message: 'Network error', isError: true })
    } finally {
      setSending(false)
    }
  }

  const broadcast = async () => {
    if (!canSend) return
    setSending(true)
    setShowBroadcastConfirm(false)
    setResult(null)
    try {
      const res = await authFetch(`${API_BASE}/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), ...(imageUrl.trim() && { imageUrl: imageUrl.trim() }) }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ message: `Broadcast to ${data.fcmSent} device(s) (${data.totalWithTokens} with FCM token)`, isError: false })
      } else {
        setResult({ message: data.error || 'Failed to broadcast', isError: true })
      }
    } catch (e) {
      setResult({ message: 'Network error', isError: true })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Compose Notification</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-gray-400 font-normal">({title.length}/60)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="e.g. Special Announcement"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-myColor-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-gray-400 font-normal">({body.length}/160)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 160))}
            placeholder="Enter your notification message..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-myColor-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL <span className="text-gray-400 font-normal">(optional — shown as banner in notification)</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://static.amgeljodi.com/..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-myColor-500"
          />
        </div>

        {result && (
          <div className={`text-sm px-3 py-2 rounded-lg ${result.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {result.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={sendToSelected}
            disabled={!canSend || selectedIds.size === 0 || sending}
            className="flex-1 bg-myColor-600 text-white text-sm font-medium py-2 px-4 rounded-lg disabled:opacity-40 hover:bg-myColor-700 transition-colors"
          >
            {sending ? 'Sending…' : `Send to Selected (${selectedIds.size})`}
          </button>
          <button
            onClick={() => setShowBroadcastConfirm(true)}
            disabled={!canSend || sending}
            className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 px-4 rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-colors"
          >
            Broadcast to All
          </button>
        </div>
      </div>

      {/* Broadcast confirmation */}
      {showBroadcastConfirm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-yellow-800 font-medium">
            Send &ldquo;{title}&rdquo; to ALL users with push notifications enabled?
          </p>
          <div className="flex gap-2">
            <button
              onClick={broadcast}
              className="bg-yellow-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg hover:bg-yellow-700"
            >
              Yes, broadcast
            </button>
            <button
              onClick={() => setShowBroadcastConfirm(false)}
              className="text-sm text-gray-600 py-1.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User Selection */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Select Users</h3>
            <button onClick={toggleAll} className="text-xs text-myColor-600 font-medium hover:text-myColor-700">
              {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-myColor-500"
          />
          <div className="flex gap-2">
            {(['M', 'F', null] as const).map((g) => (
              <button
                key={g ?? 'all'}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  genderFilter === g
                    ? 'bg-myColor-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <label key={user.userId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.userId)}
                  onChange={() => toggleUser(user.userId)}
                  className="w-4 h-4 rounded border-gray-300 text-myColor-600 focus:ring-myColor-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.phone || user.email || '—'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {user.isVerified && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Verified</span>
                  )}
                  {user.isSubscribed && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Subscribed</span>
                  )}
                  {user.hasFcmToken ? (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Push</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">No push</span>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
