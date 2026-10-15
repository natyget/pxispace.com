'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { parseNight, pickRange, weekdayOf } from '@/lib/when';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n) => String(n).padStart(2, '0');
const key = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/**
 * A small month calendar for "Pick a date": any night from tonight to 90 days out. Pure calendar
 * dates, no time zone maths; `tonight` comes from the page.
 */
export default function WhenCalendar({ tonight, selected, onPick }) {
  const { min, max } = pickRange(tonight);
  const start = parseNight(selected || tonight);
  const [view, setView] = useState({ y: start.y, m: start.m });

  const first = parseNight(min);
  const last = parseNight(max);
  const canPrev = view.y * 12 + view.m > first.y * 12 + first.m;
  const canNext = view.y * 12 + view.m < last.y * 12 + last.m;
  const step = (n) => {
    const t = view.y * 12 + (view.m - 1) + n;
    setView({ y: Math.floor(t / 12), m: (t % 12) + 1 });
  };

  const lead = weekdayOf(key(view.y, view.m, 1));
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysIn(view.y, view.m); d += 1) cells.push(key(view.y, view.m, d));

  return (
    <div className="dsc-cal">
      <div className="dsc-cal-head">
        <span className="dsc-cal-month">
          {MONTHS[view.m - 1]} {view.y}
        </span>
        <button type="button" className="dsc-cal-nav" aria-label="Previous month" disabled={!canPrev} onClick={() => step(-1)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.6} />
        </button>
        <button type="button" className="dsc-cal-nav" aria-label="Next month" disabled={!canNext} onClick={() => step(1)}>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.6} />
        </button>
      </div>
      <div className="dsc-cal-grid" role="grid">
        {DOW.map((d, i) => (
          <span key={i} className="dsc-cal-dow" aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((night, i) =>
          night ? (
            <button
              key={night}
              type="button"
              className={`dsc-cal-day${night === selected ? ' on' : ''}${night === tonight ? ' today' : ''}`}
              disabled={night < min || night > max}
              aria-label={night}
              aria-pressed={night === selected}
              onClick={() => onPick(night)}
            >
              {parseNight(night).d}
            </button>
          ) : (
            <span key={`b${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
