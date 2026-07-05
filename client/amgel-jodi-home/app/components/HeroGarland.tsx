'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { LottieRefCurrentProps } from 'lottie-react'

// lottie-web touches `document` — keep it out of the prerendered bundle
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const PAGE_ASSETS_CDN =
  process.env.NEXT_PUBLIC_PAGE_ASSETS_CDN_BASE ?? 'https://static.amgeljodi.com/page-assets'

const ANIMATION_URL = `${PAGE_ASSETS_CDN}/indian-wedding-couple.json`
/** Last frame of the animation (op: 200) — shown directly when reduced motion is preferred */
const FINAL_FRAME = 199

/**
 * Garland-exchange (varmala) animation: plays exactly once after page load.
 * Reserves a 4:3 box matching the JSON's 800x600 canvas so nothing shifts when it loads.
 */
export default function HeroGarland() {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

    let cancelled = false
    fetch(ANIMATION_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setAnimationData(data)
      })
      .catch(() => {
        /* decorative — fail silently */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[22rem] md:max-w-[26rem]">
      {/* Warm glow behind the couple */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-myColor-400/[0.15] blur-3xl"
      />
      <div className="relative aspect-[4/3]">
        {animationData && (
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={false}
            autoplay={!reducedMotion}
            onDOMLoaded={() => {
              if (reducedMotion) {
                lottieRef.current?.goToAndStop(FINAL_FRAME, true)
              }
            }}
            className="h-full w-full"
          />
        )}
      </div>
      {/* Soft ground shadow so the couple doesn't float */}
      <div
        aria-hidden
        className="mx-auto -mt-3 h-3 w-2/3 rounded-[100%] bg-black/30 blur-md"
      />
    </div>
  )
}
