import type { Metadata } from 'next'
import { CreateFreeBiodataLanding } from '../components/CreateFreeBiodataLanding'
import { biodataFaqItems } from './faq-data'

const siteUrl = 'https://amgeljodi.com'
const path = '/create-free-biodata'
const canonical = `${siteUrl}${path}`

const title = 'Create Free Marriage Biodata PDF Online'
const description =
  'Create beautiful marriage biodata and download your matrimony biodata PDF for free. Easy biodata maker online for GSB Konkani profiles—share your marriage profile PDF in minutes.'

const keywords = [
  'marriage biodata',
  'free biodata maker',
  'marriage profile pdf',
  'biodata for marriage',
  'matrimony biodata',
  'biodata maker online',
  'marriage biodata pdf',
  'GSB Konkani matrimony',
  'Amgel Jodi',
]

export const metadata: Metadata = {
  title,
  description,
  keywords,
  alternates: {
    canonical,
  },
  openGraph: {
    title: `${title} | Amgel Jodi`,
    description,
    url: canonical,
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Create free marriage biodata PDF on Amgel Jodi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | Amgel Jodi`,
    description,
    images: ['/og-image.jpg'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: biodataFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function CreateFreeBiodataPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <CreateFreeBiodataLanding />
    </>
  )
}
