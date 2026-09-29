// About — mission, vision and what we believe.
// Ported 1:1 from pxispace-redesign/site/about.html; styles in ../styles, motion in ./about.scenes.js.

import '../styles/about.css';
import SiteShell from '../runtime/SiteShell';
import SiteNav from '../chrome/SiteNav';
import SiteFooter from '../chrome/SiteFooter';

export default function AboutView() {
  return (
    <SiteShell page="about">
      <div className="ambient" aria-hidden="true">
        <div className="amb-night"></div>
      </div>
      <div className="grain" aria-hidden="true"></div>
      <SiteNav page="about" />
      <main id="top">
        {/* ============ HERO — scattered moments gather into one mark ============ */}
        <section className="ab-hero" id="hero" aria-labelledby="ab-h1">
          <canvas className="field" aria-hidden="true"></canvas>{' '}
          <div className="ab-hero-copy">
            <h1 id="ab-h1" className="display-1">
              <span className="ln">
                <span>Memory is</span>
              </span>
              <span className="ln">
                <span>the product.</span>
              </span>
            </h1>
            <p className="hero-lead">PXI is event technology built around what people keep: tickets in the organizer's own name, one shared camera roll for everyone in the room, and a scrapbook that's ready the next morning.</p>
          </div>{' '}
          <a className="ab-cue" href="#mission">
            <span>Our mission</span>
            <i aria-hidden="true"></i>
          </a>
        </section>
        {/* ============ MISSION ============ */}
        <section className="mission" id="mission" aria-labelledby="mission-h">
          <div className="mission-in">
            <h2 id="mission-h" className="sr-only">Our mission</h2>
            <p className="statement">Our mission is to give every night a place to live, so the people who host it keep the revenue and the people who were there keep the memory.</p>
          </div>
        </section>
        {/* ============ WHY — five apps become one ============ */}
        <section className="why" id="why" aria-labelledby="why-h">
          <div className="why-copy">
            <h2 id="why-h" className="display">One night shouldn't<br />need five apps.</h2>
            <p className="lead">Invites live in one place, tickets in another, photos in forty camera rolls and the proof of who came nowhere at all. We put the whole night in one place, <b>before, during and long after.</b></p>
          </div>
          <div className="why-stage" aria-hidden="true">
            <div className="frag f1">
              <span className="fi" data-i="Ticket01Icon"></span>
            </div>
            <div className="frag f2">
              <span className="fi" data-i="QrCodeIcon"></span>
            </div>
            <div className="frag f3">
              <span className="fi" data-i="Camera02Icon"></span>
            </div>
            <div className="frag f4">
              <span className="fi" data-i="Calendar01Icon"></span>
            </div>
            <div className="one">
              <img src="/site/img/pxi-mark.svg?v=grit2" alt="" width="180" height="180" />
            </div>
          </div>
          <ul className="sr-only">
            <li>Tickets: sold in one app, invited in another.</li>
            <li>The door: a guest list nobody fully trusts.</li>
            <li>The photos: the best one is on someone else's phone.</li>
            <li>The proof: no record of who was actually there.</li>
            <li>PXI brings the ticket, the door, the camera roll, the scrapbook and the passport together.</li>
          </ul>
        </section>
        {/* ============ VISION ============ */}
        <section className="vision" id="vision" aria-labelledby="vision-h">
          <svg className="rings" viewBox="0 0 800 800" aria-hidden="true" />{' '}
          <div className="vision-in">
            <h2 id="vision-h" className="display-xl">The archive<br />of experience.</h2>
            <p className="lead center">Our vision is a lasting record of the rooms you've been in and the people you shared them with. Every night should leave something behind: a scrapbook, a stamp, a photo you didn't have to ask for.</p>
          </div>
        </section>
        {/* ============ HOW WE BUILD ============ */}
        <section className="build" id="build" aria-labelledby="build-h">
          <div className="build-in">
            <h2 id="build-h" className="display">Made by people<br />who run rooms.</h2>
            <div className="build-cols">
              <p>PXI is designed by people who host, produce and photograph live events. The product is tested where it has to work: on a crowded floor, at a busy door, on a phone at 2 AM.</p>
              <p>We ship what holds up on a real night and cut what doesn't. That's why the same app handles the ticket, the door and the memory, instead of handing guests off between tools.</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter page="about" />
    </SiteShell>
  );
}
