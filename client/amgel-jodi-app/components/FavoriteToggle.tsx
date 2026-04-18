'use client'

import { memo } from 'react'
import type { MouseEvent } from 'react'

export type FavoriteToggleVariant = 'toolbar' | 'overlay'

export interface FavoriteToggleProps {
  active: boolean
  disabled?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: FavoriteToggleVariant
  /** Smaller hit area + icon for compact dashboard cards (overlay only). */
  overlayCompact?: boolean
  'aria-label'?: string
  title?: string
}

function FavoriteToggle({
  active,
  disabled = false,
  onClick,
  variant = 'toolbar',
  overlayCompact = false,
  'aria-label': ariaLabel = active ? 'Remove from shortlist' : 'Add to shortlist',
  title,
}: FavoriteToggleProps) {
  const isToolbar = variant === 'toolbar'
  const overlaySm = !isToolbar && overlayCompact
  const iconClass = isToolbar ? 'h-4 w-4' : overlaySm ? 'h-3.5 w-3.5' : 'h-5 w-5'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={
        isToolbar
          ? `flex items-center justify-center rounded-full p-2.5 transition-all duration-200 disabled:opacity-50 ${
              active
                ? 'bg-myColor-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`
          : `box-border flex shrink-0 items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${
              overlaySm ? 'h-7 w-7 min-h-7 min-w-7' : 'h-9 w-9 min-h-9 min-w-9'
            } ${
              active ? 'bg-myColor-600/95 text-white' : 'bg-black/35 text-white hover:bg-black/50'
            }`
      }
    >
      {active ? (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.294 1.25 5.179c.27 1.112-.958 1.994-1.91 1.415L12 18.33l-4.766 2.492c-.952.579-2.18-.303-1.91-1.415l1.25-5.179-4.117-3.294c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
          />
        </svg>
      ) : (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={overlaySm ? 1.75 : 2}
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      )}
    </button>
  )
}

export default memo(FavoriteToggle)
