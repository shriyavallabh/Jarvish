import type { Metadata } from 'next'
import { Inter, Fraunces, Poppins, Playfair_Display } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/providers/query-provider'
import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['700', '900'],
})

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '700', '900'],
})

export const metadata: Metadata = {
  title: 'Jarvish - Automated WhatsApp Content for Financial Advisors',
  description: 'AI-powered SEBI compliant content delivery platform for Indian MFDs and RIAs. Wake up to fresh WhatsApp content every morning at 06:00 IST.',
  keywords: 'financial advisor, WhatsApp content, SEBI compliance, MFD, RIA, automated content',
  authors: [{ name: 'Jarvish' }],
  creator: 'Jarvish',
  publisher: 'Jarvish',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020817' },
  ],
  openGraph: {
    type: 'website',
    siteName: 'Jarvish',
    title: 'Jarvish - Automated WhatsApp Content for Financial Advisors',
    description: 'AI-powered SEBI compliant content delivery platform for Indian MFDs and RIAs',
    locale: 'en_IN',
    alternateLocale: ['hi_IN', 'mr_IN'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jarvish - Automated WhatsApp Content for Financial Advisors',
    description: 'AI-powered SEBI compliant content delivery platform for Indian MFDs and RIAs',
    creator: '@jarvish',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${poppins.variable} ${playfairDisplay.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <QueryProvider>
          {children}
          <Toaster 
            position="top-right"
            expand={false}
            richColors
            closeButton
            duration={4000}
          />
        </QueryProvider>
      </body>
    </html>
  )
}