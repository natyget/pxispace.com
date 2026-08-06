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
    // THE CIRCULAR BADGE, on a transparent canvas, at every size — resampled from
    // app-icon.png rather than cropped from it.
    //
    // A previous pass cropped the badge into a full-bleed opaque square on the theory
    // that consumers mask it anyway. Two things were wrong with that. Browser tabs do
    // NOT mask, so the tab showed a purple square with the mark clipped at the edges;
    // and transparent corners were never the "white corners" bug in the first place —
    // that was /favicon-circle.png being a corrupt near-transparent file.
    //
    // A transparent corner composites to whatever surface it lands on, which is the
    // correct behaviour. Opaque corners are what cannot adapt.
    icon: [
      { url: '/icon-16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-96.png', type: 'image/png', sizes: '96x96' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      // Google fetches /favicon.ico before it reads any of the above. It now carries
      // purpose-made 16/32/48 frames instead of one 32 the browser had to downsample.
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icon-192.png',
    // The one exception: iOS ignores alpha on the home screen and fills it with a colour
    // of its choosing, so this single file has the brand black baked in.
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
