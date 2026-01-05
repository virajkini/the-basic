'use client'

import { useEffect, useState } from 'react'

// Typewriter hook for animated text
function useTypewriter(texts: string[], typingSpeed = 80, deletingSpeed = 50, pauseDuration = 2000) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const currentText = texts[textIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration)
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setTextIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseDuration])

  // Cursor blink
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  return { displayText, showCursor }
}

// Open login sheet via custom event
const openLoginSheet = () => {
  window.dispatchEvent(new Event('openLoginSheet'))
}

// Dummy profile data
const dummyProfiles = [
  { name: 'Priya S.', age: 26, location: 'Mumbai', profession: 'Software Engineer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop' },
  { name: 'Aditya K.', age: 28, location: 'Bangalore', profession: 'Doctor', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
  { name: 'Sneha R.', age: 25, location: 'Goa', profession: 'Teacher', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop' },
  { name: 'Rahul M.', age: 30, location: 'Pune', profession: 'Business Analyst', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop' },
  { name: 'Ananya P.', age: 27, location: 'Chennai', profession: 'Architect', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop' },
  { name: 'Vikram D.', age: 29, location: 'Delhi', profession: 'Consultant', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop' },
]

export default function Home() {
  const typewriterTexts = [
    'Find Your Perfect Life Partner',
    'Connecting GSB Konkani Hearts',
    'Where Traditions Meet Modern Love',
    'Your Journey to Happiness Begins',
  ]

  const { displayText, showCursor } = useTypewriter(typewriterTexts)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80')`,
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-myColor-900/90 via-myColor-800/80 to-myColor-700/70" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-myColor-500/20 rounded-full blur-3xl animate-scale-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-myColor-400/20 rounded-full blur-3xl animate-scale-pulse delay-300" />

        {/* Konkani cultural pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          {/* Logo/Brand */}
          <div className="mb-8 animate-fade-in-down">
            <div className="inline-flex items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white mb-6 animate-fade-in-up opacity-0 tracking-tight">
            Amgel Jodi
          </h1>

          {/* Typewriter Tagline */}
          <div className="h-16 md:h-20 flex items-center justify-center mb-8">
            <p className="text-xl md:text-3xl lg:text-4xl text-white/90 font-light">
              <span>{displayText}</span>
              <span
                className={`inline-block w-[3px] h-6 md:h-8 bg-myColor-300 ml-1 align-middle transition-opacity duration-100 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
              />
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12 animate-fade-in-up delay-300 opacity-0">
            Your trusted matrimonial platform exclusively for the GSB Konkani community.
            Honoring traditions while embracing modern connections.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-500 opacity-0">
            <button
              onClick={openLoginSheet}
              className="group relative px-8 py-4 bg-white text-myColor-700 rounded-full font-semibold text-lg shadow-2xl hover:shadow-myColor-500/25 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-myColor-100 to-myColor-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <a
              href="#why-us"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
            >
              Learn More
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="relative py-24 md:py-32 bg-gradient-to-b from-myColor-50 to-white overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-myColor-900/5 to-transparent" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-myColor-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-myColor-300/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-4 animate-fade-in-up opacity-0">
              Why Amgel Jodi?
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-myColor-900 mb-6 animate-fade-in-up delay-100 opacity-0">
              Built for Our Community
            </h2>
            <p className="text-lg text-myColor-600 max-w-2xl mx-auto animate-fade-in-up delay-200 opacity-0">
              We understand the unique values and traditions of the GSB Konkani community,
              creating meaningful connections that honor our heritage.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1: Community Focused */}
            <div className="group relative animate-fade-in-up delay-200 opacity-0">
              <div className="glass-card rounded-2xl p-8 h-full transition-all duration-500 hover:shadow-2xl hover:shadow-myColor-500/10 hover:-translate-y-2 hover:bg-white/90">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-2xl flex items-center justify-center shadow-lg shadow-myColor-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-myColor-400 rounded-full animate-pulse-glow" />
                </div>

                <h3 className="text-xl font-bold text-myColor-900 mb-3">
                  Designed for Konkani GSB
                </h3>
                <p className="text-myColor-600 leading-relaxed">
                  Every caste has its unique values and traditions. We cater specifically to the nuances
                  and emotions that guide matchmaking decisions in our community.
                </p>
              </div>
            </div>

            {/* Card 2: Verified Profiles */}
            <div className="group relative animate-fade-in-up delay-300 opacity-0">
              <div className="glass-card rounded-2xl p-8 h-full transition-all duration-500 hover:shadow-2xl hover:shadow-myColor-500/10 hover:-translate-y-2 hover:bg-white/90">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-myColor-900 mb-3">
                  Guaranteed Verified Profiles
                </h3>
                <p className="text-myColor-600 leading-relaxed">
                  Every profile undergoes thorough verification to ensure authenticity.
                  Connect with real, genuine individuals looking for meaningful relationships.
                </p>
              </div>
            </div>

            {/* Card 3: Data Security */}
            <div className="group relative animate-fade-in-up delay-400 opacity-0">
              <div className="glass-card rounded-2xl p-8 h-full transition-all duration-500 hover:shadow-2xl hover:shadow-myColor-500/10 hover:-translate-y-2 hover:bg-white/90">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-myColor-900 mb-3">
                  Data is Safe & Secure
                </h3>
                <p className="text-myColor-600 leading-relaxed">
                  Your privacy is paramount. We use industry-leading security measures
                  to protect your personal information and conversations.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-16 animate-fade-in-up delay-500 opacity-0">
            <button
              onClick={openLoginSheet}
              className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-myColor-600 to-myColor-700 text-white rounded-full font-semibold text-lg shadow-xl shadow-myColor-500/30 hover:shadow-2xl hover:shadow-myColor-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Let's Get Started</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Profile Preview Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-white to-myColor-50 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-myColor-100/50 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-4 animate-fade-in-up opacity-0">
              Discover Profiles
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-myColor-900 mb-6 animate-fade-in-up delay-100 opacity-0">
              Meet Our Community Members
            </h2>
            <p className="text-lg text-myColor-600 max-w-2xl mx-auto animate-fade-in-up delay-200 opacity-0">
              Get a glimpse of verified profiles from our growing community.
              Register to view detailed profiles and connect.
            </p>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-7xl mx-auto">
            {dummyProfiles.map((profile, index) => (
              <div
                key={profile.name}
                className={`group relative animate-fade-in-up opacity-0`}
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  {/* Profile Image */}
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="absolute inset-0 w-full h-full object-cover filter blur-[3px] group-hover:blur-[2px] transition-all duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Lock Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-white font-semibold text-sm md:text-base truncate">
                      {profile.name}
                    </h4>
                    <p className="text-white/70 text-xs md:text-sm">
                      {profile.age} • {profile.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Register CTA */}
          <div className="text-center mt-12 animate-fade-in-up delay-700 opacity-0">
            <button
              onClick={openLoginSheet}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-myColor-700 rounded-full font-semibold shadow-xl border border-myColor-100 hover:border-myColor-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 text-myColor-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Register to View Full Profiles</span>
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-myColor-900 via-myColor-800 to-myColor-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-60 h-60 bg-myColor-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-myColor-400/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 animate-fade-in-up opacity-0">
              Ready to Find Your{' '}
              <span className="text-myColor-300">Perfect Match?</span>
            </h2>
            <p className="text-xl text-white/70 mb-10 animate-fade-in-up delay-100 opacity-0">
              Join thousands of GSB Konkani families who have found their life partners through Amgel Jodi.
              Your journey to happiness starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200 opacity-0">
              <button
                onClick={openLoginSheet}
                className="group px-10 py-4 bg-white text-myColor-700 rounded-full font-semibold text-lg shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="flex items-center justify-center gap-2">
                  Start Your Journey
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-myColor-950 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-myColor-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-heading font-bold">Amgel Jodi</span>
              </div>
              <p className="text-myColor-300 max-w-md">
                The trusted matrimonial platform for the GSB Konkani community.
                Connecting hearts while honoring traditions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#why-us" className="text-myColor-300 hover:text-white transition-colors duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <button onClick={openLoginSheet} className="text-myColor-300 hover:text-white transition-colors duration-200">
                    Login / Register
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy" className="text-myColor-300 hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-myColor-300 hover:text-white transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Links & Copyright */}
          <div className="mt-12 pt-8 border-t border-myColor-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-myColor-400 text-sm">
              &copy; {new Date().getFullYear()} Amgel Jodi. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-myColor-800 hover:bg-myColor-700 rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Twitter"
              >
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
