import About from '@/views/about/About';

export const metadata = {
  title: 'About',
  description:
    'PXI is the social scrapbook app that helps you plan events, share photos in real time, and relive your best nights.',
  alternates: { canonical: 'https://pxispace.com/about' },
};

export default function Page() {
  return <About />;
}
