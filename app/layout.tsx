import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jarvis Marketing Agency 2.0',
  description: 'DRC AI Marketing Intelligence Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-jarvis-bg text-jarvis-text min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
