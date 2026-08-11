import LegalHubPage from '@/views/legal/LegalHubPage';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'PXI Privacy Policy — how we collect, use, and protect personal data, including SMS/mobile messaging consent under A2P 10DLC.',
  alternates: { canonical: 'https://pxispace.com/privacy' },
};

// documentId scopes the hub to this one document. Without it this route
// rendered the entire legal hub — the same DOM as /legal and /terms — three
// self-canonical URLs of duplicate content.
export default function PrivacyPolicyPage() {
  return <LegalHubPage documentId="privacy" />;
}
