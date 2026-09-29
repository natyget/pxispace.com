// Shared header for the redesign pages (ported from pxispace-redesign/site). The desktop
// links stay in the HTML so they are crawlable; runtime/nav.js builds the phone sheet from
// these same links. Links are plain <a> on purpose: every page switch is a full load, as in
// the demo, so each page's scene script starts from a clean document.

const LINKS = [
  { page: 'home', href: '/', label: 'Home' },
  { page: 'platform', href: '/platform', label: 'Platform' },
  { page: 'about', href: '/about', label: 'About' },
];

const LOGIN = {
  home: '/login',
  platform: '/login?redirect=%2Fplatform',
  about: '/login?redirect=%2Fabout',
  fwbk: '/login?redirect=%2Feditorial%2Ffashion-week-brooklyn',
};

/** @param {{ page: 'home' | 'platform' | 'about' | 'fwbk' }} props */
export default function SiteNav({ page }) {
  return (
    <header className="nav">
      <a className="nav-logo" href="/" aria-label="PXI home">
        <img src="/site/img/pxi-mark-small.svg?v=grit" alt="PXI" width="44" height="44" />
      </a>{' '}
      <nav className="nav-links" aria-label="Primary">
        {LINKS.map((l) =>
          l.page === page ? (
            // On Platform the demo points its own link at #top; Home and About link to themselves.
            <a key={l.page} href={page === 'platform' ? '#top' : l.href} className="on" aria-current="page">
              {l.label}
            </a>
          ) : (
            <a key={l.page} href={l.href}>
              {l.label}
            </a>
          ),
        )}
      </nav>
      <div className="nav-right">
        <a className="nav-login" href={LOGIN[page]}>Log in</a>{' '}
        <a className="nav-events" href="/events">Events</a>{' '}
        <button className="nav-menu" type="button" aria-label="Open menu">
          <svg viewBox="0 0 24 24" width="21" height="21">
            <path d="M4 8.5h16M4 15.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
