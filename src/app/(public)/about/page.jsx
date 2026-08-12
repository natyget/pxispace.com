import About from '@/views/about/About';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAboutJsonLd, buildVideoObjectJsonLd } from '@/lib/seo/schemas';
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
      {/* Search Console flagged /about as a video-indexing issue: the hero clip
          had no poster and no VideoObject, so there was nothing to index it by. */}
      <JsonLd
        data={buildVideoObjectJsonLd({
          name: 'A night on PXI, from the door to the shared scrapbook',
          description:
            'How a night runs on PXI: tickets and doors at the front, one shared camera roll during, and a scrapbook that survives the morning after.',
          contentPath: '/landing/assets/movie.mp4',
          thumbnailPath: '/landing/assets/movie-poster.jpg',
          uploadDate: '2026-07-02',
          durationSeconds: 11,
          pagePath: '/about',
        })}
      />
    </>
  );
}
