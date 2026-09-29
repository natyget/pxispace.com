import FashionWeekBrooklynView from '@/views/site/fwbk/FashionWeekBrooklynView';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';
import { FWBK_JSONLD } from '@/views/site/fwbk/fwbk.jsonld';

// A standalone guide, not an EDITORIAL_STORIES entry: its layout is the redesign's, so it
// lives in (site) and wins over (public)/editorial/[slug] as a static segment.
// During the week (Oct 4–9) bump modifiedTime with each recap.
const base = buildPageMetadata({
  title: 'Fashion Week Brooklyn 2026: Oct 4–8 Schedule & Venues',
  description:
    'Fashion Week Brooklyn 2026 runs Oct 4–8: runway times, venue addresses, who can get in and RSVP links for every night, plus Oct 9 in Times Square.',
  ogTitle: 'Fashion Week Brooklyn 2026: The October Schedule',
  ogDescription:
    'Every Fashion Week Brooklyn night, Oct 4–8, 2026: runway times, venues, who can get in and where to RSVP, plus the Oct 9 Times Square exhibition.',
  eyebrow: 'Guide',
  imageAlt: 'Fashion Week Brooklyn 2026: The October Schedule, a guide by PXI',
  path: '/editorial/fashion-week-brooklyn',
  type: 'article',
});

export const metadata = {
  ...base,
  openGraph: {
    ...base.openGraph,
    publishedTime: '2026-09-27T18:00:00-04:00',
    modifiedTime: '2026-09-27T22:00:00-04:00',
    section: 'Guides',
  },
};

export default function Page() {
  return (
    <>
      <FashionWeekBrooklynView />
      <JsonLd data={FWBK_JSONLD} />
    </>
  );
}
