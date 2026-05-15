import PrivacyPolicy from '@/views/PrivacyPolicy';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How PXI collects, stores, and protects your personal data. Read our privacy practices.',
  alternates: { canonical: 'https://pxispace.com/privacy_policy' },
};

export default function Page() {
  return <PrivacyPolicy />;
}
