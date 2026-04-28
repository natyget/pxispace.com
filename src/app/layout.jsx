import { GoogleOAuthProvider } from '@react-oauth/google';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import GlobalCursorLayer from '@/components/layout/GlobalCursorLayer';
import './globals.css';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const metadata = {
  title: 'PXI - Pick • Print • Post',
  description: 'PXI is a compact phone-attached printer that instantly prints your photos.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
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
      </body>
    </html>
  );
}
