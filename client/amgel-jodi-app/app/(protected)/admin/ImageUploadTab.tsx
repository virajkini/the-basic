'use client'

import { useState, useRef } from 'react'
import { authFetch } from '../../utils/authFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

interface PendingFile {
  id: string
  file: File
  filename: string
  preview: string
}

interface UploadedAsset {
  filename: string
  cdnUrl: string
  key: string
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, '').trim()
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
  return cleaned || `asset-${Date.now()}.jpg`
}

export default function ImageUploadTab() {
  const [pending, setPending] = useState<PendingFile[]>([])
  const [uploaded, setUploaded] = useState<UploadedAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    setError(null)
    const list = Array.from(files)
    const invalid = list.filter((f) => !ALLOWED_TYPES.includes(f.type))
    if (invalid.length > 0) {
      setError('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    const oversized = list.filter((f) => f.size > 10 * 1024 * 1024)
    if (oversized.length > 0) {
      setError('Each image must be under 10MB')
      return
    }
    if (pending.length + list.length > 10) {
      setError('Maximum 10 images per batch')
      return
    }

    const next: PendingFile[] = list.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      filename: sanitizeFilename(file.name),
      preview: URL.createObjectURL(file),
    }))
    setPending((prev) => [...prev, ...next])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  const updateFilename = (id: string, filename: string) => {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, filename: sanitizeFilename(filename) } : p)))
  }

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const uploadAll = async () => {
    if (pending.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const namesParam = pending.map((p) => encodeURIComponent(p.filename)).join(',')
      const presignRes = await authFetch(`${API_BASE}/admin/page-assets/presign?names=${namesParam}`)
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Failed to get upload URLs')
      }
      const { urls } = (await presignRes.json()) as {
        urls: Array<{ url: string; key: string; cdnUrl: string }>
      }

      if (urls.length !== pending.length) {
        throw new Error('Presign response count mismatch')
      }

      const results: UploadedAsset[] = []
      for (let i = 0; i < pending.length; i++) {
        const { file, filename } = pending[i]
        const { url, key, cdnUrl } = urls[i]
        const putRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
        if (!putRes.ok) throw new Error(`Upload failed for ${filename}`)
        results.push({ filename, cdnUrl, key })
      }

      pending.forEach((p) => URL.revokeObjectURL(p.preview))
      setPending([])
      setUploaded((prev) => [...results, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Localhost-only page assets</p>
        <p>
          Uploads go to <code className="text-xs bg-amber-100 px-1 rounded">page-assets/</code> on S3. Public CDN URLs
          are unsigned, e.g.{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">https://static.amgeljodi.com/page-assets/hero.png</code>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-myColor-400 transition-colors"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          // accept="image/jpeg,image/jpg,image/png,image/webp/lottie"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
          }}
        />
        <p className="text-gray-600 mb-3">Drop images here or choose files (max 10 per batch)</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-myColor-600 text-white rounded-lg text-sm font-medium hover:bg-myColor-700"
        >
          Select images
        </button>
      </div>

      {pending.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Ready to upload ({pending.length})</h3>
            <button
              type="button"
              onClick={uploadAll}
              disabled={uploading}
              className="px-4 py-2 bg-myColor-600 text-white rounded-lg text-sm font-medium hover:bg-myColor-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload to S3'}
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {pending.map((item) => (
              <li key={item.id} className="flex items-center gap-4 p-4">
                <img src={item.preview} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-gray-500 uppercase block mb-1">Filename (page-assets/)</label>
                  <input
                    type="text"
                    value={item.filename}
                    onChange={(e) => updateFilename(item.id, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePending(item.id)}
                  className="text-red-600 text-sm hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploaded.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Uploaded CDN URLs</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {uploaded.map((item) => (
              <li key={item.key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.filename}</p>
                  <a
                    href={item.cdnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-myColor-600 hover:underline break-all"
                  >
                    {item.cdnUrl}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.cdnUrl)}
                  className="shrink-0 px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                >
                  {copiedUrl === item.cdnUrl ? 'Copied' : 'Copy URL'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
