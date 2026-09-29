// Shared footer for the redesign pages (ported from pxispace-redesign/site). The one per-page
// difference: the Fashion Week Brooklyn guide loads no icon script, so it inlines the Instagram glyph.
// (Home's "Replay the night" lives at the end of its finale, just above this footer.)

/** @param {{ page: 'home' | 'platform' | 'about' | 'fwbk' }} props */
export default function SiteFooter({ page }) {
  const hideIcons = page === 'fwbk' ? 'true' : undefined;
  return (
    <footer className="foot">
      <div className="foot-ghost" aria-hidden="true">
        <img src="/site/img/pxi-mark.svg?v=grit4" alt="" />
      </div>
      <div className="foot-inner">
        <div className="foot-grid">
          <div className="foot-brand">
            <p>Tickets, one shared camera roll, and the morning-after scrapbook. Never lose the night.</p>{' '}
            <a className="appstore" href="https://apps.apple.com/app/pxi/id6751762197" target="_blank" rel="noopener noreferrer" aria-label="Download on App Store">
              <img src="/site/img/apple-logo-white.svg" alt="" width="18" height="22" />
              <span><small>Download on</small>App Store</span>
            </a>
          </div>
          <nav className="foot-col" aria-label="Explore">
            <h4>Explore</h4>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/platform" aria-current={page === 'platform' ? 'page' : undefined}>Platform</a>
              </li>
              <li>
                <a href="/editorial/fashion-week-brooklyn">Fashion Week Brooklyn</a>
              </li>
              <li>
                <a href="/about">About Us</a>
              </li>
            </ul>
          </nav>
          <nav className="foot-col" aria-label="Product">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="/features/shared-event-photo-gallery">Shared Gallery</a>
              </li>
              <li>
                <a href="/features/digital-event-passport">Digital Passport</a>
              </li>
              <li>
                <a href="/features/instagram-event-sharing">Share to Instagram</a>
              </li>
              <li>
                <a href="/events">Find Events</a>
              </li>
            </ul>
          </nav>
          <nav className="foot-col" aria-label="Platform">
            <h4>Platform</h4>
            <ul>
              <li>
                <a href="/features/branded-event-ticketing">Ticketing in Your Brand</a>
              </li>
              <li>
                <a href="/features/event-promoter-analytics">Event Analytics</a>
              </li>
              <li>
                <a href="/competitors/partiful-luma-alternative">Compare PXI</a>
              </li>
              <li>
                <a href="/pricing">Pricing</a>
              </li>
            </ul>
          </nav>
          <nav className="foot-col" aria-label="Connect">
            <h4>Connect</h4>
            <ul>
              <li>
                <a href="/faq">FAQ &amp; Support</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
              <li>
                <a href="/book">Book a meeting</a>
              </li>
              <li>
                <a href="/legal">Legal</a>
              </li>
              <li>
                <a href="/cookies">Cookie settings</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="foot-bottom">
          <p>© 2026 PXI App. All rights reserved.</p>
          <div className="socials">
            <a href="https://www.instagram.com/pxilabs/" target="_blank" rel="noopener noreferrer me" aria-label="PXI on Instagram">
              {page === 'fwbk' ? (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" className="huge" data-icon="InstagramIcon" />
              )}
            </a>{' '}
            <a href="https://www.tiktok.com/@pxilabs" target="_blank" rel="noopener noreferrer me" aria-label="PXI on TikTok">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden={hideIcons}>
                <path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>{' '}
            <a href="https://x.com/PXILabs" target="_blank" rel="noopener noreferrer me" aria-label="PXI on X">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden={hideIcons}>
                <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>{' '}
            <a href="https://www.youtube.com/@PXILabs" target="_blank" rel="noopener noreferrer me" aria-label="PXI on YouTube">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden={hideIcons}>
                <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
