export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-myColor-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-myColor-900 mb-6 animate-fade-in-up">
            Amgel Jodi
          </h1>
          <p className="text-xl md:text-2xl text-myColor-700 mb-8 animate-fade-in-up delay-100 opacity-0">
            Your trusted partner in finding your perfect match
          </p>
          <p className="text-lg text-myColor-600 mb-12 animate-fade-in-up delay-200 opacity-0">
            Connecting GSB Konkani families for meaningful relationships
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-myColor-50 hover:bg-myColor-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up delay-100 opacity-0">
            <div className="w-16 h-16 bg-myColor-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-float">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-myColor-900 mb-2">Verified Profiles</h3>
            <p className="text-myColor-600">All profiles are verified to ensure authenticity and trust</p>
          </div>

          <div className="text-center p-6 rounded-lg bg-myColor-50 hover:bg-myColor-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up delay-200 opacity-0">
            <div className="w-16 h-16 bg-myColor-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-float delay-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-myColor-900 mb-2">Secure & Private</h3>
            <p className="text-myColor-600">Your privacy is our priority with secure authentication</p>
          </div>

          <div className="text-center p-6 rounded-lg bg-myColor-50 hover:bg-myColor-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up delay-300 opacity-0">
            <div className="w-16 h-16 bg-myColor-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-float delay-400">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-myColor-900 mb-2">Community Focused</h3>
            <p className="text-myColor-600">Dedicated to the GSB Konkani community</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto animate-fade-in-up delay-400 opacity-0">
          <h2 className="text-3xl md:text-4xl font-bold text-myColor-900 mb-4">
            Ready to Find Your Match?
          </h2>
          <p className="text-lg text-myColor-600 mb-8">
            Join thousands of GSB Konkani families in their search for meaningful connections
          </p>
        </div>
      </section>
    </main>
  )
}

