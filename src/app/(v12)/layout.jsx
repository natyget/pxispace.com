// The marketing pages (/, /platform, /about, /pricing and /features/*), from the v12 demo; see src/views/v12.
//
// Deliberately NOT under (public): these pages bring their own header and footer, and (public)'s route-transition
// template wraps pages in a transformed element, which would re-anchor every position:fixed layer.

export const viewport = {
  themeColor: '#050505',
  // The docked bars pad themselves with env(safe-area-inset-*), which is 0 without this.
  viewportFit: 'cover',
};

export default function V12Layout({ children }) {
  return children;
}
