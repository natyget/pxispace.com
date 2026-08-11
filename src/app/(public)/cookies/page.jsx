import LegalHubPage from '@/views/legal/LegalHubPage';

export const metadata = {
  title: 'Cookie Policy',
  description:
    'Every cookie pxispace.com sets, what it is for, and how to switch the optional ones off — including our support for Global Privacy Control.',
  alternates: { canonical: 'https://pxispace.com/cookies' },
};

// The Cookie Policy previously had no URL of its own: it was only reachable as
// /legal#cookie. A consent banner and a privacy policy that both point users at
// "our Cookie Policy" need somewhere to point.
export default function CookiePolicyPage() {
  return <LegalHubPage documentId="cookie" />;
}
