'use client'

import { VERIFICATION_STATUS_OPTIONS, type VerificationStatus } from '@/lib/verificationStatus'

export type VerificationFilterValue = 'all' | VerificationStatus

interface Props {
  value: VerificationFilterValue
  onChange: (next: VerificationFilterValue) => void
  counts: Partial<Record<VerificationStatus, number>>
  total: number
}

/** Horizontally scrollable status chips with counts — the admin's verification work queue. */
export default function VerificationStatusFilter({ value, onChange, counts, total }: Props) {
  const chips: { value: VerificationFilterValue; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: total },
    ...VERIFICATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, count: counts[o.value] ?? 0 })),
  ]

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
        {chips.map((c) => {
          const active = c.value === value
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                active
                  ? 'bg-myColor-600 text-white ring-myColor-600'
                  : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.label}
              <span className={`tabular-nums ${active ? 'text-white/80' : 'text-gray-400'}`}>{c.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
