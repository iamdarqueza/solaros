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
    default: 'Fewblocs - Fleet Management & Asset Tracking Platform',
    template: '%s | Fewblocs Fleet Management'
  },
  description: 'Advanced fleet management platform for trucks, trailers, and asset tracking. Real-time GPS tracking, route optimization, maintenance scheduling, and comprehensive fleet analytics. Similar to Samsara but more affordable.',
  keywords: [
    'fleet management',
    'asset tracking',
    'truck tracking',
    'trailer tracking',
    'GPS tracking',
    'route optimization',
    'fleet analytics',
    'vehicle management',
    'commercial fleet',
    'logistics management',
    'maintenance scheduling',
    'fleet monitoring',
    'telematics',
    'fleet software',
    'transportation management',
    'delivery tracking',
    'fleet dashboard',
    'real-time tracking',
    'Samsara alternative',
    'fleet technology'
  ],
  authors: [{ name: 'Fewblocs Team' }],
  creator: 'Fewblocs',
  publisher: 'Fewblocs',
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
    url: 'https://fewblocs.com',
    siteName: 'Fewblocs',
    title: 'Fewblocs - Advanced Fleet Management & Asset Tracking Platform',
    description: 'Comprehensive fleet management solution for trucks, trailers, and assets. Real-time tracking, route optimization, and maintenance management.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fewblocs Fleet Management Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fewblocs - Fleet Management & Asset Tracking',
    description: 'Advanced fleet management platform for trucks, trailers, and asset tracking. Real-time GPS tracking and route optimization.',
    images: ['/images/twitter-card.jpg'],
    creator: '@fewblocs',
  },
  alternates: {
    canonical: 'https://fewblocs.com',
  },
  category: 'Fleet Management Software',
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
        <link rel="canonical" href="https://fewblocs.com" />
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        <meta name="ICBM" content="39.7392, -104.9903" />
        
        {/* Structured Data for Fleet Management Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Fewblocs",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "description": "Advanced fleet management and asset tracking platform for trucks, trailers, and commercial vehicles. Features real-time GPS tracking, route optimization, maintenance scheduling, and comprehensive analytics.",
              "url": "https://fewblocs.com",
              "manufacturer": {
                "@type": "Organization",
                "name": "Fewblocs",
                "url": "https://fewblocs.com"
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
                "Real-time GPS tracking",
                "Route optimization",
                "Maintenance scheduling",
                "Fleet analytics",
                "Asset tracking",
                "Driver management",
                "Fuel monitoring",
                "Compliance reporting"
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
              "name": "Fewblocs",
              "url": "https://fewblocs.com",
              "logo": "https://fewblocs.com/images/logo.svg",
              "description": "Leading fleet management and asset tracking platform for commercial transportation companies.",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-800-FEWBLOCS",
                "contactType": "customer service",
                "email": "support@fewblocs.com"
              },
              "sameAs": [
                "https://linkedin.com/company/fewblocs",
                "https://twitter.com/fewblocs"
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
