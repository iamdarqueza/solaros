import { Outfit } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Metadata } from 'next';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthWrapper from '@/components/auth/AuthWrapper';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'SolarOS - Solar After-Sales & Field Service Platform',
    template: '%s | SolarOS'
  },
  description: 'SolarOS helps solar companies manage customers, sites, solar systems, warranties, maintenance schedules, support tickets, work orders, technician visits, service reports, documents, and service history.',
  keywords: [
    'solar after-sales',
    'solar warranty management',
    'solar maintenance software',
    'solar field service',
    'solar work orders',
    'solar customer portal',
    'solar technician portal',
    'solar service history',
    'solar documents',
    'solar support tickets',
    'solar operations',
    'renewable energy service management',
  ],
  authors: [{ name: 'SolarOS Team' }],
  creator: 'SolarOS',
  publisher: 'SolarOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://solaros.app',
    siteName: 'SolarOS',
    title: 'SolarOS - Solar After-Sales & Field Service Platform',
    description: 'Manage solar customers, sites, systems, warranties, maintenance, support tickets, work orders, documents, and service history in one frontend workspace.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SolarOS service operations dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolarOS - Solar After-Sales & Field Service',
    description: 'Solar customer, warranty, maintenance, support, work order, and technician job management.',
    images: ['/images/twitter-card.jpg'],
    creator: '@solaros',
  },
  alternates: {
    canonical: 'https://solaros.app',
  },
  category: 'Solar Field Service Software',
  classification: 'Business Software',
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://solaros.app" />
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        <meta name="ICBM" content="39.7392, -104.9903" />
        
        {/* Structured Data for SolarOS frontend product positioning */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SolarOS",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "description": "Solar after-sales and field service platform for managing customers, sites, solar systems, warranties, maintenance schedules, support tickets, work orders, technician visits, documents, and service history.",
              "url": "https://solaros.app",
              "manufacturer": {
                "@type": "Organization",
                "name": "SolarOS",
                "url": "https://solaros.app"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "price": "Contact for pricing",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150",
                "bestRating": "5",
                "worstRating": "1"
              },
              "featureList": [
                "Customer and site records",
                "Solar installation and equipment tracking",
                "Warranty and claim management",
                "Maintenance scheduling",
                "Support ticket management",
                "Work order dispatch",
                "Technician job portal",
                "Customer self-service portal",
                "Documents and service history"
              ]
            }),
          }}
        />
        
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "SolarOS",
              "url": "https://solaros.app",
              "logo": "https://solaros.app/images/logo.svg",
              "description": "Solar after-sales, warranty, maintenance, and field service management platform.",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@solaros.app"
              },
              "sameAs": [
                "https://linkedin.com/company/solaros",
                "https://twitter.com/solaros"
              ]
            }),
          }}
        />
      </head>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <AuthWrapper>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
