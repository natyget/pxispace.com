// The Discover map that opens the "every event in your city" scene (8:12 pm). It is the app's map screen: the dark
// streets, the pins (small black records, PXI purple for a PXI night, white for the rest), the title and the filter
// pill floating over the top, the strip of cards at the bottom. It renders hidden; home.scenes.js moves it into the
// phone frame and animates it as the reader scrolls. The three flyers that float out beside the phone render here too.
//
// Drawn from the app's own DiscoverMap, MapPin and MapCarousel (pxi-mobile-app, src/components/discover/map), with
// two changes the site makes everywhere: no middle dots (the venue stands left, the distance right in grey), and
// no outside logos (a source is only ever named in words).

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Cards01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import GigPoster from '../../go/GigPoster';
import '../../../components/discover/discover.css';
import { cityMapSvg } from './cityGeometry';
import { EVENTS, MAP_CROP, PINS, PRINTS, VIEWER } from './cityScene';

const BY_KEY = Object.fromEntries(EVENTS.map((e) => [e.key, e]));

/** A flyer: the real image when there is one, else the typographic poster in its genre's ink. */
function Flyer({ event, ratio }) {
  if (event.cover) return <img src={event.cover} alt="" draggable={false} />;
  return <GigPoster title={event.title} venue={event.venue} night={event.night} colors={event.colors} ratio={ratio} />;
}

function Pin({ pin }) {
  const event = pin.event ? BY_KEY[pin.event] : null;
  const style = { left: pin.x - MAP_CROP.x, top: pin.y - MAP_CROP.y };
  if (pin.stack) {
    return (
      <div className="cm-pin cm-pin-stack" data-wave={pin.wave} data-k={pin.key} style={style}>
        <span className="cm-disc cm-d1" />
        <span className="cm-disc cm-d2" />
        <span className="cm-disc cm-d3">
          <i className="cm-g1" />
          <i className="cm-g2" />
          <span className="cm-lab cm-lab-n"><b>{pin.stack}</b></span>
        </span>
      </div>
    );
  }
  return (
    <div className={`cm-pin${pin.pxi ? ' cm-pxi' : ''}`} data-wave={pin.wave} data-k={pin.key} data-ev={pin.event || undefined} style={style}>
      <span className="cm-ring" />
      <span className="cm-disc">
        <i className="cm-g1" />
        <i className="cm-g2" />
        <span className={`cm-lab${pin.count ? ' cm-lab-n' : ''}`}>
          {pin.count ? <b>{pin.count}</b> : null}
          {/* The selected pin shows its night's cover in its label. */}
          {event?.cover ? <span className="cm-cov"><img src={event.cover} alt="" draggable={false} /></span> : null}
        </span>
      </span>
    </div>
  );
}

function Card({ event }) {
  return (
    <div className="cm-card" data-k={event.key} data-wk={event.weekend ? '1' : undefined}>
      <div className="cm-cover">
        <Flyer event={event} ratio="3 / 4" />
      </div>
      <div className="cm-body">
        <div>
          <p className="cm-when"><b>{event.day}</b><i>{event.time}</i></p>
          <p className="cm-title">{event.title}</p>
        </div>
        <p className="cm-where"><span className="cm-venue">{event.venue}</span><span className="cm-dist">{event.miles}</span></p>
        <p className="cm-meta">
          <span className="cm-price">{event.price}</span>
          {event.via ? <span className="cm-via">via {event.via}</span> : null}
        </p>
      </div>
    </div>
  );
}

export default function CityMap() {
  return (
    <>
      <div className="cm-src" aria-hidden="true">
        <div className="dd-screen cm-screen">
          {/* the map: the streets, then everything that sits on them, so one move carries it all */}
          <div className="cm-map" style={{ width: MAP_CROP.w, height: MAP_CROP.h }}>
            <div className="cm-svg" dangerouslySetInnerHTML={{ __html: cityMapSvg(MAP_CROP) }} />
            <div className="cm-user" style={{ left: VIEWER.x - MAP_CROP.x, top: VIEWER.y - MAP_CROP.y }}><i /><b /></div>
            {PINS.map((pin) => <Pin key={pin.key} pin={pin} />)}
          </div>
          <div className="cm-veil" />
          <div className="cm-title-row">
            <div className="dd-title">Discover<HugeiconsIcon icon={ArrowDown01Icon} size={22} strokeWidth={2.4} /></div>
            <span className="cm-toggle"><HugeiconsIcon icon={Cards01Icon} size={22} strokeWidth={1.6} /></span>
          </div>
          <div className="dd-pillrow">
            <div className="dsc-pill">
              <span className="dsc-pill-lbl">at</span>
              <span className="dsc-pop">
                <span className="dsc-pill-sel">
                  <span className="cm-swap"><span className="cm-sw-a">Tonight</span><span className="cm-sw-b">This weekend</span></span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2.6} />
                </span>
              </span>
              <span className="dsc-pill-lbl">in</span>
              <span className="dsc-pop"><span className="dsc-pill-sel">City<HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2.6} /></span></span>
              <span className="dsc-pill-fill" />
              <span className="dsc-pill-sep" />
              <span className="dsc-pill-btn"><HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2.2} /></span>
            </div>
          </div>
          <div className="cm-strip">
            <div className="cm-track">
              {EVENTS.map((event) => <Card key={event.key} event={event} />)}
            </div>
          </div>
        </div>
      </div>
      {/* printed flyers: they float out of the card strip and settle around the phone */}
      <div className="cm-prints" aria-hidden="true">
        {PRINTS.map((key) => (
          <div key={key} className={`cm-print cm-print-${key}`} data-k={key}>
            <Flyer event={BY_KEY[key]} ratio="4 / 5" />
          </div>
        ))}
      </div>
    </>
  );
}
