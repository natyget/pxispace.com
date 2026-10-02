'use client';

// The Discover screen that opens the "Event tickets in two taps" scene. It is the same drawing as
// the /events page (Sleeve, EventStamp, the filter pill and the stage details from
// src/components/discover), laid out at the phone's 402x874 screen size. It renders hidden;
// home.scenes.js moves it into the phone frame and animates it as the reader scrolls.

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, LinkForwardIcon, MusicNote01Icon, Search01Icon, Sorting01Icon } from '@hugeicons/core-free-icons';
import Sleeve from '../../../components/discover/Sleeve';
import EventStamp from '../../../components/discover/EventStamp';
import { DiscInfo } from '../../../components/discover/DiscoverStage';
import { priceLabel, splitLocation } from '../../../components/discover/discoverEvent';

const GALLERY = '/landing/shared-event-gallery';
const PASSPORT = '/landing/passport-legacy';

// A fixed start date (no "Z") so the server and the browser print the same words.
const EVENTS = [
  { key: 'sunday', id: 'dd-sunday', title: 'Sunday Sessions', organizerName: 'DJ Kora', coverImage: `${PASSPORT}/gallery-02.jpg` },
  {
    key: 'omnia', id: 'dd-omnia', title: 'Omnia 2026', organizerName: 'Omnia Collective', coverImage: `${GALLERY}/gallery-03.jpg`,
    location: 'Roxbury Crossing, Boston, MA', price: 'Free', musicMatchScore: 81, startDate: '2026-10-01T21:00:00', tab: true, details: true,
  },
  {
    key: 'late', id: 'dd-late', title: 'Late Checkout', organizerName: 'Room 12 Collective', coverImage: '/site/img/posters/late-checkout.jpg', hideNameOnCover: true,
    location: 'Seaport, Boston, MA', price: '$10.00', musicMatchScore: 93, startDate: '2026-10-02T22:00:00', genre: 'Amapiano',
    pastPhotos: [`${GALLERY}/gallery-01.jpeg`, `${GALLERY}/gallery-04.jpg`], tab: true, disc: true, details: true,
  },
  { key: 'brunch', id: 'dd-brunch', title: 'Rooftop Brunch', organizerName: 'Seaport Social', coverImage: `${PASSPORT}/gallery-03.jpeg` },
];

function Details({ ev }) {
  const loc = splitLocation(ev);
  return (
    <div className="dd-det" data-k={ev.key}>
      <div className="dsc-stampdisc"><EventStamp event={ev} /></div>
      <dl className="dsc-facts">
        <div className="dsc-fact dsc-fact-wide">
          <dt>Location</dt>
          <dd>{loc.venue}{loc.rest ? <span className="dsc-fact-sub">{loc.rest}</span> : null}</dd>
        </div>
        <div className="dsc-fact"><dt>Price</dt><dd>{priceLabel(ev)}</dd></div>
        <div className="dsc-fact dsc-fact-big"><dt>Taste match</dt><dd>{ev.musicMatchScore}%</dd></div>
      </dl>
    </div>
  );
}

export default function DoorsDiscover() {
  return (
    <div className="dd-src" aria-hidden="true">
      <div className="dd-screen">
        <div className="dd-title">Discover<HugeiconsIcon icon={ArrowDown01Icon} size={22} strokeWidth={2.4} /></div>
        <div className="dd-pillrow">
          <div className="dsc-pill">
            <span className="dsc-pill-lbl">at</span>
            <span className="dsc-pop"><span className="dsc-pill-sel">Time<HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2.6} /></span></span>
            <span className="dsc-pill-lbl">in</span>
            <span className="dsc-pop"><span className="dsc-pill-sel">City<HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2.6} /></span></span>
            <span className="dsc-pill-fill" />
            <span className="dsc-pill-sep" />
            <span className="dsc-pill-btn dsc-pill-sort"><HugeiconsIcon icon={Sorting01Icon} size={20} strokeWidth={2.2} /></span>
            <span className="dsc-pill-btn"><HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2.2} /></span>
          </div>
        </div>
        <div className="dd-car">
          <div className="dd-track">
            {EVENTS.map((ev) => (
              <div key={ev.key} className={`dd-slide dd-${ev.key}`}>
                <Sleeve
                  event={ev}
                  variant="stage"
                  eager
                  tab={ev.tab ? <span className="dsc-tab"><HugeiconsIcon icon={MusicNote01Icon} size={20} strokeWidth={2.2} /></span> : null}
                  discInfo={ev.disc ? <DiscInfo event={ev} /> : null}
                />
              </div>
            ))}
          </div>
        </div>
        {EVENTS.filter((ev) => ev.details).map((ev) => <Details key={ev.key} ev={ev} />)}
        <div className="dd-actions">
          <span className="dsc-join">Join</span>
          <span className="dsc-round dsc-round-share"><HugeiconsIcon icon={LinkForwardIcon} size={22} strokeWidth={2} /></span>
        </div>
      </div>
    </div>
  );
}
