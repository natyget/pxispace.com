import About from '@/views/about/About';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAboutJsonLd } from '@/lib/seo/schemas';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

const TITLE = 'About PXI — Memory Is the Product';
const DESCRIPTION =
  'PXI is an event platform built by operators, where the night compiles itself, the organizer keeps the money, and the memory is the point. Privacy-first, always.';

export const metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/about',
  eyebrow: 'Company',
  ogTitle: 'Memory is the product.',
});

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
