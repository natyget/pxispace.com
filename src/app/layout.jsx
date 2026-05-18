import { GoogleOAuthProvider } from '@react-oauth/google';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import GlobalCursorLayer from '@/components/layout/GlobalCursorLayer';
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
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'PXI',
    locale: 'en_US',
    images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'PXI' }],
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
          href="https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700;800;900&family=Stack+Sans+Notch:wght@200..700&display=swap"
          rel="stylesheet"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RZLHV91C5S"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RZLHV91C5S');
          `}
        </Script>
      </head>
      <body>
        <GoogleOAuthProvider clientId={googleClientId} locale="en">
          <AuthProvider>
            <GlobalCursorLayer>{children}</GlobalCursorLayer>
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
