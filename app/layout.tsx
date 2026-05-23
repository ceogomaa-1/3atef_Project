import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '3atef — Event Intelligence Agent',
  description: 'AI-powered hotel & event intelligence for expo planning',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-[#f5f5f5] antialiased`}>{children}</body>
    </html>
  )
}
