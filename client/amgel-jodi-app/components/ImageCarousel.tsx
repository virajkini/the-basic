'use client'

import { useRef, useState, useCallback, memo } from 'react'

interface ImageCarouselProps {
  images: string[]
}

const ImageCarousel = memo(({ images }: ImageCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const scrollLeft = scrollRef.current.scrollLeft
    const width = scrollRef.current.offsetWidth
    setActiveIndex(Math.round(scrollLeft / width))
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return
    const width = scrollRef.current.offsetWidth
    scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' })
  }, [])

  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => new Set(prev).add(index))
  }, [])

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    )
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((url, idx) => (
          <div key={idx} className="flex-shrink-0 w-full h-full snap-center">
            {failedImages.has(idx) ? (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Image expired</p>
                <p className="text-xs mt-1">Refresh to view</p>
              </div>
            ) : (
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(idx)}
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIndex ? 'bg-white w-6 shadow' : 'bg-white/50 w-1.5'
              }`}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </>
  )
})

ImageCarousel.displayName = 'ImageCarousel'

export default ImageCarousel
