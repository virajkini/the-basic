import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amgel Jodi - Dashboard',
  description: 'Your matrimony dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

