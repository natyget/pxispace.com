// Home — "One Night": scroll is time, from the door at 9:47 PM to the story post the next morning.
// Ported 1:1 from pxispace-redesign/site/index.html; styles in ../styles, motion in ./home.scenes.js.

import SiteShell from '../runtime/SiteShell';
import SiteNav from '../chrome/SiteNav';
import SiteFooter from '../chrome/SiteFooter';
import DoorsDiscover from './DoorsDiscover';

// The app's six-point scrapbook star (ScrapbookStar.tsx): sharp tips, softly concave sides, drawn in 40 x 46.
const STAR_PATH = (() => {
  const W = 40, H = 46, cx = W / 2, cy = H / 2, R = 23, inner = R * 0.44, pull = 0.88;
  const polar = (r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const toCentre = ([x, y]) => [cx + (x - cx) * pull, cy + (y - cy) * pull];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (n) => n.toFixed(2);
  const tips = Array.from({ length: 6 }, (_, k) => polar(R, -90 + 60 * k));
  const notches = Array.from({ length: 6 }, (_, k) => polar(inner, -60 + 60 * k));
  let d = `M ${f(tips[0][0])} ${f(tips[0][1])}`;
  for (let k = 0; k < 6; k += 1) {
    const n = notches[k], next = tips[(k + 1) % 6], c1 = toCentre(mid(tips[k], n)), c2 = toCentre(mid(n, next));
    d += ` Q ${f(c1[0])} ${f(c1[1])} ${f(n[0])} ${f(n[1])} Q ${f(c2[0])} ${f(c2[1])} ${f(next[0])} ${f(next[1])}`;
  }
  return `${d} Z`;
})();

export default function HomeView() {
  return (
    <SiteShell page="home">
      {/* ============ global chrome ============ */}
      <div className="ambient" aria-hidden="true">
        <div className="amb-night"></div>
        <div className="amb-dawn"></div>
      </div>
      <div className="grain" aria-hidden="true"></div>
      <div className="flash" aria-hidden="true"></div>
      <div className="vf-cursor" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>
      <SiteNav page="home" />
      {/* The night clock: a split-flap artifact. Scroll = time. */}
      <div className="clock" aria-label="Night clock">
        <button className="clock-pill" type="button" aria-expanded="false" aria-controls="clock-menu" aria-label="Jump to a time">
          <svg className="dial" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="17" className="track" />
            <circle cx="20" cy="20" r="17" className="prog" transform="rotate(-90 20 20)" />
            <circle cx="20" cy="20" r="12.5" className="face" />
            <line x1="20" y1="20" x2="20" y2="13.5" className="hh" />
            <line x1="20" y1="20" x2="20" y2="10" className="mh" />
            <circle cx="20" cy="20" r="1.6" className="pin" />
          </svg>{' '}
          <span className="clock-time">
            <b>9:47</b>
            <i>PM</i>
          </span>{' '}
          <span className="clock-day">FRI</span>
        </button>{' '}
        {/* after the story post the night is over: the time pill hands over to the events */}
        <a className="clock-events" href="/events">Explore events</a>{' '}
        <a className="clock-cta" href="https://apps.apple.com/app/pxi/id6751762197" target="_blank" rel="noopener noreferrer" aria-label="Get the app on the App Store"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.200 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" /></svg>Get the app</a>{' '}
        <div className="clock-menu" id="clock-menu" hidden>
          <p className="clock-menu-h">Jump to</p>
          <ul></ul>
        </div>
      </div>
      <main id="top">
        {/* ============ HERO — lights out, tap to shoot ============ */}
        <section className="hero" id="hero">
          <div className="room" aria-hidden="true">
            <picture><source media="(max-width: 860px) and (orientation: portrait)" srcSet="/site/img/hero-lounge-portrait.jpg" /><img src="/site/img/hero-roxbury-crew.jpg" alt="" /></picture>
          </div>
          <div className="room-lit" aria-hidden="true">
            <picture><source media="(max-width: 860px) and (orientation: portrait)" srcSet="/site/img/hero-lounge-portrait.jpg" /><img src="/site/img/hero-roxbury-crew.jpg" alt="" /></picture>
          </div>
          <div className="hero-scrim" aria-hidden="true"></div>
          <div className="shots" aria-hidden="true"></div>
          <div className="hero-copy">
            <div className="kicker-wrap">
              <p className="hero-kicker">The ticket, the camera, the morning after</p>
              <p className="tap-cue" aria-hidden="true">Tap to shoot</p>
            </div>
            <h1 className="display-1">
              <span className="ln">
                <span>Never lose</span>
              </span>{' '}
              <span className="ln">
                <span>the moment</span>
              </span>
            </h1>
            <p className="hero-lead">Tickets, one shared camera for the whole room, and a scrapbook that <b>builds itself by morning.</b></p>
            <div className="ctas">
              <a className="btn btn-warm" href="https://apps.apple.com/app/pxi/id6751762197" target="_blank" rel="noopener noreferrer" aria-label="Get the app on the App Store"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" /></svg>Get the app</a>{' '}
              <a className="btn btn-secondary" href="/events">Explore events</a>
            </div>
          </div>
        </section>
        {/* ============ 9:48 PM — DOORS ============ */}
        <section className="scene" id="doors">
          <div className="scene-grid">
            <div className="copy">
              <div className="beat">
                <p className="tc" data-t="9:48 pm" aria-hidden="true"></p>
                <h2 className="display"><span className="kw-mute">Event tickets</span> in two taps.<br /> You're on the list.</h2>
                <p className="lead"><span className="m-cut">RSVP or buy in the app. </span>Your ticket lives on your phone and in Apple Wallet, scanned at the door.<span className="m-cut"> <b>No screenshots, no forwarded PDFs.</b></span></p>
              </div>
            </div>
            <div className="stage-box">
              <div className="stage" data-w="560" data-h="600" data-mw="500" data-mh="640" data-mtop=".22" aria-hidden="true">
                <div className="iphone dd-phone" data-pw="272"></div>
                <DoorsDiscover />
                <div className="feed">
                  <div className="ticket-pair">
                    <div className="aticket-wrap t-body"></div>
                    <div className="aticket-wrap t-stub"></div>
                  </div>
                </div>
                <div className="going">
                  <div className="facepile"></div>
                  <p className="going-txt"><b>Ama, Kofi</b> and <span className="going-others">154</span> others are going</p>
                </div>
                <div className="stub-note">
                  <p>keep the stub.<br /> it comes back.</p>{' '}
                  <svg viewBox="0 0 80 60" width="80" height="60" aria-hidden="true">
                    <path d="M6 52 C 26 50, 48 36, 66 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M56 12 L67 8 L68 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ============ 10:31 PM — THE CAMERA ============ */}
        <section className="scene" id="camera">
          <div className="scene-grid flip">
            <div className="copy">
              <div className="beat">
                <p className="tc" data-t="10:31 pm" aria-hidden="true"></p>
                <h2 className="display">One <span className="kw-ink">shared event camera</span>.<br /> Every kind of light.</h2>
                <p className="lead">One film look<span className="m-cut">, tuned to hold up anywhere — harsh sun, blue hour, neon at 1 AM</span>. <b>Every shot lands straight in the night's album.</b></p>
                <p className="micro desk-only">Every frame here was shot on the PXI camera.</p>{' '}
                <a className="more-link" href="/features/shared-event-photo-gallery">How the shared event photo gallery works<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              </div>
            </div>
            <div className="stage-box">
              <div className="stage" data-w="640" data-h="664" data-mw="312" data-mh="640">
                <div className="iphone cam-phone" data-pw="300" data-time="10:31" aria-hidden="true"></div>
                <div className="cam-chip" aria-hidden="true">
                  <p className="cc-lbl">
                    <small>01</small>
                    <span>Harsh midday sun</span>
                  </p>
                  <p className="cc-dots">
                    <i className="on"></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </p>
                </div>
                <ol className="light-list" aria-label="Sample shots by light">
                  <li>
                    <button type="button">
                      <img src="/site/img/cam/midday.jpg" alt="Photo shot on the PXI camera in harsh midday sun" />
                      <span><small>01</small>Harsh midday sun</span>
                    </button>
                  </li>
                  <li>
                    <button type="button">
                      <img src="/site/img/cam/bluehour.jpg" alt="Photo shot on the PXI camera at blue hour" />
                      <span><small>02</small>Blue hour</span>
                    </button>
                  </li>
                  <li>
                    <button type="button">
                      <img src="/site/img/cam/beach.jpg" alt="Photo shot on the PXI camera in bright beach glare" />
                      <span><small>03</small>Beach glare</span>
                    </button>
                  </li>
                  <li>
                    <button type="button">
                      <img src="/site/img/cam/neon.jpg" alt="Photo shot on the PXI camera under neon light at night" />
                      <span><small>04</small>Neon at night</span>
                    </button>
                  </li>
                  <li>
                    <button type="button">
                      <img src="/site/img/cam/shade.jpg" alt="Photo shot on the PXI camera in open shade" />
                      <span><small>05</small>Open shade</span>
                    </button>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>
        {/* ============ 11:52 PM → 9:40 AM — THE ROLL / LIGHTS OUT / MORNING ============ */}
        <section className="scene scene-roll" id="roll">
          <div className="tiles" aria-hidden="true">
            <div className="sb-frame">
              <div className="sb-card">
                <p className="sb-label">Recent</p>
                <div className="sb-print"><img src="/site/img/posters/late-checkout.jpg" alt="" /></div>
                <p className="sb-date">Oct 3, 2026</p>
                <p className="sb-line">
                  <svg className="sb-star" viewBox="0 0 40 46" aria-hidden="true"><path d={STAR_PATH} /></svg>
                  <span>Time Travel Through Your Memories</span>
                  <svg className="sb-star" viewBox="0 0 40 46" aria-hidden="true"><path d={STAR_PATH} /></svg>
                </p>
              </div>
            </div>
          </div>
          <div className="scene-grid">
            <div className="copy">
              <div className="beat beat-a">
                <p className="tc" data-t="11:52 pm" aria-hidden="true"></p>
                <h2 className="display">Every phone in the room.<br /> One shared camera roll.</h2>
                <p className="lead">Every shot drops into the night's thread the second it's taken.<span className="m-cut"> <b>React while it's still happening.</b></span></p>
                <div className="stats" aria-hidden="true">
                  <div>
                    <b data-stat="photos">12</b>
                    <span>shots in the roll</span>
                  </div>
                </div>
              </div>
              <div className="beat beat-d">
                <h2 className="display">Wake up to<br /> the whole night. <span className="kw-note">Your morning-after scrapbook.</span></h2>
                <p className="lead">The scrapbook builds itself while you sleep, and PXI finds you in everyone else's shots.<span className="m-cut"> <b>No chasing the group chat.</b></span></p>
              </div>
            </div>
            <div className="stage-box">
              <div className="stage" data-w="600" data-h="690" data-mw="372" data-mh="672" aria-hidden="true">
                <div className="bursts"></div>
                <div className="iphone thread-phone" data-pw="316" data-time="11:52"></div>
                <div className="flythumbs"></div>
              </div>
            </div>
          </div>
          <div className="wall-text" aria-hidden="true">
            <p className="wt-big">One roll. Zero<br /> “can you send me that?”</p>
            <p className="wt-sub"><span>214 shots</span> <span>38 phones</span></p>
          </div>
          <div className="night-text" aria-hidden="true">
            <p className="nt-time">4:12 AM</p>
            <p className="nt-sub">Everyone's home. <span>PXI's still up.</span></p>
          </div>
          <div className="ls-dim" aria-hidden="true"></div>
          <div className="notif-stack" aria-hidden="true">
            <div className="ls-clock">
              <p className="ls-date">Saturday, October 3</p>
              <p className="ls-time">9:40</p>
            </div>
            <div className="notif main">
              <img className="n-icon" src="/site/img/app-icon.png?v=grit5" alt="" />
              <div className="n-text">
                <p className="n-top">
                  <b>PXI</b>
                  <span>now</span>
                </p>
                <p className="n-body">You're in a new photo in Late Checkout</p>
              </div>
              <img className="n-thumb" src="/site/img/lib/k00.jpg" alt="" />
            </div>
            <div className="notif n2">
              <img className="n-icon" src="/site/img/app-icon.png?v=grit5" alt="" />
              <div className="n-text">
                <p className="n-top">
                  <b>Kofi saved your photo</b>
                  <span>now</span>
                </p>
                <p className="n-body">from Late Checkout</p>
              </div>
              <img className="n-thumb" src="/site/img/lib/k01.jpg" alt="" />
            </div>
            <div className="notif n3">
              <img className="n-icon" src="/site/img/app-icon.png?v=grit5" alt="" />
              <div className="n-text">
                <p className="n-top">
                  <b>Ama reacted to your photo</b>
                  <span>1m ago</span>
                </p>
                <p className="n-body">in Late Checkout</p>
              </div>
              <img className="n-thumb" src="/site/img/lib/k02.jpg" alt="" />
            </div>
          </div>
        </section>
        {/* ============ 9:41 AM — THE STAMP ============ */}
        <section className="scene" id="stamp">
          <div className="scene-grid top">
            <div className="copy">
              <div className="beat">
                <h2 className="display">The stub becomes a stamp <span className="kw-mute">in your event passport.</span></h2>
                <p className="lead">Scanned at the door means verified.<span className="m-cut"> Every night you actually show up to gets pressed into your passport — <b>and levels you up.</b></span></p>
                <div className="lvl" aria-hidden="true">
                  <div className="lvl-badge">
                    <div className="badge-host"></div>
                    <span className="lvl-burst"></span>
                  </div>
                  <div className="lvl-info">
                    <p className="lvl-tier">Voyager</p>
                    <p className="lvl-bar">
                      <i></i>
                    </p>
                  </div>
                </div>{' '}
                <a className="more-link" href="/features/digital-event-passport">About the digital event passport<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              </div>
            </div>
            <div className="stage-box">
              <div className="stage" data-w="480" data-h="712" data-mw="480" data-mh="706" data-max="1.5">
                <div className="passport-host" role="img" aria-label="A PXI passport filling with verified event stamps"></div>{' '}
                <span className="ink-ring" aria-hidden="true"></span>{' '}
                <div className="specks" aria-hidden="true"></div>
                <div className="xp-float" aria-hidden="true">
                  <span className="xp-ghost">+250 points</span>
                  <span className="xp-fill">+250 points</span>
                </div>
              </div>
            </div>
          </div>
          <div className="stub-fly" aria-hidden="true"></div>
        </section>
        {/* ============ 10:02 AM — POST IT ============ */}
        <section className="scene" id="post">
          <div className="scene-grid flip">
            <div className="copy">
              <div className="beat">
                <p className="tc" data-t="10:02 am" aria-hidden="true"></p>
                <h2 className="display">One tap. Framed, captioned, <span className="kw-ig">shared to Instagram.</span></h2>
                <p className="lead">Any shot becomes a print<span className="m-cut"> — where and when baked in, with the stamp, the reactions and the comments pinned on</span>. <b>Straight to your story.</b></p>{' '}
                <a className="more-link" href="/features/instagram-event-sharing">How Instagram event sharing works<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              </div>
            </div>
            <div className="stage-box">
              <div className="stage" data-w="560" data-h="720" data-mw="320" data-mh="644">
                <div className="share">
                  <div className="canvas">
                    <div className="canvas-bg" aria-hidden="true">
                      <img src="/site/img/lib/t06.jpg" alt="" />
                    </div>
                    <div className="polaroid-print">
                      <div className="pp-photo">
                        <img src="/site/img/lib/t06.jpg" alt="Three friends smiling at the event, framed as a PXI Instagram story print with the event stamp" />
                      </div>
                      <div className="pp-cap" aria-hidden="true">
                        <p className="pp-row">
                          <b>Late Checkout</b>
                          <span className="pp-no">№ 0214</span>
                        </p>
                        <p className="pp-meta">Seaport, Boston on Fri Oct 2, 2026</p>
                        <p className="pp-by">shot by @lu</p>
                      </div>
                    </div>
                    <div className="sticker-stamp" aria-hidden="true"></div>
                    <div className="rx-pill r1" aria-hidden="true"><span>❤️</span>41</div>
                    <div className="rx-pill r2" aria-hidden="true"><span>🔥</span>18</div>
                    <div className="cm-stack" aria-hidden="true">
                      <div className="cm">
                        <img src="/site/img/av/A18.jpg" alt="" />
                        <p><b>ama</b>we look SO good ✨</p>
                      </div>
                      <div className="cm">
                        <img src="/site/img/av/A14.jpg" alt="" />
                        <p><b>nia</b>printing this one 🥹</p>
                      </div>
                      <div className="cm">
                        <img src="/site/img/av/A27.jpg" alt="" />
                        <p><b>dre</b>the dj said one more and meant it</p>
                      </div>
                    </div>
                    <div className="ig-chrome" aria-hidden="true">
                      <div className="ig-bars">
                        <i className="full"></i>
                        <i className="run">
                          <b></b>
                        </i>
                        <i></i>
                      </div>
                      <div className="ig-head">
                        <img src="/site/img/av/A14.jpg" alt="" />
                        <b>maya.lrnt</b>
                        <span>1m</span>
                      </div>
                      <div className="ig-foot">
                        <span className="ig-msg">Send message</span>
                        <span className="ig-heart">♡</span>
                        <span className="ig-send">➤</span>
                      </div>
                    </div>
                  </div>
                  <div className="iphone post-phone" data-pw="300" data-shell="1" aria-hidden="true"></div>
                </div>
                <div className="ig-btn" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" /></svg>Share to story<span className="ripple"></span></div>
              </div>
            </div>
          </div>
        </section>
        {/* ============ FINALE — the next one ============ */}
        <section className="finale" id="finale">
          <div className="stories">
            <div className="stories-head">
              <div className="stories-title">
                <h2 className="display">Stories from the night.</h2>
                <a href="/editorial" className="stories-all">Read all stories <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              </div>
            </div>
            <div className="story-fan">
              <a className="story" href="/editorial/fashion-week-brooklyn">
                <div className="story-media guide">
                  <img className="bg" src="/site/img/about/parties.jpg" alt="" />{' '}
                  <div className="gd" aria-hidden="true">
                    <span className="gd-mo" data-t="October 2026"></span>
                    <span className="gd-big" data-t="4–8"></span>
                    <span className="gd-days">
                      <i data-t="Sun"></i>
                      <i data-t="Mon"></i>
                      <i data-t="Tue"></i>
                      <i data-t="Wed"></i>
                      <i data-t="Thu"></i>
                    </span>
                    <span className="gd-city" data-t="Brooklyn, NY"></span>
                  </div>{' '}
                  <i className="shade-b"></i>
                  <span className="tag">Guide</span>{' '}
                  <div className="story-cap">
                    <h3>Fashion Week Brooklyn 2026: the October schedule</h3>
                    <span>Schedule &amp; venues</span>
                  </div>
                </div>
              </a>{' '}
              <a className="story" href="/editorial/how-scrapbooks-work">
                <div className="story-media collage">
                  <img className="c1" src="/site/img/lib/k00.jpg" alt="" />
                  <img className="c2" src="/site/img/lib/k03.jpg" alt="" />
                  <img className="c3" src="/site/img/lib/k02.jpg" alt="" />{' '}
                  <i className="tp t1"></i>
                  <i className="tp t2"></i>
                  <i className="tp t3"></i>{' '}
                  <i className="shade-b"></i>
                  <span className="tag">Product</span>{' '}
                  <div className="story-cap">
                    <h3>The scrapbook is the product</h3>
                    <span>3 min read</span>
                  </div>
                </div>
              </a>{' '}
              <a className="story" href="/editorial/passport-and-legacy">
                <div className="story-media framed">
                  <img className="bg" src="/site/img/ed/culture-proof.jpg" alt="" />
                  <img className="fg" src="/site/img/ed/culture-proof.jpg" alt="" />{' '}
                  <i className="shade-b"></i>
                  <span className="tag">Culture</span>{' '}
                  <div className="story-cap">
                    <h3>Proof you were there</h3>
                    <span>3 min read</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
          <div className="org">
            <a className="btn btn-secondary" href="/platform">For organizers</a>{' '}
            <p>Throwing one? Tickets, the shared camera and the morning-after recap — <b>under your brand.</b></p>
          </div>
          <button className="btn btn-secondary replay" type="button">↺ Replay the night</button>
        </section>
      </main>
      <SiteFooter page="home" />
    </SiteShell>
  );
}
