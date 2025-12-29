import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import AuthCheck from './providers/AuthCheck'

// Elegant serif font for headings
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
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
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans">
        <AuthCheck>
          <Header />
          {children}
        </AuthCheck>
      </body>
    </html>
  )
}
