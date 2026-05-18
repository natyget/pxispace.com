import SupportPage from '@/views/support/SupportPage';

export const metadata = {
  title: 'Support',
  description:
    'Get help with PXI Studio, PXI Clip, events, billing, and privacy. Contact support@pxispace.com or browse FAQs.',
  alternates: { canonical: 'https://pxispace.com/support' },
};

export default function Page() {
  return <SupportPage />;
}
