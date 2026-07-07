import { JsonLd } from '@/components/seo/JsonLd';
import PricingView from '@/views/pricing/PricingView';
import { PRICING_FAQS } from '@/content/faqs';
import { buildFaqJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

const TITLE = 'Pricing — Free Tool, $0.99 Per Paid Ticket';
const DESCRIPTION =
  'PXI is free. Free events cost nothing; paid tickets carry a flat $0.99 platform fee and your revenue is paid straight to your Stripe account. No monthly fees, no percentage cuts.';
const URL = 'https://pxispace.com/pricing';
const OG = '/og?title=Free.%20%240.99%20per%20paid%20ticket.&eyebrow=Pricing';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: OG, width: 1200, height: 630, alt: 'PXI Pricing' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default function PricingPage() {
  return (
    <>
      <h1 className="sr-only">PXI Pricing — free tool, flat $0.99 per paid ticket</h1>
      <PricingView />
      <JsonLd data={buildFaqJsonLd(PRICING_FAQS)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />
    </>
  );
}
