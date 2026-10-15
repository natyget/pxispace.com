import PublicLayout from '../(public)/layout';

// The outside-night pages (/e/...) sit outside the (public) loading boundary, so a missing night can answer 404 and a
// moved one 308 before the page streams. They keep the public header and footer.
export default function SeoLayout({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}
