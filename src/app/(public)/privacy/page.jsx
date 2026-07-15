import LegalHubPage from '@/views/legal/LegalHubPage';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'PXI Privacy Policy — how we collect, use, and protect personal data, including SMS/mobile messaging consent under A2P 10DLC.',
  alternates: { canonical: 'https://pxispace.com/privacy' },
};

export default function PrivacyPolicyPage() {
  return <LegalHubPage initialSection="privacy" />;
}
