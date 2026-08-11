import ContactPage from '../../../views/contact/ContactPage';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the PXI team for support, press, and legal inquiries.',
  alternates: { canonical: 'https://pxispace.com/contact' },
};

export default function Page() {
  return <ContactPage />;
}
