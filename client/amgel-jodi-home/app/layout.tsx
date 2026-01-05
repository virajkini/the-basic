import type { Metadata } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import AuthCheck from './providers/AuthCheck'

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

export const metadata: Metadata = {
  title: 'Amgel Jodi - GSB Konkani Matrimony',
  description: 'Find your perfect match in the GSB Konkani community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable}`}>
      <body className="font-sans">
        <AuthCheck>
          <Header />
          {children}
        </AuthCheck>
      </body>
    </html>
  )
}


