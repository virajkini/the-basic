'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import DiscoverTab from './DiscoverTab'
import ConnectionsTab from './ConnectionsTab'

function ConnectionsTabFallback() {
  return (
    <div className="min-h-full max-w-2xl mx-auto px-4 py-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-myColor-100 p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-myColor-100 rounded-xl" />
            <div className="flex-1 py-1">
              <div className="h-5 bg-myColor-100 rounded-lg w-36 mb-3" />
              <div className="h-4 bg-myColor-100 rounded w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TabShell() {
  const pathname = usePathname()
  const showConnections = pathname === '/connections'
  const showDiscover = !showConnections

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div
        className={`flex flex-1 min-h-0 flex-col overflow-y-auto ${showDiscover ? '' : 'hidden'}`}
        aria-hidden={!showDiscover}
      >
        <DiscoverTab />
      </div>
      <div
        className={`flex flex-1 min-h-0 flex-col overflow-y-auto ${showConnections ? '' : 'hidden'}`}
        aria-hidden={!showConnections}
      >
        <Suspense fallback={<ConnectionsTabFallback />}>
          <ConnectionsTab />
        </Suspense>
      </div>
    </div>
  )
}
