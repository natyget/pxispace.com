// Platform — the host's side of one night, from draft to the sequel.
// Ported 1:1 from pxispace-redesign/site/platform.html; styles in ../styles, motion in ./platform.scenes.js.

import '../styles/platform.css';
import SiteShell from '../runtime/SiteShell';
import SiteNav from '../chrome/SiteNav';
import SiteFooter from '../chrome/SiteFooter';

export default function PlatformView() {
  return (
    <SiteShell page="platform">
      <div className="ambient" aria-hidden="true">
        <div className="amb-night"></div>
      </div>
      <div className="grain" aria-hidden="true"></div>
      <SiteNav page="platform" />
      {/* The event's status line: one night, read from the host's side. Decorative progress, kept out of snippets. */}
      <div className="clock status" data-nosnippet>
        <button className="clock-pill" type="button" aria-expanded="false" aria-controls="status-menu" aria-label="Jump to a chapter">
          <svg className="dial" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="17" className="track" />
            <circle cx="20" cy="20" r="17" className="prog" transform="rotate(-90 20 20)" />
            <circle cx="20" cy="20" r="12.5" className="face" />
            <text x="20" y="23.8" className="st-pct">0</text>
          </svg>{' '}
          <span className="st-text" aria-hidden="true">
            <small>Late Checkout</small>
            <b>Draft</b>
          </span>
        </button>{' '}
        <a className="clock-cta" href={'/login?mode=signup&redirect=/dashboard/events/new'}>Start selling</a>{' '}
        <div className="clock-menu" id="status-menu" hidden>
          <p className="clock-menu-h">Jump to</p>
          <ul></ul>
        </div>
      </div>
      <main id="top">
        {/* ============ HERO: the command center ============ */}
        <section className="p-hero" id="hero" aria-labelledby="hero-h">
          <div className="p-hero-copy">
            <h1 className="display-1" id="hero-h">
              <span className="row">
                <span className="ln">
                  <span>Sell out.</span>
                </span>{' '}
                <span className="ln">
                  <span>Get paid.</span>
                </span>
              </span>{' '}
              <span className="row">
                <span className="ln">
                  <span>Know who came.</span>
                </span>
              </span>
            </h1>
            <div className="hero-more">
              <p className="hero-lead">Tickets under your own brand, revenue straight to your own Stripe account, a door that can't be faked and a room you can finally read. <b>One command center runs the whole night.</b></p>
              <div className="ctas center">
                <a className="btn btn-warm" href={'/login?mode=signup&redirect=/dashboard/events/new'}>Start selling tickets</a>{' '}
                <a className="btn btn-secondary" href="/book">Book a demo</a>
              </div>
            </div>
          </div>
          <p className="sr-only">Illustration: the PXI Command Center dashboard for event organizers, with net revenue, tickets sold, turnout, daily revenue and ticket charts, upcoming events and the features only PXI offers.</p>
          <div className="cc-box" aria-hidden="true" data-nosnippet>
            <div className="cc-tilt">
              <div className="stage cc-stage">
                <div className="dash cc" id="cc"></div>
              </div>
            </div>
          </div>
          <div className="mcc-box" aria-hidden="true" data-nosnippet>
            <div className="dash mcc" id="mcc"></div>
          </div>
        </section>
        {/* ============ 01 LAUNCH ============ */}
        <section className="scene" id="launch" aria-labelledby="h-launch">
          <div className="scene-grid">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-launch">Branded event ticketing, live in minutes.</h2>
                <div className="more">
                  <p className="lead">Cover, lineup, tiers and door team, set from your phone. Every ticket carries <b>your event's name</b>, and a monthly series can put <b>your own stamp</b> on every guest's passport.</p>
                  <p className="micro">Free to host. Paid tickets run through your own Stripe account. <a href="/features/branded-event-ticketing">How branded event ticketing works</a></p>
                </div>
                <p className="sr-only">Illustration: creating an event in the PXI iPhone app, then the ticket buyers receive and a monthly series passport stamp.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="760" data-h="700" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ 02 SELL ============ */}
        <section className="scene" id="sell" aria-labelledby="h-sell">
          <div className="scene-grid wide">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-sell">Watch it sell. Know why.</h2>
                <div className="more">
                  <p className="lead">Sales by day, your pace to the door, and which send actually moved tickets. <b>A ticket bought within 7 days of an email, text or ad click counts toward it.</b></p>
                  <p className="micro">Revenue goes straight to your own Stripe account. <a href="/features/event-promoter-analytics">See event analytics</a></p>
                </div>
                <p className="sr-only">Illustration: a ticket sales card filling day by day until the demo event sells out, with insights and marketing attribution.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="820" data-h="660" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ 03 DOORS ============ */}
        <section className="scene" id="doors" aria-labelledby="h-doors">
          <div className="scene-grid flip wide">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-doors">Door scanning that tells the truth.</h2>
                <div className="more">
                  <p className="lead">Every ticket is signed, so it can't be forged, and scans once, so it can't be shared. Bouncers scan from their phones while <b>gates, entry pace and capacity</b> update from real scans.</p>
                  <p className="micro">Co-hosts, bouncers and lineup each get exactly the access they need.</p>
                </div>
                <p className="sr-only">Illustration: a bouncer scanning signed tickets on iPhone and catching a duplicate, while the live control room tracks capacity, entry pace and gates.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="880" data-h="690" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ 04 THE ROOM ============ */}
        <section className="scene" id="room" aria-labelledby="h-room">
          <div className="scene-grid wide">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-room">See where the room was alive, on a live heat map.</h2>
                <div className="more">
                  <p className="lead">Guest photos land as capture points on <b>your floor plan</b>, and you can play the night back hour by hour. Chat, reactions and photos roll up into one <b>hype score</b>.</p>
                  <p className="micro">Heat reads as ~8 m areas. GPS is approximate by nature.</p>
                </div>
                <p className="sr-only">Illustration: a venue floor plan heat map built from where guests took photos, and a hype chart of chat, reactions and captures across the night.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="880" data-h="708" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ 05 RECAP ============ */}
        <section className="scene" id="recap" aria-labelledby="h-recap">
          <div className="scene-grid wide">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-recap">Your crowd shot your marketing kit.</h2>
                <div className="more">
                  <p className="lead">The photo recap ranks every album photo by what the room reacted to. <b>Pull the best shots</b> the next morning instead of booking a photographer.</p>
                  <p className="micro">Public events only. Guests are told when they join.</p>
                </div>
                <p className="sr-only">Illustration: the event album re-ranked by reactions, then a marketing kit of the top eight photos with a ready caption.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="600" data-h="670" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ 06 KNOW WHO CAME ============ */}
        <section className="scene" id="crowd" aria-labelledby="h-crowd">
          <div className="scene-grid flip wide">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-crowd">An audience CRM of guests you can prove came.</h2>
                <div className="more">
                  <p className="lead">Turnout is scanned at the door, not self-reported. Filter by city, passport and opt-in, <b>save a segment</b> and send it a campaign by email or text.</p>
                  <p className="micro">Only opted-in guests. Consent and unsubscribe are handled for you.</p>
                </div>
                <p className="sr-only">Illustration: the attendance path from sold to scanned to posted, CRM filters saved as a segment, and an email campaign sent to it.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="880" data-h="556" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ 07 THE NEXT ONE ============ */}
        <section className="scene" id="next" aria-labelledby="h-next">
          <div className="scene-grid">
            <div className="copy">
              <div className="beat">
                <h2 className="display" id="h-next">Past attendees fill the next night.</h2>
                <div className="more">
                  <p className="lead">Re-engage everyone who came to your past nights with one tap. <b>The people who showed up hear about the sequel first</b>, in the app they already have.</p>
                </div>
                <p className="sr-only">Illustration: the Invite People sheet in the PXI app inviting every past attendee to the sequel.</p>
              </div>
            </div>
            <div className="stage-box" aria-hidden="true" data-nosnippet>
              <div className="stage" data-w="760" data-h="680" data-max="1.2"></div>
            </div>
          </div>
        </section>
        {/* ============ THE WHOLE NIGHT (lifecycle) ============ */}
        <section className="stack" id="stack" aria-labelledby="h-stack">
          <h2 className="display center-t" id="h-stack">Most ticketing ends<br />at the door.</h2>
          <p className="lead center">A sales ledger and a scanner, and then the data stops. On PXI the night keeps working after the lights come up.</p>
          <div className="track">
            <div className="track-rail" aria-hidden="true">
              <i className="rail-fill"></i>
            </div>
            <div className="track-bracket" aria-hidden="true">
              <span>Where a ticketing dashboard stops</span>
            </div>
            <ol className="track-steps"></ol>
          </div>
        </section>
        {/* ============ THE FINE PRINT ============ */}
        <section className="terms" id="terms" aria-label="The fine print">
          <div className="terms-grid">
            <article className="term">
              <span className="term-ic" data-i="Money01Icon" aria-hidden="true"></span>
              <h3>Free to host.</h3>
              <p>No monthly fees, no subscriptions, no setup cost. Free events cost nothing.</p>
            </article>
            <article className="term">
              <span className="term-ic" data-i="Wallet01Icon" aria-hidden="true"></span>
              <h3>Paid by Stripe.</h3>
              <p>Revenue goes straight to your own Stripe account. PXI never holds your money.</p>
            </article>
            <article className="term">
              <span className="term-ic" data-i="SecurityCheckIcon" aria-hidden="true"></span>
              <h3>Signed tickets.</h3>
              <p>Every pass is signed with PASETO and scans once at the door. Screenshots don't get in.</p>
            </article>
          </div>{' '}
          <a className="terms-link" href="/pricing">See pricing <span data-i="ArrowRight01Icon" aria-hidden="true"></span></a>
        </section>
        {/* ============ CTA ============ */}
        <section className="p-final" id="final" aria-labelledby="h-final">
          <h2 className="display-xl" id="h-final">Run your<br />next night here.</h2>
          <div className="ctas center">
            <a className="btn btn-warm" href={'/login?mode=signup&redirect=/dashboard/events/new'}>Start selling tickets</a>{' '}
            <a className="btn btn-secondary" href="/book">Book a demo</a>
          </div>{' '}
          <a className="guest-link" href="/">See what your guests get <span data-i="ArrowRight01Icon" aria-hidden="true"></span></a>
        </section>
      </main>
      <SiteFooter page="platform" />
    </SiteShell>
  );
}
