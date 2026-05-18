import About from '@/views/about/About';

export const metadata = {
  title: 'About — Immortalize the Night',
  description:
    'PXI was forged to solve a critical flaw in modern social life. A unified ecosystem built by event operators to handle the logistics of the night, so you can return to the reality of it.',
  alternates: { canonical: 'https://pxispace.com/about' },
};

export default function Page() {
  return <About />;
}
