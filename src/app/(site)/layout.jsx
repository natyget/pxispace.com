import '@/views/site/styles/base.css';

// The redesign pages — /, /platform, /about, /editorial/fashion-week-brooklyn — ported from
// the static demo in pxispace-redesign/site (see src/views/site).
//
// Deliberately NOT under (public): these pages bring their own header and footer, and
// (public)'s route-transition template wraps pages in a transformed element, which would
// re-anchor every position:fixed layer and break the scroll-pinned scenes.

export const viewport = {
  themeColor: '#050505',
  // The docked bars pad themselves with env(safe-area-inset-*), which is 0 without this.
  viewportFit: 'cover',
};

export const metadata = {
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  itunes: { appId: '6751762197' },
};

export default function SiteLayout({ children }) {
  return children;
}
