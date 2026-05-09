import Link from 'next/link'
import { biodataFaqItems } from '../create-free-biodata/faq-data'
import { OpenLoginSheetButton } from './OpenLoginSheetButton'

const APP_ORIGIN = 'https://app.amgeljodi.com'
const PROFILE_PDF_URL = `${APP_ORIGIN}/profile-pdf`

const whyPoints = [
  {
    title: 'Trusted community',
    body: 'Amgel Jodi is focused on GSB Konkani families—so your biodata sits in a context people recognise and respect.',
  },
  {
    title: 'Verified profiles',
    body: 'Manual review helps keep matrimony profiles authentic before you generate a marriage biodata PDF.',
  },
  {
    title: 'Simple profile tools',
    body: 'Update details and photos in the app; your biodata maker online stays in sync with your latest profile.',
  },
  {
    title: 'Modern biodata output',
    body: 'A contemporary marriage biodata PDF layout—elegant for elders and clear for younger family members.',
  },
]

export function CreateFreeBiodataLanding() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fdfbff_0%,#f6effe_45%,#fff_100%)]">
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-24 md:pb-24 md:pt-28">
        <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden>
          <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-myColor-300/50 to-fuchsia-300/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-[380px] w-[380px] rounded-full bg-gradient-to-tl from-myColor-400/35 to-transparent blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <p className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-myColor-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-myColor-700 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Free biodata maker online
            </p>
            <h1 className="animate-fade-in-up mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-myColor-950 delay-100 md:text-5xl lg:text-[3.25rem]">
              Create beautiful marriage{' '}
              <span className="bg-gradient-to-r from-myColor-700 via-myColor-600 to-fuchsia-600 bg-clip-text text-transparent">
                bio-data
              </span>{' '}
              <span className="whitespace-nowrap">
                &amp; download for{' '}
                <span className="relative inline-block font-bold">
                  <span className="relative z-10 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(251,191,36,0.35)]">
                    FREE
                  </span>
                  <span className="absolute inset-0 -z-0 rounded-lg bg-amber-400/20 blur-md" aria-hidden />
                </span>
              </span>
            </h1>
            <p className="animate-fade-in-up mt-5 max-w-xl text-lg leading-relaxed text-myColor-700 delay-200 md:text-xl">
              This is the right place to create your marriage bio data, download and share it with others—in just{' '}
              <strong className="font-semibold text-myColor-900">2 minutes</strong>.
            </p>
            <div className="animate-fade-in-up mt-8 flex flex-col gap-3 delay-300 sm:flex-row sm:flex-wrap sm:items-center">
              <OpenLoginSheetButton className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-myColor-700 to-myColor-800 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-myColor-700/25 transition-all hover:from-myColor-800 hover:to-myColor-900 hover:shadow-xl active:scale-[0.98]">
                Login and Create
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </OpenLoginSheetButton>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border-2 border-myColor-200/90 bg-white/90 px-8 py-4 text-base font-semibold text-myColor-800 shadow-sm backdrop-blur-sm transition-all hover:border-myColor-300 hover:bg-white"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative scroll-mt-24 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-myColor-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-myColor-700">
              How it works
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-myColor-900 md:text-4xl">
              Create your bio-data in 3 simple steps
            </h2>
          </div>
          <ol className="mx-auto mt-14 max-w-3xl space-y-10">
            {[
              {
                step: 1,
                title: 'Log in and get verified',
                body: 'Create your Amgel Jodi account and complete verification so your matrimony biodata reflects a trusted profile.',
                tone: 'from-myColor-500 to-myColor-700',
              },
              {
                step: 2,
                title: 'Build your profile',
                body: 'Add your details, upload photos, and refine your marriage profile—your biodata pulls from this automatically.',
                tone: 'from-emerald-500 to-teal-600',
              },
              {
                step: 3,
                title: 'Generate your PDF',
                body: (
                  <>
                    Open{' '}
                    <a
                      href={PROFILE_PDF_URL}
                      className="font-semibold text-myColor-700 underline decoration-2 underline-offset-2 hover:text-myColor-900"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {PROFILE_PDF_URL}
                    </a>
                    , tap <strong className="text-myColor-900">Create bio data</strong>, then download or share your beautiful marriage biodata PDF.
                  </>
                ),
                tone: 'from-amber-500 to-orange-600',
              },
            ].map((item, i) => (
              <li key={item.step} className="relative flex gap-5 md:gap-8">
                {i < 2 && (
                  <div
                    className="absolute left-[1.35rem] top-14 hidden h-[calc(100%+2.5rem)] w-0.5 bg-gradient-to-b from-myColor-200 to-myColor-100 md:block"
                    aria-hidden
                  />
                )}
                <div
                  className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.tone} text-lg font-bold text-white shadow-lg ring-4 ring-white`}
                >
                  {item.step}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-myColor-100 bg-white/90 p-5 shadow-md shadow-myColor-900/[0.04] md:p-6">
                  <h3 className="font-display text-xl font-semibold text-myColor-900">{item.title}</h3>
                  <p className="mt-2 text-myColor-600 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why Amgel */}
      <section className="border-t border-myColor-200/50 bg-gradient-to-b from-myColor-100/80 via-myColor-50 to-myColor-100/60 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-12 rounded-[2rem] border border-myColor-200/70 bg-white p-8 shadow-[0_20px_60px_-24px_rgba(33,20,48,0.12)] md:grid-cols-2 md:p-12 lg:gap-16">
            <div>
              <h2 className="font-display text-3xl font-semibold text-myColor-900 md:text-4xl">Why Amgel Jodi</h2>
              <p className="mt-4 text-lg leading-relaxed text-myColor-600">
                We combine <strong className="font-medium text-myColor-800">verified GSB Konkani matrimony</strong> with tools like this free biodata maker—so your story looks as good as it feels.
              </p>
              <div className="mt-8">
                <a
                  href={APP_ORIGIN}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-myColor-700 hover:text-myColor-900"
                >
                  Explore the app
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
            <ul className="space-y-6">
              {whyPoints.map((w) => (
                <li key={w.title} className="flex gap-4">
                  <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-myColor-500 to-myColor-700 shadow-sm ring-2 ring-myColor-100" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-myColor-900">{w.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-myColor-600">{w.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-myColor-100 bg-white py-16 md:py-20" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4">
          <h2 id="faq-heading" className="mx-auto max-w-2xl text-center font-display text-3xl font-semibold text-myColor-900 md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-myColor-600">
            Quick answers about our <strong className="font-medium text-myColor-800">biodata maker online</strong> and marriage profile PDFs.
          </p>
          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {biodataFaqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-myColor-100 bg-myColor-50/40 px-5 py-1 transition-colors open:bg-white open:shadow-md [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-medium text-myColor-900">
                  {item.q}
                  <svg className="h-5 w-5 shrink-0 text-myColor-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="border-t border-myColor-100 pb-4 pt-0 text-sm leading-relaxed text-myColor-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-myColor-900 via-myColor-800 to-myColor-950" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-myColor-500/20 blur-3xl animate-float" aria-hidden />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl animate-float delay-500" aria-hidden />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-white md:text-5xl">
            Your marriage bio-data ready in minutes
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/75 md:text-xl">
            Create, download and share your beautiful marriage profile for <strong className="font-semibold text-amber-200">FREE</strong>.
          </p>
          <div className="mt-10">
            <a
              href={APP_ORIGIN}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-semibold text-myColor-800 shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] hover:bg-myColor-50 active:scale-[0.98]"
            >
              Get started now
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
          <p className="mt-8 text-sm text-white/50">
            <Link href="/" className="underline-offset-2 hover:text-white/80 hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
