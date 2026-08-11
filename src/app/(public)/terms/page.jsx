import LegalHubPage from '@/views/legal/LegalHubPage';

export const metadata = {
  title: 'Terms of Service',
  description:
    'PXI Terms of Service — including the PXI SMS Program terms (STOP/HELP, rates, frequency, and consent).',
  alternates: { canonical: 'https://pxispace.com/terms' },
};

export default function TermsOfServicePage() {
  return <LegalHubPage documentId="terms" />;
}
