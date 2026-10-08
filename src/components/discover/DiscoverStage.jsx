'use client';

import './discover.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
  MusicNote01Icon,
  LinkForwardIcon,
} from '@hugeicons/core-free-icons';
import Sleeve from './Sleeve';
import EventStamp from './EventStamp';
import { ctaFor, formatShortDate, formatTime, formatWhenParts, priceLabel, splitLocation } from './discoverEvent';
import { useSongPreview } from '@/lib/songPreview';

/**
 * The Discover stage: an album-cover carousel with the selected event's details beside it
 * (under it on narrow screens).
 *
 *  - Drag (mouse or touch) snaps to the next cover; arrows, dots, ←/→ and a sideways wheel
 *    do the same. It loops. Tapping a neighbour brings it to the centre.
 *  - The orange tab slides a spinning record out from behind the cover. The label carries the
 *    genre; polaroids and a reaction pill appear once an event has a previous edition
 *    (event.pastPhotos / event.pastReactions), otherwise the record simply pops.
 *  - prefers-reduced-motion is handled in CSS: slides snap without travelling, the record does
 *    not spin.
 *
 * The page owns which event is selected (`index`) so its backdrop, ad impressions and
 * analytics stay in step with the carousel.
 */

function wrapOffset(delta, n) {
  let x = ((delta % n) + n) % n;
  if (x > n / 2) x -= n;
  return x;
}

const slideKey = (ev) => (ev.__ad ? `ad-${ev.__ad.campaignId}-${ev.id}` : String(ev.id));

/** Web Share API where it exists (phones, Safari), otherwise copy the link. */
async function shareEvent(event) {
  const url = `${window.location.origin}/events/${event.id}`;
  const data = { title: event.title, text: `${event.title} on PXI`, url };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return; // the person closed the share sheet
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  } catch {
    toast.error('Could not copy the link');
  }
}

/** What is printed on the record once it is out. */
export function DiscInfo({ event }) {
  const genre = event.genre ? String(event.genre) : '';
  const photos = (event.pastPhotos || []).filter(Boolean).slice(0, 2);
  const reactions = Number(event.pastReactions) > 0 ? Number(event.pastReactions) : 0;
  const head = genre || formatShortDate(event.startDate);
  const sub = genre ? formatShortDate(event.startDate) : formatTime(event.startDate);
  const scale = Math.min(8.4, 44 / (Math.max(head.length, 1) * 0.68));
  return (
    <div className="dsc-di" aria-hidden="true">
      <div className="dsc-di-txt">
        <span className="dsc-di-genre" style={{ '--gs': scale }}>
          {head}
        </span>
        {sub ? <span className="dsc-di-sub">{sub}</span> : null}
      </div>
      {photos.map((src, i) => (
        <span key={src} className={`dsc-polaroid ${photos.length === 1 ? 'dsc-polaroid-solo' : `dsc-polaroid-${i}`}`}>
          <img src={src} alt="" draggable={false} loading="lazy" />
        </span>
      ))}
      {reactions ? (
        <span className="dsc-react">
          <HugeiconsIcon icon={FavouriteIcon} size={12} strokeWidth={2.4} />
          {reactions > 999 ? '999+' : reactions}
        </span>
      ) : null}
    </div>
  );
}

/** TASTE MATCH depends on who is looking: a score, a way to get one, or a dash. */
function TasteMatch({ event, isLoggedIn, musicConnected }) {
  const raw = Number(event.musicMatchScore);
  if (Number.isFinite(raw) && raw > 0) {
    return (
      <div className="dsc-fact dsc-fact-big">
        <dt>Taste match</dt>
        <dd>{Math.round(raw)}%</dd>
      </div>
    );
  }
  let body = '—';
  if (!isLoggedIn) {
    body = (
      <Link href="/login" className="dsc-fact-link">
        Log in to see
      </Link>
    );
  } else if (musicConnected === false) {
    body = (
      <Link href="/dashboard/account" className="dsc-fact-link">
        Connect Apple Music
      </Link>
    );
  }
  return (
    <div className="dsc-fact">
      <dt>Taste match</dt>
      <dd>{body}</dd>
    </div>
  );
}

export function StageSkeleton() {
  return (
    <section className="dsc-stage" aria-hidden="true">
      <div className="dsc-stage-grid">
        <div className="dsc-carcol">
          <div className="dsc-skel dsc-skel-cover" />
        </div>
        <div className="dsc-details">
          <div className="dsc-dgrid">
            <div className="dsc-skel" style={{ width: 'clamp(116px, 34vw, 168px)', aspectRatio: '1', borderRadius: '50%' }} />
            <div className="dsc-facts">
              <div className="dsc-skel" style={{ height: 34 }} />
              <div className="dsc-skel" style={{ height: 34 }} />
              <div className="dsc-skel" style={{ height: 34 }} />
            </div>
          </div>
          <div className="dsc-skel" style={{ height: 52, borderRadius: 999 }} />
        </div>
      </div>
    </section>
  );
}

/**
 * @param {object} props
 * @param {object[]} props.events      normalized events (coverImage, title, startDate, ...)
 * @param {number} props.index         selected event
 * @param {(i:number)=>void} props.onIndexChange
 * @param {Set<string>} [props.favoriteIds]
 * @param {(id:string)=>void} [props.onToggleFavorite]
 * @param {boolean} [props.isLoggedIn]
 * @param {boolean|null} [props.musicConnected]
 * @param {(event:object, index:number)=>void} [props.onOpen]  cover / JOIN clicked (analytics)
 */
export default function DiscoverStage({
  events,
  index,
  onIndexChange,
  favoriteIds,
  onToggleFavorite,
  isLoggedIn = false,
  musicConnected = null,
  onOpen,
}) {
  const n = events.length;
  const current = n ? Math.min(Math.max(index, 0), n - 1) : 0;
  const active = events[current];

  const [popped, setPopped] = useState(null); // key of the event whose record is out
  const [dragging, setDragging] = useState(false);
  // The index we are travelling from, so a slide that has to wrap round the loop can jump
  // instead of flying across the stage. Kept in state (not a ref) so render stays pure.
  const [seen, setSeen] = useState(current);
  const [from, setFrom] = useState(current);
  if (seen !== current) {
    setFrom(seen);
    setSeen(current);
  }

  const rootRef = useRef(null);
  const drag = useRef({ id: null, x0: 0, y0: 0, t0: 0, dx: 0, w: 300, live: false });
  const justDragged = useRef(false);
  const wheelAt = useRef(0);
  const latest = useRef({ n, current, onIndexChange });
  useEffect(() => {
    latest.current = { n, current, onIndexChange };
  });

  const go = useCallback((delta) => {
    const { n: count, current: at, onIndexChange: change } = latest.current;
    if (count < 2) return;
    setPopped(null);
    change((((at + delta) % count) + count) % count);
  }, []);

  const goTo = useCallback((i) => {
    setPopped(null);
    latest.current.onIndexChange(i);
  }, []);

  // ← / → anywhere on the page while the stage is on screen; Esc puts the record back.
  useEffect(() => {
    if (n < 1) return undefined;
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Escape') return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], [role="listbox"], [role="dialog"]')) return;
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
      if (e.key === 'Escape') {
        setPopped(null);
        return;
      }
      if (latest.current.n < 2) return;
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [n, go]);

  // ── Drag / swipe ───────────────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (n < 2) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest('button')) return;
    const slide = e.currentTarget.querySelector('.dsc-slide');
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: e.timeStamp,
      dx: 0,
      w: slide ? slide.offsetWidth : 300,
      live: false,
    };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    if (!d.live) {
      const dy = e.clientY - d.y0;
      if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy)) return;
      d.live = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer is already gone; the drag simply ends */
      }
      setDragging(true);
    }
    d.dx = dx;
    e.currentTarget.style.setProperty('--dx', `${dx}px`);
  };
  const finishDrag = (e, cancelled) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    drag.current = { ...d, id: null };
    if (!d.live) return;
    // The click that follows a drag must not open the event under the pointer.
    justDragged.current = true;
    window.setTimeout(() => {
      justDragged.current = false;
    }, 80);
    const velocity = d.dx / Math.max(1, e.timeStamp - d.t0);
    const far = Math.abs(d.dx) > d.w * 0.2 || Math.abs(velocity) > 0.4;
    e.currentTarget.style.setProperty('--dx', '0px');
    setDragging(false);
    if (!cancelled && far) go(d.dx < 0 ? 1 : -1);
  };
  const onWheel = (e) => {
    if (n < 2) return;
    if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    const now = performance.now();
    if (now - wheelAt.current < 550) return;
    wheelAt.current = now;
    go(e.deltaX > 0 ? 1 : -1);
  };

  // The record's song (the app's useDiscPreview). It starts from the tab's own click — browsers only
  // let a page make sound inside a tap — and stops when the record goes back or the slide moves.
  const preview = useSongPreview();
  const stopPreview = preview.stop;
  const outKey = active ? slideKey(active) : null;
  useEffect(() => {
    if (popped == null || popped !== outKey) stopPreview();
  }, [popped, outKey, stopPreview]);

  if (!n || !active) return null;

  const activeKey = slideKey(active);
  const isPopped = popped === activeKey;
  const cta = ctaFor(active);
  const loc = splitLocation(active);
  const { day: whenDay, time: whenTime } = formatWhenParts(active.startDate);
  const favorited = Boolean(favoriteIds && favoriteIds.has(String(active.id)));

  return (
    <section
      ref={rootRef}
      className="dsc-stage"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured events"
    >
      <div className="dsc-stage-grid">
        <div className="dsc-carcol">
          <div
            className={`dsc-car${dragging ? ' dsc-dragging' : ''}`}
            role="group"
            aria-label={`Event ${current + 1} of ${n}. Use the left and right arrow keys, or swipe.`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => finishDrag(e, false)}
            onPointerCancel={(e) => finishDrag(e, true)}
            onWheel={onWheel}
            onClickCapture={(e) => {
              if (justDragged.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {events.map((ev, i) => {
              const o = wrapOffset(i - current, n);
              const ao = Math.abs(o);
              const isActive = o === 0;
              const jumped = Math.abs(o - wrapOffset(i - from, n)) > 1;
              return (
                <div
                  key={slideKey(ev)}
                  className={`dsc-slide${jumped ? ' dsc-jump' : ''}`}
                  data-o={ao <= 1 ? String(o) : 'far'}
                  style={{ '--o': o, '--s': ao === 0 ? 1 : ao === 1 ? 0.86 : 0.72 }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${n}`}
                  aria-hidden={isActive ? undefined : true}
                >
                  <Sleeve
                    event={ev}
                    variant="stage"
                    eager={ao <= 1}
                    popped={isActive && isPopped}
                    coverAs={isActive ? Link : 'div'}
                    coverProps={
                      isActive
                        ? { href: `/events/${ev.id}`, draggable: false, onClick: () => onOpen?.(ev, i) }
                        : { onClick: () => go(o), tabIndex: -1 }
                    }
                    overlay={ev.__ad ? <span className="dsc-badge">Sponsored</span> : null}
                    tab={
                      isActive ? (
                        <button
                          type="button"
                          className="dsc-tab"
                          aria-pressed={isPopped}
                          aria-label={isPopped ? 'Put the record back' : 'Pull out the record'}
                          onClick={() => {
                            if (isPopped) {
                              setPopped(null);
                              preview.stop();
                            } else {
                              setPopped(activeKey);
                              preview.start(ev.topSong?.previewUrl);
                            }
                          }}
                        >
                          <HugeiconsIcon icon={MusicNote01Icon} size={20} strokeWidth={2.2} />
                        </button>
                      ) : null
                    }
                    discInfo={isActive ? <DiscInfo event={ev} /> : null}
                  />
                </div>
              );
            })}
          </div>

          {n > 1 ? (
            <div className="dsc-nav">
              <button type="button" className="dsc-arrow" aria-label="Previous event" onClick={() => go(-1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={22} strokeWidth={2.2} />
              </button>
              <div className="dsc-dots">
                {events.map((ev, i) => (
                  <button
                    key={slideKey(ev)}
                    type="button"
                    className="dsc-dot"
                    aria-label={`Show ${ev.title}`}
                    aria-current={i === current ? 'true' : undefined}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
              <button type="button" className="dsc-arrow" aria-label="Next event" onClick={() => go(1)}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={22} strokeWidth={2.2} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="dsc-details" key={activeKey}>
          {active.__ad ? <span className="dsc-sponsored">Sponsored</span> : null}
          <div className="dsc-dgrid">
            <div className="dsc-stampcol">
              <div className="dsc-stampdisc">
                <EventStamp event={active} />
              </div>
              <span className="dsc-cap">Event stamp</span>
            </div>
            <dl className="dsc-facts">
              <div className="dsc-fact dsc-fact-wide">
                <dt>When</dt>
                <dd>
                  {whenDay}
                  {whenTime ? <span className="dsc-fact-sub">{whenTime}</span> : null}
                </dd>
              </div>
              <div className="dsc-fact dsc-fact-wide">
                <dt>Location</dt>
                <dd>
                  {loc.venue}
                  {loc.rest ? <span className="dsc-fact-sub">{loc.rest}</span> : null}
                </dd>
              </div>
              <div className="dsc-fact">
                <dt>Price</dt>
                <dd>{priceLabel(active)}</dd>
              </div>
              <TasteMatch event={active} isLoggedIn={isLoggedIn} musicConnected={musicConnected} />
            </dl>
          </div>
          <div className="dsc-actions">
            <Link href={cta.href} className="dsc-join" onClick={() => onOpen?.(active, current)}>
              {cta.label}
            </Link>
            <button type="button" className="dsc-round dsc-round-share" aria-label={`Share ${active.title}`} onClick={() => shareEvent(active)}>
              <HugeiconsIcon icon={LinkForwardIcon} size={22} strokeWidth={2} />
            </button>
            {onToggleFavorite ? (
              <button
                type="button"
                className="dsc-round"
                aria-pressed={favorited}
                aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => onToggleFavorite(active.id)}
              >
                <HugeiconsIcon icon={FavouriteIcon} size={22} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <p className="dsc-sr" aria-live="polite">
        {`Event ${current + 1} of ${n}: ${active.title}`}
      </p>
    </section>
  );
}
