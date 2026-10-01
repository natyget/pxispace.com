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
            <p className="hero-lead">We're six people building the app we wanted on our own nights out: a ticket in the host's name, one camera roll for everyone in the room, and a scrapbook waiting the next morning.</p>
          </div>
        </section>
        {/* ============ A NOTE FROM THE SIX OF US ============ */}
        <section className="note" id="note" aria-labelledby="note-h">
          <div className="note-in">
            <p className="eyebrow">A note from us</p>
            <h2 id="note-h" className="display">There are six of us.</h2>
            <p>No departments, no layers. The same six people design PXI, write the code, answer the support inbox and work the door on event nights. If something in the app made your night better, one of us built it. If something broke, one of us is already fixing it.</p>
            <p>We are building this because the best nights disappear. The photos end up in forty camera rolls, the ticket is a dead link by morning, and nothing is left to show you were all there.</p>
            <p>We don't have it all figured out. We ship, we watch what happens in a real room, and we fix what didn't hold up. That only works if you tell us the truth.</p>
          </div>
        </section>
        {/* ============ MISSION ============ */}
        <section className="mission" id="mission" aria-labelledby="mission-h">
          <div className="mission-in">
            <h2 id="mission-h" className="display mission-h">Our mission</h2>
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
              <img src="/site/img/pxi-mark.svg?v=grit5" alt="" width="180" height="180" />
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
            <h2 id="build-h" className="display">Made by six people<br />who run rooms.</h2>
            <div className="build-cols">
              <p>We host, produce and photograph live events ourselves, so PXI gets tested where it has to work: on a crowded floor, at a busy door, on a phone at 2 AM.</p>
              <p>We ship what holds up on a real night and cut what doesn't. When we get it wrong, we would rather hear it from you than guess.</p>
            </div>
          </div>
        </section>
        {/* ============ THE ASK: help a team of six ============ */}
        <section className="contact" id="help" aria-labelledby="help-h">
          <div className="help-in">
            <h2 id="help-h" className="display">We can't do this<br />without you.</h2>
            <p className="lead center">We don't have a marketing department. We have you. If PXI made one of your nights better, these four things help a team our size more than anything.</p>
          </div>
          <div className="cards">
            <article className="ccard">
              <span className="ci" data-i="Share08Icon" aria-hidden="true"></span>
              <h3>Tell your people.</h3>
              <p>Send PXI to the friend who always hosts, the cousin planning a wedding, the family group chat. Most people find us because someone they trust showed them.</p>
              <button type="button" className="ccta" data-share>
                <span className="ccta-label">Share PXI</span>
              </button>
              <span className="sr-only" role="status" aria-live="polite" data-share-status></span>
            </article>
            <article className="ccard">
              <span className="ci" data-i="StarIcon" aria-hidden="true"></span>
              <h3>Rate us on the App Store.</h3>
              <p>It takes ten seconds and it decides whether the next person gives us a try. Honest ratings only.</p>
              <a className="ccta" href="https://apps.apple.com/app/pxi/id6751762197?action=write-review" target="_blank" rel="noopener">Rate PXI</a>
            </article>
            <article className="ccard">
              <span className="ci" data-i="BubbleChatIcon" aria-hidden="true"></span>
              <h3>Tell us what's broken.</h3>
              <p>A confusing screen, a missing feature, a bug at the worst moment. We want to hear all of it, and one of the six of us will read it.</p>
              <a className="ccta" href="/contact">Send feedback</a>
            </article>
            <article className="ccard">
              <span className="ci" data-i="Camera01Icon" aria-hidden="true"></span>
              <h3>Follow the journey.</h3>
              <p>We post what we're building, what we got wrong and what's next, as it happens.</p>
              <div className="ccta-row" role="group" aria-label="PXI on social media">
                <a href="https://www.instagram.com/pxilabs/" target="_blank" rel="noopener noreferrer me">Instagram</a>
                <a href="https://www.tiktok.com/@pxilabs" target="_blank" rel="noopener noreferrer me">TikTok</a>
                <a href="https://www.youtube.com/@PXILabs" target="_blank" rel="noopener noreferrer me">YouTube</a>
                <a href="https://x.com/PXILabs" target="_blank" rel="noopener noreferrer me">X</a>
              </div>
            </article>
          </div>
          <div className="signoff">
            <p>Thank you for being here this early.</p>
            <small>The six of us at PXI</small>
          </div>
        </section>
      </main>
      <SiteFooter page="about" />
    </SiteShell>
  );
}
