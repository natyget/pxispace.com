/* eslint-disable react-refresh/only-export-components */
import { env } from 'node:process';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import SocialPixels from '@/components/analytics/SocialPixels';
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
    // The v2 mark (pxispace-redesign/brand/pxi-logo-v2), on a transparent canvas at
    // every size. Tab icons are NOT masked by browsers, so they stay transparent and
    // composite onto whatever surface they land on.
    //
    // `?v=grit5` busts the favicon cache: browsers hold favicons far longer than their
    // Cache-Control says, and without a new URL returning visitors keep the old badge.
    // Bump it whenever the files change.
    icon: [
      { url: '/icon-16.png?v=grit5', type: 'image/png', sizes: '16x16' },
      { url: '/icon-32.png?v=grit5', type: 'image/png', sizes: '32x32' },
      { url: '/icon-48.png?v=grit5', type: 'image/png', sizes: '48x48' },
      { url: '/icon-96.png?v=grit5', type: 'image/png', sizes: '96x96' },
      { url: '/icon-192.png?v=grit5', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png?v=grit5', type: 'image/png', sizes: '512x512' },
      // Google fetches /favicon.ico before it reads any of the above. It carries
      // purpose-made 16/32/48 frames (the 16 is hand-hinted).
      { url: '/favicon.ico?v=grit5', sizes: 'any' },
    ],
    shortcut: '/icon-192.png?v=grit5',
    // The one exception: surfaces that FORCE a square. iOS ignores alpha on the home
    // screen, so the Apple touch icon is opaque Pitch Black — a transparent square there
    // composites to white and the mark floats in a white box.
    // The Android/maskable pair is declared in app/manifest.js.
    apple: { url: '/icon-180.png?v=grit5', sizes: '180x180' },
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
          href="https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400..700;1,400..700&family=Codystar&family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500;1,600&family=Stack+Sans+Notch:wght@200..700&display=swap"
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
              {/* Meta/TikTok/X. In <body>, not <head>: these must not be requested
                  until consent has settled, so they are injected from an effect
                  rather than rendered as a script tag. */}
              <SocialPixels />
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
