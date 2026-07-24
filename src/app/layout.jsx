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
    // Full-bleed square (neon mark on brand-purple) so Google/browser circle-crops
    // fill edge-to-edge instead of floating a small padded mark. The old transparent
    // favicon.svg is intentionally not declared — browsers prefer SVG and would
    // reintroduce the padded look (and its transparency reads as white on light
    // backgrounds, same reason favicon-mark.png — white bg — was replaced here).
    icon: [{ url: '/app-icon.png', type: 'image/png', sizes: '512x512' }],
    shortcut: '/app-icon.png',
    apple: { url: '/app-icon.png', sizes: '180x180' },
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
