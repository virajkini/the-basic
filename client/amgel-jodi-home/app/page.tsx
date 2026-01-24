'use client'

import { useEffect, useState, useRef } from 'react'

// Open login sheet via custom event
const openLoginSheet = () => {
  window.dispatchEvent(new Event('openLoginSheet'))
}

// Animated counter hook
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(!startOnView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setHasStarted(true)
            observer.disconnect()
          }
        },
        { threshold: 0.5 }
      )
      observer.observe(ref.current)
      return () => observer.disconnect()
    }
  }, [startOnView])

  useEffect(() => {
    if (!hasStarted) return
    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration, hasStarted])

  return { count, ref }
}

export default function Home() {
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [phraseIndex, setPhraseIndex] = useState(0)

  const phrases = [
    "Find Your Perfect Match",
    "Where Traditions Meet Love",
    "Your Story Begins Here",
    "Konkani Hearts Unite",
  ]

  // Typewriter effect
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex]
    const typeSpeed = isDeleting ? 50 : 100
    const pauseTime = isDeleting ? 500 : 2000

    if (!isDeleting && displayText === currentPhrase) {
      setTimeout(() => setIsDeleting(true), pauseTime)
      return
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false)
      setPhraseIndex((prev) => (prev + 1) % phrases.length)
      return
    }

    const timeout = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentPhrase.substring(0, displayText.length - 1)
          : currentPhrase.substring(0, displayText.length + 1)
      )
    }, typeSpeed)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, phraseIndex, phrases])

  const stat1 = useCounter(500, 2000)
  const stat2 = useCounter(150, 2000)
  const stat3 = useCounter(98, 2000)

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Emotional & Clean */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80)' }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-myColor-900/95 via-myColor-800/90 to-myColor-950/95" />

        {/* SVG Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-myColor-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-myColor-400/15 rounded-full blur-3xl animate-float delay-500" />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 animate-fade-in-down">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Exclusively for GSB Konkani Community</span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-semibold text-white mb-6 animate-fade-in-up tracking-tight">
              Amgel Jodi
            </h1>

            {/* Typewriter Text */}
            <div className="h-16 md:h-20 flex items-center justify-center mb-6">
              <p className="text-2xl md:text-4xl lg:text-5xl text-myColor-300 font-medium">
                {displayText}
                <span className="typewriter-cursor text-white">|</span>
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-300">
              Not just another matrimony site. A place where families come together,
              traditions are honored, and love stories begin.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-500">
              <button
                onClick={openLoginSheet}
                className="group relative px-10 py-4 bg-white text-myColor-800 rounded-full font-semibold text-lg shadow-2xl shadow-white/20 hover:shadow-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  Begin Your Story
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>

              <a
                href="#how-it-works"
                className="px-10 py-4 border border-white/30 text-white rounded-full font-medium text-lg hover:bg-white/10 transition-all duration-300"
              >
                See How It Works
              </a>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Stats Section */}
      <section className="relative py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Stat 1 */}
            <div ref={stat1.ref} className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-myColor-500/5 border border-myColor-100 hover:shadow-xl hover:shadow-myColor-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-xl flex items-center justify-center shadow-lg shadow-myColor-500/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-display font-semibold text-myColor-900">
                    {stat1.count}+
                  </div>
                  <p className="text-myColor-600 font-medium">Happy Families</p>
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div ref={stat2.ref} className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-myColor-500/5 border border-myColor-100 hover:shadow-xl hover:shadow-myColor-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-display font-semibold text-myColor-900">
                    {stat2.count}+
                  </div>
                  <p className="text-myColor-600 font-medium">Successful Matches</p>
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div ref={stat3.ref} className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-myColor-500/5 border border-myColor-100 hover:shadow-xl hover:shadow-myColor-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-display font-semibold text-myColor-900">
                    {stat3.count}%
                  </div>
                  <p className="text-myColor-600 font-medium">Verified Profiles</p>
                </div>
              </div>
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
                  Tell your story in just 2 minutes. Share what makes you unique and let your personality shine through.
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
                  Browse verified profiles from our GSB Konkani community. Find someone who shares your values and traditions.
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
                  Start meaningful conversations. Let families come together and write your beautiful love story.
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
              Get a glimpse of verified profiles from our growing community. Register to view detailed profiles and connect.
            </p>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-12">
            {[
              { name: 'Priya S.', age: 26, city: 'Mumbai', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
              { name: 'Aditya K.', age: 28, city: 'Bangalore', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
              { name: 'Sneha R.', age: 25, city: 'Goa', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80' },
              { name: 'Rahul M.', age: 30, city: 'Pune', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
              { name: 'Ananya P.', age: 27, city: 'Chennai', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
              { name: 'Vikram D.', age: 29, city: 'Delhi', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80' },
            ].map((profile, index) => (
              <div key={index} className="group relative">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-myColor-100">
                  {/* Profile Image */}
                  <img
                    src={profile.img}
                    alt={profile.name}
                    className="w-full h-full object-cover blur-md group-hover:blur-lg transition-all duration-300"
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
                    <p className="text-myColor-400">No fake profiles. No time wasted. Only genuine people seeking genuine connections.</p>
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
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Decorative rings */}
                <div className="absolute inset-0 border-2 border-myColor-700/30 rounded-full animate-pulse" />
                <div className="absolute inset-8 border-2 border-myColor-600/30 rounded-full animate-pulse delay-300" />
                <div className="absolute inset-16 border-2 border-myColor-500/30 rounded-full animate-pulse delay-500" />

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-myColor-500/30">
                    <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float">
                  <span className="text-2xl">🪔</span>
                </div>
                <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float delay-500">
                  <span className="text-2xl">🌺</span>
                </div>
                <div className="absolute top-1/2 -left-4 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float delay-1000">
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
              Join the community where tradition meets technology.
              Your beautiful story is just a click away.
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
              Free to register. Takes less than 2 minutes.
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
                The matrimonial platform designed with love for the GSB Konkani community.
                Where traditions are honored and new beginnings are celebrated.
              </p>
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
              <a href="#" className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
