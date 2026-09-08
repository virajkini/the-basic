'use client'

import { useEffect } from 'react'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amgeljodi.app'

interface RateAppBottomSheetProps {
  isOpen: boolean
  onDismiss: () => void
  onRate: () => void
}

export default function RateAppBottomSheet({ isOpen, onDismiss, onRate }: RateAppBottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRate = () => {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer')
    onRate()
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-2 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-myColor-100 to-myColor-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-5 h-5 text-myColor-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118l-3.368-2.447c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.285-3.957z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-myColor-900 text-center">
            How is Amgel Jodi experience for you?
          </h2>
          <p className="mt-2 text-base text-myColor-500 text-center">
            Please give us a rating.
            <br />
            Your rating helps other GSB families choose this app.
          </p>

          <div className="mt-6">
            <button
              onClick={handleRate}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-myColor-600 to-myColor-700 shadow-lg shadow-myColor-500/30 active:scale-[0.98] transition-transform"
            >
              Rate us on Play Store
            </button>
          </div>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}
