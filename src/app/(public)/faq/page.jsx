import FaqView from '@/views/faq/FaqView';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd } from '@/lib/seo/schemas';
import { FAQ_PAGE_FLAT } from '@/content/faqs';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

const TITLE = 'FAQ: Questions, Answered';
const DESCRIPTION =
  'Quick answers about tickets, shared event albums, passport stamps, privacy, and your PXI account.';

export const metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/faq',
  eyebrow: 'Support',
  ogTitle: 'Questions, answered.',
});

export default function Page() {
  return (
    <>
      <FaqView />
      <JsonLd data={buildFaqJsonLd(FAQ_PAGE_FLAT)} />
    </>
  );
}
