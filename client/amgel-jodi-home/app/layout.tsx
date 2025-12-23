import type { Metadata } from 'next'
import './globals.css'
import Header from './components/Header'
import AuthCheck from './providers/AuthCheck'

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
    <html lang="en">
      <body>
        <AuthCheck>
          <Header />
          {children}
        </AuthCheck>
      </body>
    </html>
  )
}

