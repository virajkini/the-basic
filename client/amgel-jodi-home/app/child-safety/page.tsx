import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Child Safety Standards',
  description: 'Child safety policies and standards at Amgel Jodi. We are committed to protecting minors and maintaining a safe platform.',
}

export default function ChildSafetyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-myColor-600 via-myColor-500 to-myColor-400 text-white py-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Child Safety Standards
            </h1>
            <p className="text-xl text-myColor-50 leading-relaxed">
              Amgel Jodi is committed to maintaining a safe and secure platform.
              We take child safety seriously and have implemented strict policies to protect minors.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-10">

              {/* Age Restriction */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-myColor-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-myColor-600">1</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                      Age Restriction
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      Amgel Jodi is intended for users aged <strong>18 years and above</strong>.
                      Minors are not permitted to create accounts or use the platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prohibition of CSAE */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-myColor-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-myColor-600">2</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                      Prohibition of CSAE
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      Amgel Jodi <strong>strictly prohibits</strong> any form of child sexual abuse material (CSAM)
                      or sexual exploitation of minors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Moderation */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-myColor-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-myColor-600">3</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                      Content Moderation
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      User profiles, photos, and content are actively monitored.
                      Accounts suspected of violating child safety policies are <strong>removed immediately</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reporting Mechanism */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-myColor-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-myColor-600">4</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                      Reporting Mechanism
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      Users can report profiles or content related to child safety concerns directly within the app.
                      All reports are reviewed promptly and appropriate action is taken.
                    </p>
                  </div>
                </div>
              </div>

              {/* Law Enforcement Cooperation */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-myColor-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-myColor-600">5</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                      Law Enforcement Cooperation
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      Amgel Jodi complies with applicable child safety laws and <strong>cooperates with regional
                      and national authorities</strong> when required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-myColor-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-myColor-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                      Contact
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Child safety concerns can be reported to:
                    </p>
                    <a
                      href="mailto:amgeljodi26@gmail.com"
                      className="inline-flex items-center gap-2 text-myColor-600 hover:text-myColor-700 font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      amgeljodi26@gmail.com
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Additional Notice */}
            <div className="mt-8 bg-myColor-50 border border-myColor-200 rounded-xl p-6">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-myColor-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Our Commitment</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    The safety of our users, especially the protection of children, is our highest priority.
                    We continuously review and update our policies to ensure the highest standards of safety and security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
