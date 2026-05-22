'use client'

import { usePathname } from 'next/navigation'
import { isMainTabRoute } from '../../lib/tabRoutes'
import TabShell from './TabShell'

export default function ProtectedMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const onTabRoute = isMainTabRoute(pathname)

  return (
    <>
      {/* Always mounted so Discover/Connections keep scroll, filters, and loaded data */}
      <div
        className={onTabRoute ? 'flex flex-1 min-h-0 flex-col' : 'hidden'}
        aria-hidden={!onTabRoute}
      >
        <TabShell />
      </div>
      {!onTabRoute ? <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">{children}</div> : null}
    </>
  )
}
