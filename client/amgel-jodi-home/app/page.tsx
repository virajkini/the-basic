'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { articles } from './articles'
import HeroGarland from './components/HeroGarland'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amgeljodi.app'

/** Public CloudFront origin for S3 `page-assets/` (see server fileManager.ts CLOUDFRONT_DOMAIN). */
const PAGE_ASSETS_CDN =
  process.env.NEXT_PUBLIC_PAGE_ASSETS_CDN_BASE ?? 'https://static.amgeljodi.com/page-assets'

const COMMUNITY_SECTION_IMAGE = `${PAGE_ASSETS_CDN}/SHI_0137.jpg`

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is GSB Konkani Matrimony?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'GSB Konkani Matrimony refers to matrimonial matchmaking services specifically for the Gaud Saraswat Brahmin (GSB) community, who speak Konkani and are primarily settled along India\'s Konkan coast and in cities like Mumbai, Mangalore, and Udupi. Amgel Jodi is a dedicated GSB Konkani matrimony platform offering verified profiles and community-focused matchmaking.'
      }
    },
    {
      '@type': 'Question',
      name: 'How does Amgel Jodi verify GSB Konkani profiles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every profile is manually verified by our team: we place a phone call to the number on file to confirm identity and check that the member belongs to the GSB Konkani community and is genuinely open to looking for matches.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is Amgel Jodi free to join for GSB Konkani matrimony?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Amgel Jodi is completely free to use: creating a profile, manual verification, browsing matches, connecting with families, and using core matrimony features are all included at no cost. There are no paid tiers or hidden fees on the platform.'
      }
    },
    {
      '@type': 'Question',
      name: 'What makes Amgel Jodi different from other GSB Konkani matrimony sites?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Amgel Jodi is built exclusively for the GSB Konkani community with a family-first approach, verified profiles, and privacy controls tailored to community values unlike large generic matrimony platforms.'
      }
    }
  ]
}

// Open login sheet via custom event
const openLoginSheet = () => {
  window.dispatchEvent(new Event('openLoginSheet'))
}

/** Public stats (static HTML for crawlers and first paint—must match footer copy). */
const TRUST_STATS = {
  happyFamilies: '500+',
  freeHeadline: 'Free',
  freeSubtext: 'Entire platform',
  verifiedPercent: '100%',
  taglineFamilies: 'Trusted by GSB Konkani families across India.',
  taglineFree: 'No membership fees, upgrades, or paid unlocks.',
  taglineVerified: 'Human phone checks before profiles appear in search.',
} as const

function GooglePlayBadge({ compact = false, tone = 'default' }: { compact?: boolean; tone?: 'default' | 'hero' }) {
  const isHero = tone === 'hero'

  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-3 rounded-2xl border shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
        isHero
          ? 'border-white/14 bg-white/8 text-white shadow-black/20 backdrop-blur-sm hover:border-white/24 hover:bg-white/12'
          : 'border-white/15 bg-zinc-950/80 text-white shadow-black/20 hover:border-white/30 hover:bg-zinc-900'
      } ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
      aria-label="Download Amgel Jodi on Google Play"
    >
      <span
        className={`flex items-center justify-center rounded-xl ring-1 ${
          isHero ? 'bg-black/20 ring-white/10' : 'bg-white/10 ring-white/10'
        } ${compact ? 'h-11 w-11' : 'h-12 w-12'}`}
      >
        <svg viewBox="0 0 24 24" className={`${compact ? 'h-6 w-6' : 'h-7 w-7'}`} aria-hidden="true">
          <path fill="#34A853" d="M4.8 3.8 13.9 13 4.8 20.2c-.5-.3-.8-.9-.8-1.6V5.4c0-.7.3-1.3.8-1.6Z" />
          <path fill="#4285F4" d="m16.8 10.6 2.9 1.7c1 .6 1 1.8 0 2.4l-2.9 1.7-3.2-3.2 3.2-2.6Z" />
          <path fill="#FBBC04" d="m4.8 20.2 9.8-7.7 2.2 2.2-8.9 5.1c-1.1.6-2.3.7-3.1.4Z" />
          <path fill="#EA4335" d="m4.8 3.8 3.1-.4c.8-.1 1.7.1 2.4.5l6.5 3.7-2.2 2.2-9.8-6Z" />
        </svg>
      </span>
      <span className="text-left leading-tight">
        <span className={`block ${isHero ? 'text-white/55' : 'text-white/60'} ${compact ? 'text-[10px]' : 'text-[11px]'}`}>Get the app on</span>
        <span className={`block font-semibold tracking-tight ${compact ? 'text-base' : 'text-lg'}`}>Google Play</span>
      </span>
      {!compact && (
        <span className={`hidden text-sm transition-transform duration-300 group-hover:translate-x-0.5 md:inline-flex ${isHero ? 'text-white/55' : 'text-white/60'}`}>
          Android
        </span>
      )}
    </a>
  )
}

function HeroPlayLink() {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-full border border-white/14 bg-white/6 px-4 py-3 text-white/88 backdrop-blur-sm transition-all duration-300 hover:border-white/24 hover:bg-white/10"
      aria-label="Download Amgel Jodi on Google Play"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 ring-1 ring-white/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#34A853" d="M4.8 3.8 13.9 13 4.8 20.2c-.5-.3-.8-.9-.8-1.6V5.4c0-.7.3-1.3.8-1.6Z" />
          <path fill="#4285F4" d="m16.8 10.6 2.9 1.7c1 .6 1 1.8 0 2.4l-2.9 1.7-3.2-3.2 3.2-2.6Z" />
          <path fill="#FBBC04" d="m4.8 20.2 9.8-7.7 2.2 2.2-8.9 5.1c-1.1.6-2.3.7-3.1.4Z" />
          <path fill="#EA4335" d="m4.8 3.8 3.1-.4c.8-.1 1.7.1 2.4.5l6.5 3.7-2.2 2.2-9.8-6Z" />
        </svg>
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[11px] text-white/50">Download the Android app</span>
        <span className="block text-sm font-semibold tracking-tight text-white">Get it on Google Play</span>
      </span>
      <svg
        className="h-4 w-4 text-white/45 transition-transform duration-300 group-hover:translate-x-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}

export default function Home() {
  const [phraseIndex, setPhraseIndex] = useState(0)

  const phrases = [
    "Find Your Perfect Match",
    "Completely Free",
    "Your Story Begins Here",
    "Konkani Hearts Unite",
  ]

  // Smooth phrase rotation
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length)
    }, 2400)

    return () => window.clearTimeout(timeout)
  }, [phraseIndex, phrases.length])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Royal wedding invitation */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PAGE_ASSETS_CDN}/SHI_1928.jpg)` }}
        />

        {/* Deep plum overlay — darker at edges, breathing room in the middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-myColor-950/[0.94] via-myColor-900/[0.87] to-myColor-950/[0.96]" />

        {/* Candlelight glow — warm gold halo behind the couple */}
        <div className="absolute left-1/2 top-[38%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-myColor-400/[0.10] blur-3xl md:h-[46rem] md:w-[52rem]" />
        <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-myColor-500/15 blur-3xl animate-float" />
        <div className="absolute right-[12%] top-[18%] h-64 w-64 rounded-full bg-myColor-400/10 blur-3xl animate-float delay-500" />

        {/* Bottom fade into the next section */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pb-16 pt-24 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-myColor-300/30 bg-white/[0.06] px-5 py-2 backdrop-blur-sm animate-fade-in-down md:mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-myColor-300 animate-pulse" />
              <span className="text-[11px] font-medium uppercase tracking-[0.26em] text-myColor-100/90 md:text-xs">
                Exclusively for our community
              </span>
            </div>

            {/* Main Title */}
            <h1 className="animate-fade-in-up">
              <span className="block font-display text-6xl font-semibold tracking-tight text-myColor-50 sm:text-7xl md:text-8xl">
                Amgel{' '}
                <span className="inline-block bg-gradient-to-r from-myColor-300 via-myColor-400 to-myColor-300 bg-clip-text pr-[0.14em] italic text-transparent">
                  Jodi
                </span>
              </span>
              <span className="mt-4 block text-xs font-medium uppercase tracking-[0.42em] text-white/70 sm:text-sm md:text-base">
                GSB Konkani Matrimony
              </span>
            </h1>

            {/* Ornamental divider */}
            <div className="mt-6 flex items-center justify-center gap-3 animate-fade-in-up delay-100" aria-hidden>
              <span className="h-px w-14 bg-gradient-to-r from-transparent to-myColor-300/60 md:w-20" />
              <span className="h-1.5 w-1.5 rotate-45 bg-myColor-300/80" />
              <span className="h-px w-14 bg-gradient-to-l from-transparent to-myColor-300/60 md:w-20" />
            </div>

            {/* Varmala — garland exchange, plays once (negative margin swallows the empty top of the 4:3 canvas) */}
            <div className="-mt-6 animate-fade-in-up delay-200 md:-mt-10">
              <HeroGarland />
            </div>

            {/* Rotating phrase */}
            <div className="flex h-12 items-center justify-center overflow-hidden md:h-14">
              <p
                key={phrases[phraseIndex]}
                className="animate-hero-cycle font-display text-2xl italic text-myColor-200 sm:text-3xl md:text-4xl"
              >
                {phrases[phraseIndex]}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-col items-center justify-center gap-4 animate-fade-in-up delay-300 sm:flex-row">
              <button
                onClick={openLoginSheet}
                className="group relative w-full max-w-xs rounded-full bg-gradient-to-b from-myColor-400 to-myColor-600 px-10 py-4 text-lg font-semibold text-white shadow-2xl shadow-myColor-500/30 transition-all duration-300 hover:scale-105 hover:shadow-myColor-400/50 active:scale-95 sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2">
                  Begin Your Story
                  <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>

              <a
                href="#how-it-works"
                className="w-full max-w-xs rounded-full border border-white/25 px-10 py-4 text-center text-lg font-medium text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10 sm:w-auto"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-9 flex flex-col items-center gap-3 animate-fade-in-up delay-400">
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-white/55">
                <span className="h-px w-10 bg-white/18" />
                <span>Also on Android</span>
                <span className="h-px w-10 bg-white/18" />
              </div>
              <HeroPlayLink />
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce md:block">
              <svg className="h-6 w-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Stats Section */}
      <section className="relative py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
            {/* Stat 1 */}
            <div className="group relative flex h-full flex-col items-center rounded-2xl border border-myColor-100 bg-white p-6 text-center shadow-lg shadow-myColor-500/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-myColor-500/10 md:p-8">
              <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-myColor-500 to-myColor-600 shadow-lg shadow-myColor-500/30">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-3xl font-display font-semibold text-myColor-900 md:text-4xl">{TRUST_STATS.happyFamilies}</p>
              <p className="mt-2 font-medium text-myColor-600">Happy Families</p>
              <p className="mt-3 min-h-[2.75rem] text-sm leading-snug text-myColor-500">{TRUST_STATS.taglineFamilies}</p>
            </div>

            {/* Stat 2 */}
            <div className="group relative flex h-full flex-col items-center rounded-2xl border border-myColor-100 bg-white p-6 text-center shadow-lg shadow-myColor-500/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-myColor-500/10 md:p-8">
              <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <p className="text-3xl font-display font-semibold text-myColor-900 md:text-4xl">{TRUST_STATS.freeHeadline}</p>
              <p className="mt-2 font-medium text-myColor-600">{TRUST_STATS.freeSubtext}</p>
              <p className="mt-3 min-h-[2.75rem] text-sm leading-snug text-myColor-500">{TRUST_STATS.taglineFree}</p>
            </div>

            {/* Stat 3 */}
            <div className="group relative flex h-full flex-col items-center rounded-2xl border border-myColor-100 bg-white p-6 text-center shadow-lg shadow-myColor-500/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-myColor-500/10 md:p-8">
              <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-3xl font-display font-semibold text-myColor-900 md:text-4xl">{TRUST_STATS.verifiedPercent}</p>
              <p className="mt-2 font-medium text-myColor-600">Manually verified profiles</p>
              <p className="mt-3 min-h-[2.75rem] text-sm leading-snug text-myColor-500">{TRUST_STATS.taglineVerified}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marriage biodata — landing CTA */}
      <section className="relative border-t border-myColor-100/80 bg-gradient-to-b from-myColor-50/90 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 overflow-hidden rounded-3xl border border-myColor-100/90 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(33,20,48,0.2)] ring-1 ring-myColor-100/50 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-myColor-500 to-myColor-700 text-white shadow-lg shadow-myColor-600/30">
                <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-myColor-500">New</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-myColor-900 md:text-3xl">
                  Create marriage bio-data for <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">FREE</span>
                </h2>
                <p className="mt-2 max-w-xl text-myColor-600 md:text-lg">
                  Build a polished marriage biodata PDF from your verified profile—download and share in minutes. The biodata tool and the rest of the matrimony platform are completely free to use.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Link
                href="/create-free-biodata"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-myColor-700 to-myColor-800 px-8 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-myColor-700/25 transition-all hover:from-myColor-800 hover:to-myColor-900 hover:shadow-xl active:scale-[0.98]"
              >
                Learn more
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Journey */}
      <section id="how-it-works" className="relative py-24 md:py-32 bg-myColor-50 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-myColor-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-myColor-100/50 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-4">
              Simple & Meaningful
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-semibold text-myColor-900 mb-4">
              Your Journey to Forever
            </h2>
            <p className="text-lg text-myColor-600 max-w-xl mx-auto">
              Three simple steps. One beautiful beginning.
            </p>
          </div>

          {/* Steps - Timeline Style */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-12 md:mb-16">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-myColor-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-white rounded-full flex items-center justify-center text-myColor-600 font-bold text-lg shadow-lg border-2 border-myColor-200">
                  1
                </div>
                {/* Connecting line */}
                <div className="hidden md:block absolute top-full left-1/2 w-0.5 h-16 bg-gradient-to-b from-myColor-300 to-transparent" />
              </div>
              <div className="text-center md:text-left flex-1 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-myColor-100">
                <h3 className="text-xl md:text-2xl font-bold text-myColor-900 mb-2">Create Your Profile</h3>
                <p className="text-myColor-600 leading-relaxed">
                  Enter your details and upload a few photos. Clear, honest, and done in under 2 minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-10 mb-12 md:mb-16">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30 -rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-lg shadow-lg border-2 border-green-200">
                  2
                </div>
                {/* Connecting line */}
                <div className="hidden md:block absolute top-full left-1/2 w-0.5 h-16 bg-gradient-to-b from-green-300 to-transparent" />
              </div>
              <div className="text-center md:text-right flex-1 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100">
                <h3 className="text-xl md:text-2xl font-bold text-myColor-900 mb-2">Discover Matches</h3>
                <p className="text-myColor-600 leading-relaxed">
                  Browse verified profiles from our GSB Konkani community. Filter by location, profession, and height, and see the Kundali match score to find someone who genuinely fits.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-600 font-bold text-lg shadow-lg border-2 border-amber-200">
                  3
                </div>
              </div>
              <div className="text-center md:text-left flex-1 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-100">
                <h3 className="text-xl md:text-2xl font-bold text-myColor-900 mb-2">Connect & Meet</h3>
                <p className="text-myColor-600 leading-relaxed">
                  Send a connection request. Once the other person accepts, both contacts are unlocked and you can connect directly. Contact and matching are included at no cost. Amgel Jodi is completely free, with no paid unlocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Profiles Section */}
      <section className="relative py-24 md:py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-4">
              Discover Profiles
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-semibold text-myColor-900 mb-4">
              Meet Our Community Members
            </h2>
            <p className="text-lg text-myColor-600 max-w-2xl mx-auto">
              Get a glimpse of verified profiles from our growing community. Register for free to view full profiles and connect—there are no paid tiers on Amgel Jodi.
            </p>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-12">
            {[
              { name: 'Chetana S.', age: 26, city: 'Mumbai', img: `${PAGE_ASSETS_CDN}/chetana.jpg` },
              { name: 'Raksha K.', age: 28, city: 'Bangalore', img: `${PAGE_ASSETS_CDN}/raksha.jpg` },
              { name: 'Archana R.', age: 25, city: 'Goa', img: `${PAGE_ASSETS_CDN}/archana.jpg` },
              { name: 'Suhas M.', age: 30, city: 'Pune', img: `${PAGE_ASSETS_CDN}/suhas.png` },
              { name: 'Ninaad P.', age: 27, city: 'Chennai', img: `${PAGE_ASSETS_CDN}/ninaad.png` },
              { name: 'Ashish D.', age: 29, city: 'Delhi', img: `${PAGE_ASSETS_CDN}/ashish.png` },
            ].map((profile, index) => (
              <div key={index} className="group relative">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-myColor-100">
                  {/* Profile Image */}
                  <img
                    src={profile.img}
                    alt={profile.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover blur-[3px] group-hover:blur-[5px] transition-all duration-300"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-myColor-900/80 via-myColor-900/20 to-transparent" />
                  {/* Lock icon */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {/* Profile Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white text-lg">{profile.name}</h3>
                    <p className="text-white/80 text-sm">{profile.age} • {profile.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={openLoginSheet}
              className="inline-flex items-center gap-2 px-8 py-4 bg-myColor-600 hover:bg-myColor-700 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-myColor-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Register to View Full Profiles
            </button>
          </div>
        </div>
      </section>

      {/* Why Amgel Jodi - Unique Value Props */}
      <section className="relative py-24 md:py-32 bg-myColor-950 overflow-hidden">
        {/* SVG Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        {/* Background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-myColor-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-myColor-500/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-40 w-80 h-80 bg-myColor-600/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-myColor-800 text-myColor-300 rounded-full text-sm font-medium mb-6">
                Why Choose Us
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-semibold text-white mb-6 leading-tight">
                Built for Our
                <span className="text-myColor-400"> Community,</span><br />
                By Our Community
              </h2>
              <p className="text-lg text-myColor-300 mb-10 leading-relaxed">
                We're not just a matrimony platform. We're Konkani GSBs who understand the delicate balance
                of honoring traditions while embracing modern connections.
              </p>

              {/* Feature list */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Every Profile Verified</h3>
                    <p className="text-myColor-400">
                      <span className="text-myColor-300">100% manually verified:</span> our team calls each applicant to confirm they belong to the GSB Konkani community and are genuinely open to looking for matches, then reviews the profile before it goes live. No fake profiles. No time wasted. Only genuine people seeking genuine connections.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Privacy You Can Trust</h3>
                    <p className="text-myColor-400">Your data stays yours. We never share your information without your consent.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Family-First Approach</h3>
                    <p className="text-myColor-400">Because we know that in our culture, it's not just two people - it's two families coming together.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto aspect-square w-full max-w-lg">
                {/* Decorative rings */}
                <div className="absolute inset-0 animate-pulse rounded-full border-2 border-myColor-700/30" />
                <div className="absolute inset-8 animate-pulse rounded-full border-2 border-myColor-600/30 delay-300" />
                <div className="absolute inset-16 animate-pulse rounded-full border-2 border-myColor-500/30 delay-500" />

                {/* Center image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-myColor-500 shadow-2xl shadow-myColor-500/30 sm:h-48 sm:w-48">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${COMMUNITY_SECTION_IMAGE})` }}
                      role="img"
                      aria-label="Couple holding hands during a traditional GSB Konkani wedding ceremony"
                    />
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute right-8 top-8 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <span className="text-2xl">🪔</span>
                </div>
                <div className="absolute bottom-8 left-8 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm delay-500">
                  <span className="text-2xl">🌺</span>
                </div>
                <div className="absolute -left-4 top-1/2 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm delay-1000">
                  <span className="text-xl">🤝</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-b from-myColor-50 to-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-3">
              Love Stories
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-myColor-900">
              Families That Found Each Other
            </h2>
          </div>
        </div>

        {/* Auto-scrolling Carousel */}
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll-left gap-6 py-4">
            {[
              { initials: 'SP', names: 'Sneha & Rohit Pai', year: '2024', quote: 'The families connected instantly - it felt like it was meant to be.' },
              { initials: 'AK', names: 'Ananya & Kiran Shenoy', year: '2024', quote: 'Found my soulmate within weeks. Amgel Jodi made it so simple!' },
              { initials: 'PM', names: 'Priya & Mohan Kamath', year: '2023', quote: 'A perfect blend of tradition and modern matchmaking.' },
              { initials: 'RN', names: 'Rekha & Nikhil Bhat', year: '2023', quote: 'Our parents loved how easy it was to connect with families.' },
              { initials: 'DV', names: 'Deepa & Varun Prabhu', year: '2024', quote: 'Verified profiles gave us confidence in our search.' },
              { initials: 'MG', names: 'Meera & Gaurav Nayak', year: '2023', quote: 'We are grateful for this beautiful platform.' },
              { initials: 'SP', names: 'Sneha & Rohit Pai', year: '2024', quote: 'The families connected instantly - it felt like it was meant to be.' },
              { initials: 'AK', names: 'Ananya & Kiran Shenoy', year: '2024', quote: 'Found my soulmate within weeks. Amgel Jodi made it so simple!' },
              { initials: 'PM', names: 'Priya & Mohan Kamath', year: '2023', quote: 'A perfect blend of tradition and modern matchmaking.' },
              { initials: 'RN', names: 'Rekha & Nikhil Bhat', year: '2023', quote: 'Our parents loved how easy it was to connect with families.' },
              { initials: 'DV', names: 'Deepa & Varun Prabhu', year: '2024', quote: 'Verified profiles gave us confidence in our search.' },
              { initials: 'MG', names: 'Meera & Gaurav Nayak', year: '2023', quote: 'We are grateful for this beautiful platform.' },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 bg-white rounded-2xl p-6 shadow-lg border border-myColor-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-myColor-200 to-myColor-300 rounded-full flex items-center justify-center">
                    <span className="text-myColor-700 font-bold">{testimonial.initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-myColor-900 text-sm">{testimonial.names}</p>
                    <p className="text-myColor-500 text-xs">Married in {testimonial.year}</p>
                  </div>
                </div>
                <p className="text-myColor-600 text-sm italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fffdf8_0%,#fdf5ff_100%)] py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="inline-block rounded-full bg-myColor-100 px-4 py-2 text-sm font-medium text-myColor-700">
                  Explore Marriage & Community
                </span>
                <h2 className="mt-4 text-3xl font-display font-semibold text-myColor-900 md:text-4xl">
                  Short reads on marriage, traditions, and GSB Konkani life
                </h2>
                <p className="mt-3 text-base leading-7 text-myColor-600 md:text-lg">
                  Browse quick articles on Lagna culture, family values, festival life, and modern matchmaking across Udupi, Mangalore, Mumbai, Bangalore, and beyond.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/${article.slug}`}
                  title={`Read article: ${article.title}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-myColor-100 bg-white shadow-[0_18px_60px_-36px_rgba(33,20,48,0.28)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-myColor-100">
                    <img
                      src={article.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-myColor-400">
                      {article.eyebrow}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold leading-snug text-myColor-900 transition-colors group-hover:text-myColor-700">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-myColor-600">
                      {article.description}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-myColor-700">
                      Read article
                      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-myColor-900 via-myColor-800 to-myColor-950" />

        {/* SVG Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-myColor-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-myColor-400/15 rounded-full blur-3xl animate-float delay-500" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-white mb-6 leading-tight">
              Your Perfect Match is
              <br />
              <span className="text-myColor-200">Waiting to Meet You</span>
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto">
              Join the community where tradition meets technology. Profiles, verification, matching, and contact are all completely free—there is nothing to pay before you can get started.
            </p>

            <button
              onClick={openLoginSheet}
              className="group px-12 py-5 bg-white text-myColor-700 rounded-full font-semibold text-lg shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="flex items-center justify-center gap-2">
                Start Your Journey Today
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>

            <p className="mt-6 text-white/50 text-sm">
              Free to register and free to use throughout. Takes less than 2 minutes to get started.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-myColor-950 text-white py-16 relative overflow-hidden">
        {/* SVG Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-display font-semibold">Amgel Jodi</span>
              </div>
              <p className="text-myColor-400 max-w-md leading-relaxed">
                The dedicated GSB Konkani matrimony platform trusted by families across Mumbai,
                Mangalore, and Udupi: 500+ happy families since 2023 and 100% manually verified profiles—same numbers you see at the top of our homepage.
              </p>
              <div className="mt-6">
                <GooglePlayBadge compact />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/about" className="text-myColor-400 hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-myColor-400 hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-myColor-400 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <button onClick={openLoginSheet} className="text-myColor-400 hover:text-white transition-colors">
                    Login / Register
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/privacy" className="text-myColor-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-myColor-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/child-safety" className="text-myColor-400 hover:text-white transition-colors">
                    Child Safety
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 pt-8 border-t border-myColor-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-myColor-500 text-sm">
              &copy; {new Date().getFullYear()} Amgel Jodi. Made with love for our community.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a href="https://www.instagram.com/amgel_jodi/" rel="noopener noreferrer" target="_blank" className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61576507635393" rel="noopener noreferrer" target="_blank" className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.009 10.125 11.927v-8.437H7.078v-3.49h3.047V9.412c0-3.021 1.792-4.689 4.533-4.689 1.313 0 2.686.235 2.686.235v2.969H15.83c-1.491 0-1.956.931-1.956 1.886v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.082 24 18.092 24 12.073z"/>
                </svg>
              </a>
              <a href="https://wa.me/919108337872" rel="noopener noreferrer" target="_blank" className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors" aria-label="WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.16 1.6 5.97L0 24l6.28-1.64a11.8 11.8 0 005.77 1.48h.01c6.56 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.45-8.45zm-8.46 18.3h-.01a9.84 9.84 0 01-5.02-1.38l-.36-.21-3.73.98 1-3.64-.24-.37a9.83 9.83 0 01-1.5-5.25c0-5.43 4.42-9.85 9.87-9.85 2.63 0 5.1 1.02 6.96 2.88a9.78 9.78 0 012.88 6.96c0 5.44-4.43 9.88-9.85 9.88zm5.41-7.41c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.48-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.27.5 1.71.64.72.23 1.37.2 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </>
  )
}
