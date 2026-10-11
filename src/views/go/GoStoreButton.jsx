import GooglePlayMark from '@/components/links/GooglePlayMark';
import { storeLabelForPlatform } from '@/lib/appStoreLinks';

/**
 * The download button: a white pill with the store's own wording, the same words the site's footer uses. It links to
 * /get, which sends each visitor to their own store, and the label and mark follow the same device, so an Android
 * phone is never shown an Apple logo that opens Google Play. Desktop gets the App Store, as everywhere else on the site.
 *
 * A plain anchor on purpose: /get is a route handler that answers with a redirect, so it needs a real navigation.
 *
 * @param {{ href: string, platform?: 'ios' | 'android' | 'desktop' | 'unknown', className?: string }} props
 */
export default function GoStoreButton({ href, platform = 'ios', className = '' }) {
  const android = platform === 'android';
  const { eyebrow, name } = storeLabelForPlatform(platform);
  return (
    <a className={`go-store${className ? ` ${className}` : ''}`} href={href} aria-label={`${eyebrow} ${name}`}>
      {android ? (
        <GooglePlayMark className="go-store-mark" width={20} height={23} />
      ) : (
        <img className="go-store-mark" src="/apple-logo.svg" alt="" width="19" height="23" />
      )}
      <span className="go-store-text">
        <small>{eyebrow}</small>
        {name}
      </span>
    </a>
  );
}
