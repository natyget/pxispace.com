import TermsOfService from '@/views/TermsOfService';

export const metadata = {
  title: 'Terms of Service',
  description:
    'Terms governing your use of PXI, including content policies, user conduct, and account management.',
  alternates: { canonical: 'https://pxispace.com/terms_of_service' },
};

export default function Page() {
  return <TermsOfService />;
}
