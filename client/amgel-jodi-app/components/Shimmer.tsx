'use client'

import { memo } from 'react'

interface ShimmerProps {
  className: string
}

const Shimmer = memo(({ className }: ShimmerProps) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
))

Shimmer.displayName = 'Shimmer'

export default Shimmer
