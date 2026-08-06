/* eslint-disable react-refresh/only-export-components */
import { env } from 'node:process';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import GlobalCursorLayer from '@/components/layout/GlobalCursorLayer';
import MotionProvider from '@/components/motion/MotionProvider';
import './globals.css';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const metadata = {
  metadataBase: new URL('https://pxispace.com'),
  title: {
    default: 'PXI | Premier Event Operating System & Digital Scrapbook',
    template: '%s | PXI',
  },
  description:
    'Plan the party, share the camera roll, relive the nostalgia. PXI is the event and social scrapbook app that unifies your best nights in one place.',
  icons: {
    // FULL-BLEED SQUARES ONLY. Google, iOS and most share surfaces apply their own
    // circular or rounded mask to whatever we give them, so the source must be opaque
    // edge to edge. A pre-cropped circle on a transparent canvas gets masked twice and
    // its transparent corners composite to WHITE on any light surface — which is exactly
    // what /favicon-circle.png (a near-transparent ghost of the mark) was doing here.
    // icon-*.png are generated from app-icon.png with the gradient bled past the corners.
    icon: [
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-96.png', type: 'image/png', sizes: '96x96' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icon-192.png',
    // iOS never masks transparency away — a non-opaque apple-touch-icon shows white.
    apple: { url: '/icon-180.png', sizes: '180x180' },
  },
  openGraph: {
    type: 'website',
    siteName: 'PXI',
    locale: 'en_US',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'PXI' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pxilabs',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400..700;1,400..700&family=Codystar&family=Inter:wght@400;500;600;700;800;900&family=Stack+Sans+Notch:wght@200..700&display=swap"
          rel="stylesheet"
        />
        {/* The Google tag is fetched from googletagmanager.com by AnalyticsScripts;
            warming the connection shaves the TLS handshake off first-hit latency. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <AnalyticsScripts />
      </head>
      <body className="theme-matte density-compact">
        <GoogleOAuthProvider clientId={googleClientId} locale="en">
          <AuthProvider>
            <AnalyticsProvider>
              <MotionProvider>
                <GlobalCursorLayer>{children}</GlobalCursorLayer>
              </MotionProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f4f4f5',
              borderRadius: '0.875rem',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
