import FaqView from '@/views/faq/FaqView';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd } from '@/lib/seo/schemas';
import { FAQ_PAGE_FLAT } from '@/content/faqs';

const TITLE = 'FAQ: Questions, Answered';
const DESCRIPTION =
  'Quick answers about tickets, shared event albums, passport stamps, privacy, and your PXI account.';
const OG = '/og?title=Questions%2C%20answered&eyebrow=FAQ';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://pxispace.com/faq' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pxispace.com/faq',
    images: [{ url: OG, width: 1200, height: 630, alt: 'PXI FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG],
  },
};

export default function Page() {
  return (
    <>
      <FaqView />
      <JsonLd data={buildFaqJsonLd(FAQ_PAGE_FLAT)} />
    </>
  );
}
