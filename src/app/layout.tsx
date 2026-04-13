import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ATL BootWatch',
  description: 'See where cars are being booted in Atlanta. Crowdsourced, real-time boot reports, lot risk scores, and enforcement company profiles.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ATL BootWatch',
  },
  openGraph: {
    title: 'ATL BootWatch',
    description: 'See where cars are being booted in Atlanta. Check any lot before you park.',
    url: 'https://atlboot.watch', // 
    siteName: 'ATL BootWatch',
    images: [
      {
        url: 'https://atlboot.watch/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'ATL BootWatch — Atlanta boot map',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ATL BootWatch',
    description: 'See where cars are being booted in Atlanta. Check any lot before you park.',
    images: ['https://icon-512.png'], // 
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E24B4A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA / Apple home screen */}
<link rel="icon" href="/icons/icon-32.png" sizes="32x32" />
<link rel="apple-touch-icon" href="/icons/icon-180.png" />        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ATL BootWatch" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className} style={{ height: '100%', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}