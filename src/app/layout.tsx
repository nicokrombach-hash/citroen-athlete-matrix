import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Citroën Athlete Squad Matrix',
  description: 'Athlete evaluation and categorization tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
