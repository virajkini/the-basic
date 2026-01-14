import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | Amgel Jodi - GSB Konkani Matrimony',
  description: 'Learn about Amgel Jodi, the trusted matrimony platform built for the GSB Konkani community. Our mission is to bring families together while honoring traditions.',
  alternates: {
    canonical: 'https://amgeljodi.com/about',
  },
  openGraph: {
    title: 'About Amgel Jodi - Our Story & Mission',
    description: 'Discover how Amgel Jodi is connecting GSB Konkani families across the globe.',
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-myColor-900 via-myColor-800 to-myColor-950 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/80 text-sm font-medium mb-6">
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6">
              About Amgel Jodi
            </h1>
            <p className="text-xl text-white/70">
              Building bridges between hearts while honoring our beautiful Konkani traditions.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-4">
                  Our Mission
                </span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-myColor-900 mb-6">
                  Connecting Families, Honoring Traditions
                </h2>
                <p className="text-myColor-600 leading-relaxed mb-4">
                  Amgel Jodi was born from a simple yet profound understanding: in our GSB Konkani community, marriage is not just about two individuals—it&apos;s about two families coming together.
                </p>
                <p className="text-myColor-600 leading-relaxed">
                  We created a platform that respects this beautiful tradition while embracing the convenience of modern technology. Our mission is to make the journey of finding a life partner meaningful, secure, and true to our cultural values.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-myColor-100 to-myColor-200 rounded-3xl flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-myColor-500 to-myColor-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-myColor-500/30">
                    <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-2 bg-myColor-100 text-myColor-700 rounded-full text-sm font-medium mb-4">
                  Our Values
                </span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-myColor-900">
                  What We Stand For
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-myColor-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-myColor-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-myColor-900 mb-3">Trust & Verification</h3>
                  <p className="text-myColor-600">
                    Every profile is verified to ensure genuine connections. We believe in quality over quantity.
                  </p>
                </div>

                <div className="bg-myColor-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-myColor-900 mb-3">Privacy First</h3>
                  <p className="text-myColor-600">
                    Your personal information is sacred. We never share your data without explicit consent.
                  </p>
                </div>

                <div className="bg-myColor-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-myColor-900 mb-3">Family Values</h3>
                  <p className="text-myColor-600">
                    We understand that families play a vital role. Our platform is designed with family involvement in mind.
                  </p>
                </div>
              </div>
            </div>

            {/* Why We're Different */}
            <div className="bg-myColor-900 rounded-3xl p-8 md:p-12 text-white">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  Why We&apos;re Different
                </h2>
                <p className="text-myColor-300 max-w-2xl mx-auto">
                  Amgel Jodi isn&apos;t just another matrimony site. Here&apos;s what sets us apart.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-myColor-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Community Focused</h3>
                    <p className="text-myColor-300">Built exclusively for the GSB Konkani community, understanding our unique traditions and values.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-myColor-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Modern & Intuitive</h3>
                    <p className="text-myColor-300">A beautiful, easy-to-use platform that respects your time while maintaining traditional values.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-myColor-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Verified Profiles Only</h3>
                    <p className="text-myColor-300">We manually verify each profile to ensure you&apos;re connecting with genuine individuals.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-myColor-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Free to Start</h3>
                    <p className="text-myColor-300">Create your profile and explore matches for free. Premium features available when you need them.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-myColor-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-myColor-900 mb-6">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-myColor-600 mb-8 max-w-xl mx-auto">
            Join thousands of GSB Konkani families who have found their perfect match through Amgel Jodi.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-myColor-600 hover:bg-myColor-700 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
          >
            Get Started Today
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>
    </main>
  )
}
