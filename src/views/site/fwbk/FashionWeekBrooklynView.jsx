// Fashion Week Brooklyn 2026 guide — the Oct 4–8 schedule and venues.
// Ported 1:1 from pxispace-redesign/site/fashion-week-brooklyn.html; styles in ../styles, motion in ./fwbk.scenes.js.
// `js` is the demo's <html class="js"> progressive-enhancement hook (it docks the day chips
// on narrow screens). This page only ever renders with its script, so it is set server-side
// on the wrapper instead — no layout shift when hydration lands.

import '../styles/fwbk.css';
import SiteShell from '../runtime/SiteShell';
import SiteNav from '../chrome/SiteNav';
import SiteFooter from '../chrome/SiteFooter';

export default function FashionWeekBrooklynView() {
  return (
    <SiteShell page="fwbk" className="js">
      <a className="fw-skip" href="#schedule">Skip to the schedule</a>
      <div className="ambient" aria-hidden="true">
        <div className="amb-night"></div>
      </div>
      <SiteNav page="fwbk" />
      <main id="top">
        {/* ============ HERO ============ */}
        <section className="fw-hero" aria-labelledby="fw-title">
          <div className="fw-in fw-hero-grid">
            <div className="fw-hero-copy">
              <nav className="fw-crumbs" aria-label="Breadcrumb">
                <ol>
                  <li>
                    <a href="/">Home</a>
                  </li>
                  <li>
                    <a href="/editorial">Editorial</a>
                  </li>
                  <li>
                    <span aria-current="page">Fashion Week Brooklyn 2026</span>
                  </li>
                </ol>
              </nav>
              <h1 className="fw-h1" id="fw-title">Fashion Week Brooklyn 2026: <span className="grad">The October Schedule</span></h1>
              <p className="fw-lead">Fashion Week Brooklyn (FWBK), often searched as Brooklyn Fashion Week, holds five Season 2 fashion shows from <b>Sunday, Oct 4 to Thursday, Oct 8, 2026</b>, in Park Slope and at Industry City. The week is produced by <b>BK Style Foundation</b>, a Brooklyn non-profit, and is followed by the World Fashion Exhibition in <b>Times Square on Friday, Oct 9</b>.</p>
              <p className="fw-meta">
                <span className="fw-pill fw-pill-verified"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Last verified: <time dateTime="2026-09-27T22:00-04:00">Sep 27, 2026, 10 pm ET</time></span>{' '}
                <span className="fw-pill">Schedule subject to change</span>{' '}
                <span className="fw-pill">Independent guide</span>
              </p>
              <div className="fw-ctas">
                <a className="btn btn-primary" id="fw-jump" href="#week">See the schedule</a>{' '}
                <a className="btn btn-secondary" href="/cal/fwbk-2026-all.ics" download><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>Add all six dates</a>
              </div>
            </div>
            <div className="fw-hero-stage" aria-hidden="true">
              <div className="fw-poster">
                <svg className="fp-runway" viewBox="0 0 440 260" preserveAspectRatio="none">
                  <defs>
                    <lineargradient id="fp-floor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#fff" stopOpacity="0" />
                      <stop offset="1" stopColor="#fff" stopOpacity=".08" />
                    </lineargradient>
                    <radialgradient id="fp-pool" cx=".5" cy=".92" r=".62">
                      <stop offset="0" stopColor="#FF5A1F" stopOpacity=".42" />
                      <stop offset=".55" stopColor="#D84AFF" stopOpacity=".12" />
                      <stop offset="1" stopColor="#D84AFF" stopOpacity="0" />
                    </radialgradient>
                  </defs>
                  <rect x="0" y="0" width="440" height="260" fill="url(#fp-pool)" />
                  <path d="M196 0 H244 L440 260 H0 Z" fill="url(#fp-floor)" />
                  <path d="M196 0 L0 260 M244 0 L440 260 M220 0 V260" fill="none" stroke="rgba(255,255,255,.26)" strokeWidth="1" strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
                  <path d="M188 10 H252 M176 26 H264 M158 50 H282 M130 86 H310 M88 142 H352 M24 226 H416" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>{' '}
                <div className="fp-copy">
                  <span className="fp-mo" data-t="October 2026"></span>{' '}
                  <span className="fp-big" data-t="4–8"></span>{' '}
                  <span className="fp-days">
                    <i data-t="Sun"></i>
                    <i data-t="Mon"></i>
                    <i data-t="Tue"></i>
                    <i data-t="Wed"></i>
                    <i data-t="Thu"></i>
                    <i className="fp-plus" data-t="+ Fri"></i>
                  </span>{' '}
                  <span className="fp-city" data-t="Season 2 in Brooklyn, NY"></span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ============ SCHEDULE ============ */}
        <div className="fw-in fw-sched" id="schedule">
          <nav className="fw-days" aria-label="Jump to a date">
            <p className="fw-days-h">The week</p>
            <ol>
              <li>
                <a href="#oct-4" data-date="2026-10-04">
                  <span className="d">Sun</span>
                  <b>4</b>
                  <span className="s">Brooklyn x Japan</span>
                </a>
              </li>
              <li>
                <a href="#oct-5" data-date="2026-10-05">
                  <span className="d">Mon</span>
                  <b>5</b>
                  <span className="s">Slayway</span>
                </a>
              </li>
              <li>
                <a href="#oct-6" data-date="2026-10-06">
                  <span className="d">Tue</span>
                  <b>6</b>
                  <span className="s">Young Designers</span>
                </a>
              </li>
              <li>
                <a href="#oct-7" data-date="2026-10-07">
                  <span className="d">Wed</span>
                  <b>7</b>
                  <span className="s">Level Up</span>
                </a>
              </li>
              <li>
                <a href="#oct-8" data-date="2026-10-08">
                  <span className="d">Thu</span>
                  <b>8</b>
                  <span className="s">Very Brooklyn</span>
                </a>
              </li>
              <li>
                <a href="#oct-9" data-date="2026-10-09">
                  <span className="d">Fri</span>
                  <b>9</b>
                  <span className="s">Times Square</span>
                </a>
              </li>
            </ol>
          </nav>
          <div className="fw-main">
            <section className="glance" id="at-a-glance" aria-labelledby="h-glance">
              <h2 className="fw-h2" id="h-glance">At a glance</h2>
              <div className="week-wrap" id="week">
                <table className="week">
                  <caption>Fashion Week Brooklyn 2026, night by night</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Show</th>
                      <th scope="col">Venue</th>
                      <th scope="col">Runway</th>
                      <th scope="col">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">
                        <a href="#oct-4">Sun Oct 4</a>
                      </th>
                      <td data-l="Show">Brooklyn x Japan Festival</td>
                      <td data-l="Venue">Brooklyn Beauty Fashion Labo, Park Slope</td>
                      <td data-l="Runway">4 pm <small>(exhibition <span className="nw">12–6 pm</span>)</small></td>
                      <td data-l="Access">Open to the public, RSVP</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <a href="#oct-5">Mon Oct 5</a>
                      </th>
                      <td data-l="Show">Slayway (LGBTQAI+ Designers) Collection</td>
                      <td data-l="Venue">Atolye NYC, Park Slope</td>
                      <td data-l="Runway">7 pm <small>(doors 6 pm)</small></td>
                      <td data-l="Access">RSVP or ticket</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <a href="#oct-6">Tue Oct 6</a>
                      </th>
                      <td data-l="Show">Young Designers Runway</td>
                      <td data-l="Venue">Atolye NYC, Park Slope</td>
                      <td data-l="Runway">7 pm <small>(doors 6 pm)</small></td>
                      <td data-l="Access">RSVP or ticket</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <a href="#oct-7">Wed Oct 7</a>
                      </th>
                      <td data-l="Show">Level Up Designers Runway</td>
                      <td data-l="Venue">Atolye NYC, Park Slope</td>
                      <td data-l="Runway">7 pm <small>(doors 6 pm)</small></td>
                      <td data-l="Access">By invitation only</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <a href="#oct-8">Thu Oct 8</a>
                      </th>
                      <td data-l="Show">Very Brooklyn Show</td>
                      <td data-l="Venue">bkONE Productions, Industry City</td>
                      <td data-l="Runway">6 pm <small>(doors 5 pm)</small></td>
                      <td data-l="Access">Open to the public, free RSVP</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <a href="#oct-9">Fri Oct 9</a>
                      </th>
                      <td data-l="Show">World Fashion Exhibition Times Square 2026</td>
                      <td data-l="Venue">Times Square, Manhattan</td>
                      <td data-l="Runway">Time TBA</td>
                      <td data-l="Access">Not yet published</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <dl className="glance-facts">
                <div>
                  <dt>When</dt>
                  <dd>Sun Oct 4 – Thu Oct 8, 2026 in Brooklyn. Fri Oct 9 in Times Square.</dd>
                </div>
                <div>
                  <dt>Where</dt>
                  <dd>Park Slope (Atolye NYC, Brooklyn Beauty Fashion Labo), Industry City (bkONE Productions) and Times Square.</dd>
                </div>
                <div>
                  <dt>Who runs it</dt>
                  <dd>BK Style Foundation, a <span className="nw">501(c)(3)</span> non-profit that has produced Fashion Week Brooklyn since 2006.</dd>
                </div>
                <div>
                  <dt>Season</dt>
                  <dd>Season 2, 2026, themed “Runway Runway”. FWBK runs twice a year.</dd>
                </div>
                <div>
                  <dt>Getting in</dt>
                  <dd>Oct 4 and Oct 8 are open to the public with an RSVP. Oct 5 and 6 take an RSVP or ticket. Oct 7 is by invitation only.</dd>
                </div>
                <div>
                  <dt>Primary source</dt>
                  <dd><a className="fw-link" href="https://www.fashionweekbrooklyn.com/schedule" target="_blank" rel="noopener">FWBK’s schedule page<span className="fw-sr"> (opens in a new tab)</span></a>, marked “subject to changes”.</dd>
                </div>
              </dl>
            </section>
            {/* ============ DAY BY DAY ============ */}
            <div className="days" aria-label="Day by day">
              <article className="day" id="oct-4" data-date="2026-10-04" aria-labelledby="h-oct-4">
                <header className="day-head">
                  <p className="day-date" aria-hidden="true">
                    <span>Sun</span>
                    <b>04</b>
                    <span>Oct</span>
                  </p>
                  <div className="day-title">
                    <p className="day-tags"></p>
                    <h2 id="h-oct-4">Sun Oct 4: Brooklyn x Japan Festival at Brooklyn Beauty Fashion Labo</h2>
                  </div>
                </header>
                <div className="day-body">
                  <dl className="day-key">
                    <div>
                      <dt>Times</dt>
                      <dd>Runway <span className="nw">4 pm</span><small>Exhibition <span className="nw">12–6 pm</span></small></dd>
                    </div>
                    <div className="acc acc-open">
                      <dt>Access</dt>
                      <dd>Open to the public<small>RSVP required</small></dd>
                    </div>
                  </dl>
                  <dl className="day-facts">
                    <div>
                      <dt>Show</dt>
                      <dd>Pratt Creative Exhibition &amp; Fashion Runway Show, listed on FWBK’s tickets page as Japan X Brooklyn Festival<small>Hosted by J-Collabo, with Brooklyn Beauty Fashion Labo</small></dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd><span className="vn">Brooklyn Beauty Fashion Labo, </span>300 7th St (between 4th &amp; 5th Aves), Park Slope, Brooklyn, NY 11215 <a className="fw-link dir" href={'https://www.google.com/maps/search/?api=1&query=Brooklyn+Beauty+Fashion+Labo%2C+300+7th+St%2C+Brooklyn%2C+NY+11215'} target="_blank" rel="noopener">Directions<span className="fw-sr"> to Brooklyn Beauty Fashion Labo (Google Maps, opens in a new tab)</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></a></dd>
                    </div>
                  </dl>
                  <div className="day-designers">
                    <h3>Designers FWBK lists</h3>
                    <ul>
                      <li>The Boutique</li>
                      <li>Imitating Rockz</li>
                      <li>Last Dragon</li>
                      <li>Snack on Art</li>
                      <li>Inshallah</li>
                      <li>Peilin Chen</li>
                      <li>JUS-10 by Justin Haynes</li>
                    </ul>
                  </div>
                  <p className="day-note">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>The RSVP page lists the day as 12–10 pm, with the runway at 4 pm.</span>
                  </p>
                  <div className="day-actions">
                    <a className="btn btn-primary" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">RSVP on FWBK<span className="fw-sr"> for Oct 4 (opens in a new tab)</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>{' '}
                    <a className="btn btn-secondary" href="/cal/fwbk-2026-oct-4.ics" download>Add to calendar<span className="fw-sr">: Oct 4</span></a>
                  </div>
                </div>
              </article>
              <article className="day" id="oct-5" data-date="2026-10-05" aria-labelledby="h-oct-5">
                <header className="day-head">
                  <p className="day-date" aria-hidden="true">
                    <span>Mon</span>
                    <b>05</b>
                    <span>Oct</span>
                  </p>
                  <div className="day-title">
                    <p className="day-tags"></p>
                    <h2 id="h-oct-5">Mon Oct 5: Slayway Runway at Atolye NYC</h2>
                  </div>
                </header>
                <div className="day-body">
                  <dl className="day-key">
                    <div>
                      <dt>Times</dt>
                      <dd>Runway <span className="nw">7 pm</span><small>Doors <span className="nw">6 pm</span></small></dd>
                    </div>
                    <div className="acc acc-rsvp">
                      <dt>Access</dt>
                      <dd>RSVP or ticket<small>Via FWBK’s tickets page</small></dd>
                    </div>
                  </dl>
                  <dl className="day-facts">
                    <div>
                      <dt>Show</dt>
                      <dd>Slayway (LGBTQAI+ Designers) Collection, as FWBK’s schedule names it; its RSVP page calls it Slayway Runway<small>With Catch These Compliments, the night’s host</small></dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd><span className="vn">Atolye NYC, </span>236B 6th St (between 3rd &amp; 4th Aves), Park Slope, Brooklyn, NY 11215 <a className="fw-link dir" href={'https://www.google.com/maps/search/?api=1&query=Atolye+NYC%2C+236B+6th+St%2C+Brooklyn%2C+NY+11215'} target="_blank" rel="noopener">Directions<span className="fw-sr"> to Atolye NYC (Google Maps, opens in a new tab)</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></a></dd>
                    </div>
                  </dl>
                  <div className="day-designers">
                    <h3>Designers FWBK lists</h3>
                    <ul>
                      <li>IGBO Sisun by Moses</li>
                      <li>Roderick Reyes</li>
                      <li>Harley Siriano De Oliveira</li>
                      <li>Fluid Covenant</li>
                      <li>Nando</li>
                    </ul>
                  </div>
                  <p className="day-note">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>The RSVP page lists doors at 5:30 pm. FWBK’s schedule doesn’t mark this night public or invitation only.</span>
                  </p>
                  <div className="day-actions">
                    <a className="btn btn-primary" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">RSVP on FWBK<span className="fw-sr"> for Oct 5 (opens in a new tab)</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>{' '}
                    <a className="btn btn-secondary" href="/cal/fwbk-2026-oct-5.ics" download>Add to calendar<span className="fw-sr">: Oct 5</span></a>
                  </div>
                </div>
              </article>
              <article className="day" id="oct-6" data-date="2026-10-06" aria-labelledby="h-oct-6">
                <header className="day-head">
                  <p className="day-date" aria-hidden="true">
                    <span>Tue</span>
                    <b>06</b>
                    <span>Oct</span>
                  </p>
                  <div className="day-title">
                    <p className="day-tags"></p>
                    <h2 id="h-oct-6">Tue Oct 6: Young Designers Runway at Atolye NYC</h2>
                  </div>
                </header>
                <div className="day-body">
                  <dl className="day-key">
                    <div>
                      <dt>Times</dt>
                      <dd>Runway <span className="nw">7 pm</span><small>Doors <span className="nw">6 pm</span></small></dd>
                    </div>
                    <div className="acc acc-rsvp">
                      <dt>Access</dt>
                      <dd>RSVP or ticket<small>Via FWBK’s tickets page</small></dd>
                    </div>
                  </dl>
                  <dl className="day-facts">
                    <div>
                      <dt>Show</dt>
                      <dd>Young Designers, listed on FWBK’s tickets page as Young Designers Runway<small>Hosted by Rutgers University, with student teams from Howard and CUNY and a BK Style designer</small></dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd><span className="vn">Atolye NYC, </span>236B 6th St (between 3rd &amp; 4th Aves), Park Slope, Brooklyn, NY 11215 <a className="fw-link dir" href={'https://www.google.com/maps/search/?api=1&query=Atolye+NYC%2C+236B+6th+St%2C+Brooklyn%2C+NY+11215'} target="_blank" rel="noopener">Directions<span className="fw-sr"> to Atolye NYC (Google Maps, opens in a new tab)</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></a></dd>
                    </div>
                  </dl>
                  <div className="day-designers">
                    <h3>Designers FWBK lists</h3>
                    <ul>
                      <li><em>Rutgers University</em> <span className="nw">Danixa Almonte</span>, <span className="nw">Matthew Arias</span></li>
                      <li><em>Howard</em> <span className="nw">Camille Calhoun</span>, <span className="nw">Gabrielle Jean Pierre</span></li>
                      <li><em>CUNY</em> CUNY by CUNY Students</li>
                      <li><em>BK Style</em> Jah</li>
                    </ul>
                  </div>
                  <p className="day-note">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>The RSVP page lists doors at 5:30 pm. FWBK’s schedule doesn’t mark this night public or invitation only.</span>
                  </p>
                  <div className="day-actions">
                    <a className="btn btn-primary" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">RSVP on FWBK<span className="fw-sr"> for Oct 6 (opens in a new tab)</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>{' '}
                    <a className="btn btn-secondary" href="/cal/fwbk-2026-oct-6.ics" download>Add to calendar<span className="fw-sr">: Oct 6</span></a>
                  </div>
                </div>
              </article>
              <article className="day" id="oct-7" data-date="2026-10-07" aria-labelledby="h-oct-7">
                <header className="day-head">
                  <p className="day-date" aria-hidden="true">
                    <span>Wed</span>
                    <b>07</b>
                    <span>Oct</span>
                  </p>
                  <div className="day-title">
                    <p className="day-tags"></p>
                    <h2 id="h-oct-7">Wed Oct 7: Level Up Designers Runway at Atolye NYC</h2>
                  </div>
                </header>
                <div className="day-body">
                  <dl className="day-key">
                    <div>
                      <dt>Times</dt>
                      <dd>Runway <span className="nw">7 pm</span><small>Doors <span className="nw">6 pm</span></small></dd>
                    </div>
                    <div className="acc acc-invite">
                      <dt>Access</dt>
                      <dd>By invitation only<small>RSVP required</small></dd>
                    </div>
                  </dl>
                  <dl className="day-facts">
                    <div>
                      <dt>Show</dt>
                      <dd>Level Up Designers Runway: Up Next Emerging Designers<small>Hosted by Atolye NYC</small></dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd><span className="vn">Atolye NYC, </span>236B 6th St (between 3rd &amp; 4th Aves), Park Slope, Brooklyn, NY 11215 <a className="fw-link dir" href={'https://www.google.com/maps/search/?api=1&query=Atolye+NYC%2C+236B+6th+St%2C+Brooklyn%2C+NY+11215'} target="_blank" rel="noopener">Directions<span className="fw-sr"> to Atolye NYC (Google Maps, opens in a new tab)</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></a></dd>
                    </div>
                  </dl>
                  <div className="day-designers">
                    <h3>Designers FWBK lists</h3>
                    <ul>
                      <li>Babs Boutique NYC</li>
                      <li>Amparo3 de agua dulce</li>
                      <li>Maganda NYC <small>curated by 99 Yard</small></li>
                      <li>Roberto Silva</li>
                      <li>SheeShooWoo</li>
                    </ul>
                  </div>
                  <p className="day-note">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>The RSVP page lists doors at 5:30 pm. Invited guests RSVP through the same tickets page.</span>
                  </p>
                  <div className="day-actions">
                    <a className="btn btn-primary" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">RSVP on FWBK<span className="fw-sr"> for Oct 7, invitation only (opens in a new tab)</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>{' '}
                    <a className="btn btn-secondary" href="/cal/fwbk-2026-oct-7.ics" download>Add to calendar<span className="fw-sr">: Oct 7</span></a>
                  </div>
                </div>
              </article>
              <article className="day" id="oct-8" data-date="2026-10-08" aria-labelledby="h-oct-8">
                <header className="day-head">
                  <p className="day-date" aria-hidden="true">
                    <span>Thu</span>
                    <b>08</b>
                    <span>Oct</span>
                  </p>
                  <div className="day-title">
                    <p className="day-tags"></p>
                    <h2 id="h-oct-8">Thu Oct 8: Very Brooklyn Show at Industry City</h2>
                  </div>
                </header>
                <div className="day-body">
                  <dl className="day-key">
                    <div>
                      <dt>Times</dt>
                      <dd>Runway <span className="nw">6 pm</span><small>Doors <span className="nw">5 pm</span></small></dd>
                    </div>
                    <div className="acc acc-open">
                      <dt>Access</dt>
                      <dd>Open to the public<small>Free RSVP, General Admission or VIP</small></dd>
                    </div>
                  </dl>
                  <dl className="day-facts">
                    <div>
                      <dt>Show</dt>
                      <dd>Very Brooklyn Show; Brooklyn Made calls it A Very Brooklyn Fashion Show 2026<small>Presented with Brooklyn Made and the Brooklyn Chamber of Commerce</small></dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd>bkONE Productions (listed by FWBK as BK One), Industry City, 51 35th St, Building 5, Brooklyn, NY 11232 <a className="fw-link dir" href={'https://www.google.com/maps/search/?api=1&query=bkONE+Productions%2C+51+35th+St%2C+Brooklyn%2C+NY+11232'} target="_blank" rel="noopener">Directions<span className="fw-sr"> to bkONE Productions, Industry City (Google Maps, opens in a new tab)</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></a></dd>
                    </div>
                  </dl>
                  <div className="day-designers">
                    <h3>Designers FWBK lists</h3>
                    <ul>
                      <li>Voodofe</li>
                      <li>Trip to Earth</li>
                      <li>Nixx Pain</li>
                      <li>Zuri Land <small>kidswear</small></li>
                      <li>Shiyenze <small>Brooklyn Made</small></li>
                      <li>Eltsuh <small>Brooklyn Made</small></li>
                      <li>Uliana Urusova <small>Brooklyn Made</small></li>
                      <li>Najama House <small>Brooklyn Made</small></li>
                    </ul>
                  </div>
                  <p className="day-note">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Brooklyn Made lists 6–9 pm; the Brooklyn Chamber’s registration page lists 6–10 pm.</span>
                  </p>
                  <div className="day-actions">
                    <a className="btn btn-primary" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">RSVP on FWBK<span className="fw-sr"> for Oct 8 (opens in a new tab)</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>{' '}
                    <a className="btn btn-secondary" href="/cal/fwbk-2026-oct-8.ics" download>Add to calendar<span className="fw-sr">: Oct 8</span></a>
                  </div>
                </div>
              </article>
              <article className="day" id="oct-9" data-date="2026-10-09" aria-labelledby="h-oct-9">
                <header className="day-head">
                  <p className="day-date" aria-hidden="true">
                    <span>Fri</span>
                    <b>09</b>
                    <span>Oct</span>
                  </p>
                  <div className="day-title">
                    <p className="day-tags"></p>
                    <h2 id="h-oct-9">Fri Oct 9: World Fashion Exhibition in Times Square</h2>
                  </div>
                </header>
                <div className="day-body">
                  <dl className="day-key">
                    <div>
                      <dt>Times</dt>
                      <dd>Time TBA</dd>
                    </div>
                    <div className="acc acc-tba">
                      <dt>Access</dt>
                      <dd>Not yet published</dd>
                    </div>
                  </dl>
                  <dl className="day-facts">
                    <div>
                      <dt>Show</dt>
                      <dd>World Fashion Exhibition Times Square 2026<small>Presented by World Fashion Week and Fashion Week Brooklyn</small></dd>
                    </div>
                    <div>
                      <dt>Venue</dt>
                      <dd>Times Square, Manhattan. FWBK’s homepage names Father Duffy Square among the week’s venues.</dd>
                    </div>
                  </dl>
                  <p className="day-note">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>FWBK’s tickets page doesn’t list this date yet, and no designers are published. FWBK’s homepage advertises the season as Oct 4–10; nothing is listed for Oct 10.</span>
                  </p>
                  <div className="day-actions">
                    <a className="btn btn-primary" href="https://worldfashionexhibition.com/times-square-2026" target="_blank" rel="noopener">Details on WFE<span className="fw-sr"> for Oct 9 (opens in a new tab)</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>{' '}
                    <a className="btn btn-secondary" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">FWBK tickets<span className="fw-sr"> page (opens in a new tab)</span></a>{' '}
                    <a className="btn btn-secondary" href="/cal/fwbk-2026-oct-9.ics" download>Add to calendar<span className="fw-sr">: Oct 9, all day</span></a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
        {/* ============ VENUES ============ */}
        <section className="fw-sec" id="venues" aria-labelledby="h-venues">
          <div className="fw-in">
            <h2 className="fw-h2" id="h-venues">Venues</h2>
            <p className="fw-intro">Four locations across the week. The two Park Slope venues sit a short walk apart; Industry City is in Sunset Park, and the Oct 9 exhibition moves to Manhattan.</p>
            <div className="venues">
              <article className="venue">
                <p className="venue-when">Sun Oct 4</p>
                <h3>Brooklyn Beauty Fashion Labo</h3>
                <p className="venue-addr">300 7th St (between 4th &amp; 5th Aves)<br />Park Slope, Brooklyn, NY 11215</p>{' '}
                <a className="btn btn-secondary venue-btn" href={'https://www.google.com/maps/search/?api=1&query=Brooklyn+Beauty+Fashion+Labo%2C+300+7th+St%2C+Brooklyn%2C+NY+11215'} target="_blank" rel="noopener">Open in Google Maps<span className="fw-sr">: Brooklyn Beauty Fashion Labo (opens in a new tab)</span></a>
              </article>
              <article className="venue">
                <p className="venue-when">Mon Oct 5 – Wed Oct 7</p>
                <h3>Atolye NYC</h3>
                <p className="venue-addr">236B 6th St (between 3rd &amp; 4th Aves)<br />Park Slope, Brooklyn, NY 11215</p>{' '}
                <a className="btn btn-secondary venue-btn" href={'https://www.google.com/maps/search/?api=1&query=Atolye+NYC%2C+236B+6th+St%2C+Brooklyn%2C+NY+11215'} target="_blank" rel="noopener">Open in Google Maps<span className="fw-sr">: Atolye NYC (opens in a new tab)</span></a>
              </article>
              <article className="venue">
                <p className="venue-when">Thu Oct 8</p>
                <h3>bkONE Productions, Industry City</h3>
                <p className="venue-addr">51 35th St, Building 5<br />Brooklyn, NY 11232</p>{' '}
                <a className="btn btn-secondary venue-btn" href={'https://www.google.com/maps/search/?api=1&query=bkONE+Productions%2C+51+35th+St%2C+Brooklyn%2C+NY+11232'} target="_blank" rel="noopener">Open in Google Maps<span className="fw-sr">: bkONE Productions (opens in a new tab)</span></a>
              </article>
              <article className="venue">
                <p className="venue-when">Fri Oct 9</p>
                <h3>Times Square</h3>
                <p className="venue-addr">Manhattan, New York, NY<br />Exact spot TBA; FWBK names Father Duffy Square.</p>{' '}
                <a className="btn btn-secondary venue-btn" href={'https://www.google.com/maps/search/?api=1&query=Father+Duffy+Square%2C+New+York%2C+NY'} target="_blank" rel="noopener">Open in Google Maps<span className="fw-sr">: Father Duffy Square (opens in a new tab)</span></a>
              </article>
            </div>
            <p className="fw-fine">For subway and bus routes, plan the trip on <a className="fw-link" href="https://www.mta.info/" target="_blank" rel="noopener">mta.info<span className="fw-sr"> (opens in a new tab)</span></a>.</p>
          </div>
        </section>
        {/* ============ HOW TO ATTEND ============ */}
        <section className="fw-sec" id="how-to-attend" aria-labelledby="h-attend">
          <div className="fw-in">
            <h2 className="fw-h2" id="h-attend">How to attend</h2>
            <ol className="steps">
              <li>
                <h3>Check the night’s access</h3>
                <p>Oct 4 and Oct 8 are open to the public with an RSVP. Oct 5 and Oct 6 take an RSVP or ticket through FWBK’s tickets page. Oct 7 is by invitation only.</p>
              </li>
              <li>
                <h3>RSVP through FWBK</h3>
                <p><a className="fw-link" href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">FWBK’s tickets page<span className="fw-sr"> (opens in a new tab)</span></a> links each night to its RSVP page: Posh for Oct 4 to 7 and Brooklyn Made for Oct 8, which lists the show as free.</p>
              </li>
              <li>
                <h3>Arrive for doors</h3>
                <p>For Oct 5 to 8, FWBK lists doors an hour before the runway. The RSVP pages for the Atolye nights list 5:30 pm doors, so arriving early is the safer plan.</p>
              </li>
              <li>
                <h3>Recheck on the day</h3>
                <p>FWBK marks its schedule “subject to changes”. We re-check this guide against it and update the verified date at the top.</p>
              </li>
            </ol>
            <p className="fw-callout"><b>Expect cameras.</b> The Brooklyn Chamber’s registration page for the Oct 8 show says guests may be photographed and filmed for promotion, and asks anyone who would rather not be to tell a Brooklyn Made representative at the start of the event.</p>
          </div>
        </section>
        {/* ============ OPEN CALLS ============ */}
        <section className="fw-sec" id="designers-models-volunteers" aria-labelledby="h-calls">
          <div className="fw-in fw-split">
            <div>
              <h2 className="fw-h2" id="h-calls">Designers, models &amp; volunteers</h2>
            </div>
            <div>
              <p className="fw-body">FWBK recruits through open calls on its own site: designer, model, stylist, open mic and event intern or volunteer applications, each reviewed by the FWBK team. Its volunteer page notes the roles are not paid. Brooklyn Made says designer applications for the Oct 8 show are closed.</p>
              <ul className="fw-links">
                <li>
                  <a className="btn btn-secondary" href="https://www.fashionweekbrooklyn.com/open-calls" target="_blank" rel="noopener">All FWBK open calls<span className="fw-sr"> (opens in a new tab)</span></a>
                </li>
                <li>
                  <a className="btn btn-secondary" href="https://www.fashionweekbrooklyn.com/designers" target="_blank" rel="noopener">Designer registration<span className="fw-sr"> (opens in a new tab)</span></a>
                </li>
                <li>
                  <a className="btn btn-secondary" href="https://www.fashionweekbrooklyn.com/model" target="_blank" rel="noopener">Model registration<span className="fw-sr"> (opens in a new tab)</span></a>
                </li>
                <li>
                  <a className="btn btn-secondary" href="https://www.fashionweekbrooklyn.com/stylist-registration" target="_blank" rel="noopener">Stylist registration<span className="fw-sr"> (opens in a new tab)</span></a>
                </li>
                <li>
                  <a className="btn btn-secondary" href="https://www.fashionweekbrooklyn.com/volunteers" target="_blank" rel="noopener">Volunteers &amp; interns<span className="fw-sr"> (opens in a new tab)</span></a>
                </li>
              </ul>
            </div>
          </div>
        </section>
        {/* ============ PHOTOS + PXI ============ */}
        <section className="fw-sec" id="photos" aria-labelledby="h-photos">
          <div className="fw-in">
            <h2 className="fw-h2" id="h-photos">Photos from the week</h2>
            <div className="recap">
              <span className="recap-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <circle cx="12" cy="12.4" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>{' '}
              <div className="recap-copy">
                <p className="recap-h">Recaps land here each morning from Mon, Oct 5.</p>
                <p>Photos and short notes from the night before, with the designers FWBK lists.</p>
              </div>{' '}
              <a className="btn btn-secondary recap-btn" href="https://www.instagram.com/pxilabs/" target="_blank" rel="noopener">Follow @pxilabs<span className="fw-sr"> on Instagram (opens in a new tab)</span></a>
            </div>
            {/* During the week: add <ol class="recaps"> here with one <li> per night that has a published recap (photo, credit, 2–3 lines, link to #oct-N). Never ship empty tiles. */}
            <aside className="fw-cta" aria-labelledby="h-cta">
              <div className="fw-cta-copy">
                <img className="fw-cta-icon" src="/site/img/app-icon.png?v=grit5" alt="" width="56" height="56" loading="lazy" decoding="async" />{' '}
                <h2 id="h-cta">Shooting the week? Keep it in one album on PXI.</h2>
                <p>PXI gives an event one shared camera roll, so everyone’s photos from the night end up in the same place.</p>
              </div>
              <div className="fw-cta-btns">
                <a className="btn btn-warm" href="https://apps.apple.com/app/pxi/id6751762197" target="_blank" rel="noopener noreferrer"><img src="/site/img/apple-logo-white.svg" alt="" width="15" height="18" className="fw-apple" />Get PXI on the App Store<span className="fw-sr"> (opens in a new tab)</span></a>{' '}
                <a className="btn btn-secondary" href="/features/shared-event-photo-gallery">How shared event albums work</a>
              </div>
              <p className="fw-cta-more">Looking for more nights out? <a className="fw-link" href="/discover/new-york">Browse events in New York on PXI</a>.</p>
            </aside>
          </div>
        </section>
        {/* ============ FAQ ============ */}
        <section className="fw-sec" id="faq" aria-labelledby="h-faq">
          <div className="fw-in fw-split">
            <div>
              <h2 className="fw-h2" id="h-faq">FAQ</h2>
            </div>
            <div className="faq">
              <details open>
                <summary>When is Fashion Week Brooklyn 2026?</summary>
                <p>FWBK’s schedule lists the Brooklyn runway shows from Sunday, Oct 4 to Thursday, Oct 8, 2026, marked “subject to changes”. FWBK’s homepage advertises Oct 4–10. The World Fashion Exhibition in Times Square, presented by World Fashion Week and Fashion Week Brooklyn, is on Friday, Oct 9. Nothing is published for Oct 10.</p>
              </details>
              <details>
                <summary>Where are the shows?</summary>
                <p>Oct 4 is at Brooklyn Beauty Fashion Labo, 300 7th St, Park Slope. Oct 5 to 7 are at Atolye NYC, 236B 6th St, Park Slope. Oct 8 is at bkONE Productions, Industry City, 51 35th St, Building 5. Oct 9 is in Times Square.</p>
              </details>
              <details>
                <summary>Is Fashion Week Brooklyn open to the public?</summary>
                <p>Some nights are. FWBK marks Oct 4 and Oct 8 “Open to the Public” with an RSVP, and Oct 7 “By invitation only”. Oct 5 and Oct 6 have RSVP or ticket links on FWBK’s tickets page. FWBK’s open-calls page describes the week as an invitation-only trade event, so check each night before you go.</p>
              </details>
              <details>
                <summary>How do I get tickets or RSVP?</summary>
                <p>Start at FWBK’s tickets page. It links Oct 4 to 7 to their pages on Posh and Oct 8 to Brooklyn Made, which lists that show as free with General Admission and VIP.</p>
              </details>
              <details>
                <summary>What time do the shows start?</summary>
                <p>Per FWBK: on Oct 4 the exhibition runs 12–6 pm with the runway at 4 pm; Oct 5 to 7 have doors at 6 pm and the runway at 7 pm; Oct 8 has doors at 5 pm and the runway at 6 pm. The RSVP pages list 5:30 pm doors for Oct 5 to 7, and Brooklyn Made lists Oct 8 as 6–9 pm.</p>
              </details>
              <details>
                <summary>Is it free?</summary>
                <p>Brooklyn Made lists the Oct 8 Very Brooklyn Show as free. For the other nights, the RSVP page linked from FWBK’s tickets page has the current details.</p>
              </details>
              <details>
                <summary>Who organizes Fashion Week Brooklyn?</summary>
                <p>BK Style Foundation, a 501(c)(3) non-profit, which has produced Fashion Week Brooklyn since 2006. FWBK runs twice a year. This season is Season 2, 2026, themed “Runway Runway”.</p>
              </details>
              <details>
                <summary>Is it part of New York Fashion Week?</summary>
                <p>It’s a separate event, produced in Brooklyn by BK Style Foundation. The CFDA’s Fashion Calendar lists New York Fashion Week Spring-Summer 2027 as Sep 10–15, 2026, and NYFW Bridal as Oct 13–15, 2026.</p>
              </details>
              <details>
                <summary>How can designers, models or volunteers take part?</summary>
                <p>Through FWBK’s open-calls page, which has designer, model, stylist, open mic and event intern or volunteer applications. FWBK says volunteer roles are not paid.</p>
              </details>
              <details>
                <summary>What is A Very Brooklyn Fashion Show?</summary>
                <p>The Oct 8 show at Industry City, presented by Brooklyn Made, the Brooklyn Chamber of Commerce, Fashion Week Brooklyn and BK Style Foundation. FWBK lists it as the Very Brooklyn Show. The Brooklyn Chamber’s page says it returns for its fourth year.</p>
              </details>
              <details>
                <summary>What happens in Times Square on Oct 9?</summary>
                <p>World Fashion Exhibition Times Square 2026, presented by World Fashion Week and Fashion Week Brooklyn, takes place on Oct 9 in Times Square. Times and access aren’t published yet. FWBK’s homepage names Father Duffy Square among the week’s venues.</p>
              </details>
              <details>
                <summary>Who wrote this guide?</summary>
                <p>PXI, an event app for tickets, a shared camera roll and the morning-after scrapbook. This is an independent guide; see the disclosure below.</p>
              </details>
            </div>
          </div>
        </section>
        {/* ============ SOURCES ============ */}
        <section className="fw-sec" id="sources" aria-labelledby="h-sources">
          <div className="fw-in fw-split">
            <div>
              <h2 className="fw-h2" id="h-sources">Sources &amp; disclosure</h2>
            </div>
            <div className="sources">
              <p className="disclose">An independent guide by PXI. Fashion Week Brooklyn is produced by BK Style Foundation; this is not an official FWBK publication.</p>
              <p className="fw-body">Last verified: <time dateTime="2026-09-27T22:00-04:00">Sep 27, 2026, 10 pm ET</time>, against the pages below. FWBK’s own schedule is the primary source; where others disagree, we say so. Spot something out of date? <a className="fw-link" href="/contact">Tell us</a>.</p>
              <ul className="src-list">
                <li>
                  <a href="https://www.fashionweekbrooklyn.com/schedule" target="_blank" rel="noopener">FWBK schedule</a>
                  <span>Dates, shows, venues, times, access and designers</span>
                </li>
                <li>
                  <a href="https://www.fashionweekbrooklyn.com/copy-of-tickets-schedule" target="_blank" rel="noopener">FWBK tickets page</a>
                  <span>RSVP links for Oct 4 to 8</span>
                </li>
                <li>
                  <a href="https://www.fashionweekbrooklyn.com/" target="_blank" rel="noopener">FWBK homepage</a>
                  <span>Season window and the World Fashion Week announcement</span>
                </li>
                <li><a href="https://www.fashionweekbrooklyn.com/open-calls" target="_blank" rel="noopener">FWBK open calls</a> and <a href="https://www.fashionweekbrooklyn.com/volunteers" target="_blank" rel="noopener">volunteers</a><span>Applications and volunteer terms</span></li>
                <li>
                  <a href="https://www.bkstyle.org/fwbk" target="_blank" rel="noopener">BK Style Foundation</a>
                  <span>Organizer and history</span>
                </li>
                <li>
                  <a href="https://brooklynmadestore.com/pages/brooklyn-fashion-show-2026" target="_blank" rel="noopener">Brooklyn Made: A Very Brooklyn Fashion Show 2026</a>
                  <span>Oct 8 address, hours and free admission</span>
                </li>
                <li>
                  <a href="https://brooklynchamber.zohobackstage.com/FashionShow2026" target="_blank" rel="noopener">Brooklyn Chamber registration page</a>
                  <span>Oct 8 hours and photo release</span>
                </li>
                <li>
                  <a href="https://worldfashionexhibition.com/times-square-2026" target="_blank" rel="noopener">World Fashion Exhibition: Times Square 2026</a>
                  <span>Oct 9 date and presenters</span>
                </li>
                <li>Posh RSVP pages for <a href="https://posh.vip/e/japan-x-brooklyn-festival" target="_blank" rel="noopener">Oct 4</a>, <a href="https://posh.vip/e/slayway-runway" target="_blank" rel="noopener">Oct 5</a>, <a href="https://posh.vip/e/young-designers-runway" target="_blank" rel="noopener">Oct 6</a> and <a href="https://posh.vip/e/level-up-designers-runway" target="_blank" rel="noopener">Oct 7</a><span>Linked from FWBK’s tickets page</span></li>
                <li>
                  <a href="https://fashioncalendar.com/important-dates" target="_blank" rel="noopener">CFDA Fashion Calendar</a>
                  <span>New York Fashion Week dates</span>
                </li>
              </ul>
              <h3 className="src-h">Where sources disagree</h3>
              <ul className="conflicts">
                <li><b>Season dates.</b> The schedule says Oct 4–8; the homepage says Oct 4–10. The only later listing is the Oct 9 Times Square exhibition.</li>
                <li><b>Doors, Oct 5 to 7.</b> FWBK lists 6 pm; the RSVP pages list 5:30 pm. Runway at 7 pm in both.</li>
                <li><b>Oct 4 hours.</b> FWBK lists the exhibition as 12–6 pm; the RSVP page lists 12–10 pm. Runway at 4 pm in both.</li>
                <li><b>Oct 8 hours.</b> FWBK lists doors 5 pm and runway 6 pm; Brooklyn Made lists 6–9 pm and the Brooklyn Chamber page 6–10 pm.</li>
                <li><b>Access.</b> The open-calls page calls FWBK an invitation-only trade event; the schedule marks Oct 4 and Oct 8 open to the public.</li>
                <li><b>Show names.</b> FWBK’s schedule lists Oct 4 as the Pratt Creative Exhibition &amp; Fashion Runway Show and Oct 5 as the Slayway (LGBTQAI+ Designers) Collection; the tickets and RSVP pages call them Japan X Brooklyn Festival and Slayway Runway.</li>
                <li><b>A designer’s name.</b> FWBK’s schedule spells it “Roberick Reyes”; the Instagram account it links, @reyes_roderick, reads Roderick Reyes, which we use.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter page="fwbk" />
    </SiteShell>
  );
}
