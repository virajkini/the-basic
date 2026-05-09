'use client'

import type { ReactNode } from 'react'

type OpenLoginSheetButtonProps = {
  children: ReactNode
  className?: string
}

export function OpenLoginSheetButton({ children, className }: OpenLoginSheetButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('openLoginSheet'))}
    >
      {children}
    </button>
  )
}
