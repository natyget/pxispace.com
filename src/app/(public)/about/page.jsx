import About from '@/views/about/About';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAboutJsonLd } from '@/lib/seo/schemas';

const TITLE = 'About PXI — Memory Is the Product';
const DESCRIPTION =
  'PXI is an event platform built by operators, where the night compiles itself, the organizer keeps the money, and the memory is the point. Privacy-first, always.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://pxispace.com/about' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pxispace.com/about',
    images: [{ url: '/og?title=Memory%20is%20the%20product&eyebrow=About%20PXI', width: 1200, height: 630, alt: 'About PXI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og?title=Memory%20is%20the%20product&eyebrow=About%20PXI'],
  },
};

export default function Page() {
  return (
    <>
      <p className="sr-only">
        About PXI — an event platform built by operators. Memory is the product: tickets, doors, and
        analytics exist so the night survives. Privacy-first, organizer-friendly.
      </p>
      <About />
      <JsonLd data={buildAboutJsonLd()} />
    </>
  );
}
