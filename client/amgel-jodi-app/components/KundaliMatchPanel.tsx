'use client'

import { useState, useEffect, useRef, memo } from 'react'
import dynamic from 'next/dynamic'
import { authFetch } from '../app/utils/authFetch'

// next/dynamic with ssr:false avoids the React.lazy + Suspense remount cycle
// that causes the .lottie file to be fetched multiple times
const WaveLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((m) => {
    const { DotLottieReact } = m
    const Wave = () => (
      <DotLottieReact
        src="https://static.amgeljodi.com/page-assets/purple_theme_wave.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%', display: 'block', margin: 0, padding: 0 }}
      />
    )
    Wave.displayName = 'WaveLottie'
    return { default: Wave }
  }),
  { ssr: false, loading: () => null }
)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KootaResult {
  male_koot_attribute: string
  female_koot_attribute: string
  total_points: number
  received_points: number
}

interface DashakootResult {
  dina: KootaResult; gana: KootaResult; yoni: KootaResult; rashi: KootaResult
  rasyadhipati: KootaResult; rajju: KootaResult; vedha: KootaResult
  vashya: KootaResult; mahendra: KootaResult; streeDeergha: KootaResult
  total: { total_points: number; received_points: number; minimum_required: number }
}

interface KundaliMatch {
  tier: 'LOW' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT'
  receivedPoints: number
  totalPoints: number
  dashakootResult: DashakootResult
  summary: string
}

type MissingFor = 'self' | 'target' | 'both'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  LOW:       { label: 'Low',       emoji: '☁️', color: '#ef4444', light: '#fef2f2' },
  FAIR:      { label: 'Fair',      emoji: '🌤', color: '#f59e0b', light: '#fffbeb' },
  GOOD:      { label: 'Good',      emoji: '⭐', color: '#22d3ee', light: '#ecfeff' },
  VERY_GOOD: { label: 'Very Good', emoji: '✨', color: '#e879f9', light: '#fdf4ff' },
  EXCELLENT: { label: 'Excellent', emoji: '🌟', color: '#10b981', light: '#ecfdf5' },
}

const KOOTA_LABELS: Record<string, string> = {
  rajju: 'Rajju', rashi: 'Rashi', rasyadhipati: 'Rasyadhipati',
  gana: 'Gana', yoni: 'Yoni', dina: 'Dina',
  mahendra: 'Mahendra', streeDeergha: 'Stree Deergha', vedha: 'Vedha', vashya: 'Vashya',
}

const KOOTA_ORDER = [
  'rajju', 'rashi', 'rasyadhipati', 'gana', 'yoni',
  'dina', 'mahendra', 'streeDeergha', 'vedha', 'vashya',
]

// ─── Animated circular progress ───────────────────────────────────────────────

function CircularScore({ received, total }: { received: number; total: number }) {
  const validPct = Math.min(100, Math.max(0, (received / total) * 100))
  const [currentPct, setCurrentPct] = useState(0)
  const isAnimatingRef = useRef(true)
  const rafRef = useRef<number | null>(null)
  const [displayVal, setDisplayVal] = useState(0)

  useEffect(() => {
    isAnimatingRef.current = true
    setCurrentPct(0)
    setDisplayVal(0)
    const duration = 1000
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // LINEAR — matches reference animateProgress
      const current = progress * validPct
      setCurrentPct(current)
      setDisplayVal(isAnimatingRef.current ? Math.round((current / 100) * total) : received)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        isAnimatingRef.current = false
        setCurrentPct(validPct)
        setDisplayVal(received)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [validPct, received, total])

  // Exact ratios from the reference component
  const size = 130
  const width = 14
  const baseLayerSize = (109 / 98) * size   // ≈ 144.7
  const overlayLayerSize = (114 / 98) * size // ≈ 151.4

  const center = size / 2
  const radius = center - width / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (currentPct / 100) * circumference

  return (
    <div className="relative" style={{ width: baseLayerSize, height: baseLayerSize }}>

      {/* Layer 1: BaseLayer — exact SVG from reference (LIGHT theme) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 1 }}>
        <svg width={baseLayerSize} height={baseLayerSize} viewBox="0 0 114 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="57" cy="57" r="53.075" fill="#ede0fc" stroke="white" strokeWidth="0.55" />
          <g style={{ mixBlendMode: 'overlay' }} filter="url(#filter0_f_cs_base)">
            <circle cx="57" cy="57" r="50.7574" stroke="#211430" strokeWidth="2.55" />
          </g>
          <defs>
            <filter id="filter0_f_cs_base" x="0.967285" y="0.967285" width="112.065" height="112.065" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_cs_base" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Layer 2: Progress ring — same structure, purple gradient instead of blue */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: size, height: size, zIndex: 2 }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <defs>
            <linearGradient id="cs_ring_grad" x1="50%" y1="0%" x2="50%" y2="100%" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#caa1f7" />
              <stop offset="0.5" stopColor="#864fc1" />
              <stop offset="1" stopColor="#432860" />
            </linearGradient>
          </defs>
          <circle
            cx={center} cy={center} r={radius}
            fill="transparent"
            stroke="url(#cs_ring_grad)"
            strokeWidth={width}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Layer 3: OverlayShadowLayer — exact SVG from reference (LIGHT theme) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 3 }}>
        <svg width={overlayLayerSize} height={overlayLayerSize} viewBox="0 0 114 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_di_cs_overlay)">
            <circle cx="57" cy="57" r="37" fill="#f6effe" />
          </g>
          <defs>
            <filter id="filter0_di_cs_overlay" x="17" y="17" width="84" height="84" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset dx="2" dy="1" />
              <feGaussianBlur stdDeviation="2.5" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.525 0 0 0 0 0.310 0 0 0 0 0.757 0 0 0 1 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_cs_overlay" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_cs_overlay" result="shape" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset dx="-1" />
              <feGaussianBlur stdDeviation="1" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
              <feBlend mode="normal" in2="shape" result="effect2_innerShadow_cs_overlay" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Layer 4: Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 4 }}>
        <span className="text-3xl font-bold text-gray-800 leading-none">{displayVal}</span>
        <span className="text-xs text-gray-500 font-medium mt-0.5">of {total}</span>
      </div>

    </div>
  )
}

// ─── Koota row with animated bar ──────────────────────────────────────────────

function KootaRow({ name, koota, index }: { name: string; koota: KootaResult; index: number }) {
  const [barWidth, setBarWidth] = useState(0)
  const pct = koota.total_points > 0 ? (koota.received_points / koota.total_points) * 100 : 0
  const status = koota.received_points === koota.total_points ? 'STRONG'
    : koota.received_points === 0 ? 'WEAK' : 'MODERATE'

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 80 + index * 40)
    return () => clearTimeout(t)
  }, [pct, index])

  const statusStyle = {
    STRONG:   'bg-emerald-100 text-emerald-700',
    MODERATE: 'bg-amber-100 text-amber-700',
    WEAK:     'bg-red-100 text-red-600',
  }[status]

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-myColor-800 truncate">{KOOTA_LABELS[name]}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle}`}>
            {status}
          </span>
        </div>
        <span className="text-sm font-semibold text-myColor-600 ml-2 flex-shrink-0">
          {koota.received_points}/{koota.total_points}
        </span>
      </div>
      <div className="h-1.5 bg-myColor-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-myColor-400 to-myColor-600 transition-all duration-700 ease-out"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ image, size }: { image?: string; size: number }) {
  return (
    <div
      className="rounded-full ring-2 ring-white/40 overflow-hidden flex-shrink-0 bg-white/10"
      style={{ width: size, height: size }}
    >
      {image
        ? <img src={image} alt="" className="w-full h-full object-cover" />
        : (
          <div className="w-full h-full flex items-center justify-center">
            <svg style={{ width: size * 0.5, height: size * 0.5 }} className="text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface KundaliMatchPanelProps {
  targetUserId: string
  targetFirstName: string
  targetImage?: string
  ownImage?: string
  onClose: () => void
}

export default function KundaliMatchPanel({
  targetUserId, targetFirstName, targetImage, ownImage, onClose,
}: KundaliMatchPanelProps) {
  const [state, setState] = useState<
    | { phase: 'loading' }
    | { phase: 'missing'; missingFor: MissingFor }
    | { phase: 'error'; message: string }
    | { phase: 'result'; match: KundaliMatch }
  >({ phase: 'loading' })

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    const loadStart = Date.now()

    const applyState = (next: typeof state) => {
      const remaining = Math.max(0, 2000 - (Date.now() - loadStart))
      setTimeout(() => setState(next), remaining)
    }

    authFetch(`${API_BASE}/kundali/${targetUserId}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok && data.success) {
          applyState({ phase: 'result', match: data.match })
        } else if (data.error === 'MISSING_BIRTH_DATA') {
          applyState({ phase: 'missing', missingFor: data.missingFor })
        } else if (data.error === 'UNVERIFIED') {
          applyState({ phase: 'error', message: 'Kundali compatibility is available for verified profiles only.' })
        } else {
          applyState({ phase: 'error', message: data.error || 'Something went wrong. Please try again.' })
        }
      })
      .catch(() => applyState({ phase: 'error', message: 'Connection error. Please try again.' }))
  }, [targetUserId])

  return (
    <>
      <style>{`
        @keyframes floatIn {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes photoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(202,161,247,0); }
          50%       { box-shadow: 0 0 0 10px rgba(202,161,247,0.25); }
        }
        @keyframes orb {
          0%, 100% { transform: scale(0.85); opacity: 0.5; }
          50%       { transform: scale(1.2);  opacity: 0.9; }
        }
        @keyframes starDrift {
          0%, 100% { opacity: 0; transform: scale(0.5) translateY(0); }
          50%       { opacity: 1; transform: scale(1) translateY(-6px); }
        }
        .float-in { animation: floatIn 0.4s ease-out forwards; }
        .photo-pulse { animation: photoPulse 2.4s ease-in-out infinite; }
        .orb-pulse  { animation: orb 2s ease-in-out infinite; }
        .star-drift { animation: starDrift 2.2s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col h-full bg-white overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-myColor-100">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-myColor-50 text-myColor-600 transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-myColor-900 text-sm">Kundali Match</p>
            <p className="text-xs text-myColor-400 truncate">Compatibility with {targetFirstName}</p>
          </div>
          <svg className="w-5 h-5 text-myColor-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>

        {/* ── Body ── */}
        {state.phase === 'loading' && (
          <LoadingView ownImage={ownImage} targetImage={targetImage} targetFirstName={targetFirstName} />
        )}
        {state.phase === 'missing' && (
          <MissingDataView missingFor={state.missingFor} targetFirstName={targetFirstName} onClose={onClose} />
        )}
        {state.phase === 'error' && (
          <ErrorView message={state.message} onClose={onClose} />
        )}
        {state.phase === 'result' && (
          <ResultView match={state.match} targetFirstName={targetFirstName} ownImage={ownImage} targetImage={targetImage} />
        )}
      </div>
    </>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

const STARS = [
  { top: '15%', left: '12%', delay: '0s',    size: 6  },
  { top: '22%', left: '80%', delay: '0.5s',  size: 8  },
  { top: '60%', left: '8%',  delay: '0.9s',  size: 5  },
  { top: '68%', left: '85%', delay: '0.3s',  size: 7  },
  { top: '42%', left: '4%',  delay: '1.3s',  size: 4  },
  { top: '38%', left: '92%', delay: '0.7s',  size: 6  },
  { top: '80%', left: '50%', delay: '1.1s',  size: 5  },
]

function LoadingView({ ownImage, targetImage, targetFirstName }: { ownImage?: string; targetImage?: string; targetFirstName: string }) {
  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #211430 0%, #432860 50%, #211430 100%)' }}
    >
      {/* Floating stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-myColor-300 star-drift"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}

      {/* Central glow */}
      <div
        className="absolute rounded-full orb-pulse"
        style={{
          width: 80, height: 80,
          background: 'radial-gradient(circle, rgba(202,161,247,0.6) 0%, transparent 70%)',
        }}
      />

      {/* Photos converging */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 90 }}>
        {/* Own photo */}
        <div className="absolute photo-pulse rounded-full" style={{ left: 8 }}>
          <Avatar image={ownImage} size={76} />
        </div>

        {/* Heart / connector */}
        <div className="z-10 w-9 h-9 rounded-full bg-myColor-600/80 flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        {/* Target photo */}
        <div className="absolute photo-pulse rounded-full" style={{ right: 8, animationDelay: '0.4s' }}>
          <Avatar image={targetImage} size={76} />
        </div>
      </div>

      <p className="text-white font-semibold text-base mt-8 mb-1.5">Reading the stars…</p>
      <p className="text-myColor-300 text-sm">Computing Dashakoot compatibility</p>

      <div className="flex gap-2 mt-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-myColor-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Result ───────────────────────────────────────────────────────────────────

function ResultView({
  match, targetFirstName, ownImage, targetImage,
}: { match: KundaliMatch; targetFirstName: string; ownImage?: string; targetImage?: string }) {
  const cfg = TIER_CONFIG[match.tier]
  const meetsMin = match.receivedPoints >= match.dashakootResult.total.minimum_required

  return (
    <div className="float-in">
      {/* ── Hero band ── */}
      <div className="relative px-6 pt-8 pb-10 flex flex-col items-center gap-5 overflow-hidden" style={{ background: 'linear-gradient(160deg, #211430 0%, #432860 55%, #211430 100%)' }}>

        {/* Wave — absolute at bottom, peaks rise up into the ring area */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 0, height: 170 }}>
          <WaveLottie />
        </div>

        {/* Content above the wave */}
        <div className="relative flex flex-col items-center gap-5 w-full" style={{ zIndex: 1 }}>
          {/* Two avatars */}
          <div className="flex items-center gap-4">
            <Avatar image={ownImage} size={44} />
            <svg className="w-4 h-4 text-myColor-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <Avatar image={targetImage} size={44} />
          </div>

          {/* Ring */}
          <CircularScore received={match.receivedPoints} total={match.totalPoints} />

          {/* Tier badge */}
          <div
            className="px-5 py-1.5 rounded-full text-sm font-bold tracking-wide"
            style={{ background: cfg.color + '28', color: cfg.color, border: `1px solid ${cfg.color}60` }}
          >
            {cfg.label} Compatibility
          </div>

          {/* Min threshold */}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${meetsMin ? 'text-emerald-400' : 'text-red-400'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {meetsMin
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {meetsMin ? 'Meets minimum threshold' : 'Below minimum threshold'} ({match.dashakootResult.total.minimum_required} pts)
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="px-4 py-5 space-y-4 bg-myColor-50/60">

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-myColor-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-myColor-50 flex items-center gap-2">
            <svg className="w-4 h-4 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-myColor-500">Summary</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            {match.summary.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-myColor-700 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>

        {/* Dashakoot breakdown */}
        <div className="bg-white rounded-2xl border border-myColor-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-myColor-50 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13l-.87.5M4.21 17.5l-.87.5M19.79 17.5l-.87-.5M4.21 6.5l-.87-.5M21 12h-1M4 12H3m15.36-6.36l-.7.7M6.34 17.66l-.7.7M17.66 17.66l-.7-.7M6.34 6.34l-.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-myColor-500">Dashakoot Breakdown</h3>
          </div>
          <div className="divide-y divide-myColor-50">
            {KOOTA_ORDER.map((key, idx) => {
              const koota = (match.dashakootResult as any)[key] as KootaResult
              if (!koota) return null
              return <KootaRow key={key} name={key} koota={koota} index={idx} />
            })}
          </div>
          <div className="px-5 py-3.5 bg-myColor-50/60 border-t border-myColor-100 flex items-center justify-between">
            <span className="text-xs font-medium text-myColor-500">Total Score</span>
            <span className="text-sm font-bold text-myColor-700">{match.receivedPoints} / {match.totalPoints}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-myColor-300 text-center px-4 pb-2 leading-relaxed">
          Kundali compatibility is one of many factors in a successful relationship. Use this as a guide, not a final decision.
        </p>
      </div>
    </div>
  )
}

// ─── Missing data ─────────────────────────────────────────────────────────────

function MissingDataView({ missingFor, targetFirstName, onClose }: { missingFor: MissingFor; targetFirstName: string; onClose: () => void }) {
  const messages: Record<MissingFor, string> = {
    self:   'Add your place of birth and birth time under Profile → Jatak to unlock this feature.',
    target: `${targetFirstName} hasn't added their birth details yet. Both profiles need place of birth and birth time.`,
    both:   'Both you and the other person need to add place of birth and birth time under Profile → Jatak.',
  }

  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <p className="text-base font-semibold text-myColor-900 mb-2">Birth details needed</p>
      <p className="text-sm text-myColor-500 max-w-xs leading-relaxed mb-7">{messages[missingFor]}</p>
      <button onClick={onClose} className="px-7 py-3 rounded-xl bg-myColor-600 text-white text-sm font-semibold hover:bg-myColor-700 transition-colors">
        Go back
      </button>
    </div>
  )
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorView({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm text-myColor-700 max-w-xs mb-6 leading-relaxed">{message}</p>
      <button onClick={onClose} className="px-7 py-3 rounded-xl border border-myColor-200 text-myColor-600 text-sm font-semibold hover:bg-myColor-50 transition-colors">
        Go back
      </button>
    </div>
  )
}
