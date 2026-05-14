import LegalHubPage from '@/views/legal/LegalHubPage';

export const metadata = {
  title: 'Legal Hub',
  description:
    'Privacy policy, terms of service, cookies, community guidelines, and other legal information for PXI.',
  alternates: { canonical: 'https://pxispace.com/legal' },
};

export default function LegalPage() {
  return <LegalHubPage />;
}
