import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/contexts/AuthContext';
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
      </head>
      <body>
        <GoogleOAuthProvider clientId={googleClientId} locale="en">
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
