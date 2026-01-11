'use client'

import { memo } from 'react'
import Shimmer from './Shimmer'

interface DetailsSkeletonProps {
  isMobile: boolean
}

const DetailsSkeleton = memo(({ isMobile }: DetailsSkeletonProps) => (
  <div className={`p-5 space-y-4 ${!isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
    <div className="flex flex-wrap gap-3">
      <Shimmer className="h-9 w-20 rounded-xl" />
      <Shimmer className="h-9 w-32 rounded-xl" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <Shimmer className="w-5 h-5 rounded" />
          <div className="flex-1">
            <Shimmer className="h-3 w-16 mb-2" />
            <Shimmer className="h-4 w-40" />
          </div>
        </div>
      ))}
    </div>
    <div className="pt-3 border-t border-gray-100">
      <Shimmer className="h-3 w-12 mb-3" />
      <Shimmer className="h-4 w-full mb-2" />
      <Shimmer className="h-4 w-3/4" />
    </div>
  </div>
))

DetailsSkeleton.displayName = 'DetailsSkeleton'

export default DetailsSkeleton
