import { JsonLd } from '@/components/seo/JsonLd';
import EditorialIndex from '@/views/editorial/EditorialIndex';
import { EDITORIAL_STORIES } from '@/content/editorial';
import { buildItemListJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

const TITLE = 'Editorial — Stories From the Night';
const DESCRIPTION =
  'Field notes and culture from PXI: how shared galleries, scrapbooks, and passport stamps turn a single night into something that lasts.';
const URL = 'https://pxispace.com/editorial';
const OG = '/og?title=Stories%20from%20the%20night&eyebrow=Editorial';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: OG, width: 1200, height: 630, alt: 'PXI Editorial' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default function EditorialPage() {
  const items = EDITORIAL_STORIES.map((s) => ({ name: s.title, url: `/editorial/${s.slug}` }));
  return (
    <>
      <EditorialIndex />
      <JsonLd data={buildItemListJsonLd(items, 'PXI Editorial')} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Editorial', path: '/editorial' },
        ])}
      />
    </>
  );
}
