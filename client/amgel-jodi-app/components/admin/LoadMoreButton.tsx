'use client'

interface Props {
  onClick: () => void
  loading: boolean
  hasMore: boolean
  loaded: number
  total: number
}

/** "Load more" footer for the paginated admin lists; the button hides once the last page is loaded. */
export default function LoadMoreButton({ onClick, loading, hasMore, loaded, total }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p className="text-sm text-gray-600">
        Showing <span className="font-semibold">{loaded}</span> of <span className="font-semibold">{total}</span>
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={onClick}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
