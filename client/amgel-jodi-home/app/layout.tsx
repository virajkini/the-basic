import type { Metadata, Viewport } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import AuthCheck from './providers/AuthCheck'
import Script from 'next/script'

// Clean modern font for headings
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Clean sans-serif for body text
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = 'https://amgeljodi.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#a763f1',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Amgel Jodi - GSB Konkani Matrimony | Find Your Perfect Match',
    template: '%s | Amgel Jodi',
  },
  description: 'Amgel Jodi is the trusted matrimony platform for the GSB Konkani community. Find verified profiles, connect with compatible matches, and begin your beautiful love story. Join 500+ happy families today.',
  keywords: [
    'GSB matrimony',
    'Konkani matrimony',
    'GSB Konkani marriage',
    'Saraswat Brahmin matrimony',
    'GSB bride',
    'GSB groom',
    'Konkani bride',
    'Konkani groom',
    'GSB wedding',
    'Saraswat marriage',
    'Indian matrimony',
    'Konkani community marriage',
    'GSB matchmaking',
    'traditional matrimony',
    'verified matrimony profiles',
    'Amgel Jodi',
  ],
  authors: [{ name: 'Amgel Jodi' }],
  creator: 'Amgel Jodi',
  publisher: 'Amgel Jodi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#a763f1' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Amgel Jodi',
    title: 'Amgel Jodi - GSB Konkani Matrimony | Find Your Perfect Match',
    description: 'The trusted matrimony platform for the GSB Konkani community. Find verified profiles, connect with compatible matches, and begin your beautiful love story.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Amgel Jodi - GSB Konkani Matrimony',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amgel Jodi - GSB Konkani Matrimony',
    description: 'Find your perfect match in the GSB Konkani community. Verified profiles, trusted platform.',
    images: ['/og-image.jpg'],
    creator: '@amgeljodi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'matrimony',
  classification: 'Matrimony Services',
  other: {
    'msapplication-TileColor': '#a763f1',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Amgel Jodi',
  },
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Amgel Jodi',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.svg`,
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://www.instagram.com/amgeljodi',
        'https://twitter.com/amgeljodi',
        'https://www.facebook.com/amgeljodi',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@amgeljodi.com',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi', 'Konkani'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Amgel Jodi',
      description: 'GSB Konkani Matrimony Platform',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${siteUrl}/#webpage`,
      url: siteUrl,
      name: 'Amgel Jodi - GSB Konkani Matrimony',
      isPartOf: {
        '@id': `${siteUrl}/#website`,
      },
      about: {
        '@id': `${siteUrl}/#organization`,
      },
      description: 'Find your perfect match in the GSB Konkani community with Amgel Jodi matrimony platform.',
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}/#localbusiness`,
      name: 'Amgel Jodi',
      description: 'Matrimony services for GSB Konkani community',
      url: siteUrl,
      priceRange: 'Free',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '15.4909',
        longitude: '73.8278',
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable}`}>
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans">
        <AuthCheck>
          <Header />
          {children}
        </AuthCheck>
      </body>
    </html>
  )
}


