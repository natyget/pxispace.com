'use client';

import './discover.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  Cancel01Icon,
  MusicNote01Icon,
  Search01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';

/**
 * "at Time ⌄  in City ⌄ | search" — the discovery filter pill from the app.
 * Purely presentational: the page owns the filter state and passes it in.
 */

function useDismiss(ref, active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(true);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active, onClose]);
}

function Menu({ id, label, children, className = '' }) {
  return (
    <div id={id} role="listbox" aria-label={label} className={`dsc-menu ${className}`}>
      {children}
    </div>
  );
}

function Option({ selected, onClick, children }) {
  return (
    <button type="button" role="option" aria-selected={selected} className="dsc-opt" onClick={onClick}>
      <span>{children}</span>
      {selected ? <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.4} /> : null}
    </button>
  );
}

/**
 * @param {object} props
 * @param {{id:string,label:string}[]} props.timeOptions
 * @param {string} props.timeFilter
 * @param {(id:string)=>void} props.onTime
 * @param {string[]} props.cityOptions
 * @param {string} props.cityFilter
 * @param {(city:string)=>void} props.onCity
 * @param {string} props.cityQuery
 * @param {(q:string)=>void} props.onCityQuery
 * @param {(city:string, q:string)=>boolean} props.cityMatches
 * @param {string} props.searchQuery
 * @param {(q:string)=>void} props.onSearch
 * @param {boolean} props.showMatch  signed-in: show the music-match sort toggle
 * @param {boolean} props.matchActive
 * @param {()=>void} props.onToggleMatch
 */
export default function FilterPill({
  timeOptions,
  timeFilter,
  onTime,
  cityOptions,
  cityFilter,
  onCity,
  cityQuery,
  onCityQuery,
  cityMatches,
  searchQuery,
  onSearch,
  showMatch,
  matchActive,
  onToggleMatch,
}) {
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [menu, setMenu] = useState(null); // 'time' | 'city' | null
  const [searchOpen, setSearchOpen] = useState(false);
  const searching = searchOpen || Boolean(searchQuery);

  const close = useCallback(() => setMenu(null), []);
  useDismiss(rootRef, menu !== null, close);

  // The page can clear the query from outside (the empty state's "Show all events"). If the
  // field is open but empty and not being typed in, fold it back into the pill.
  useEffect(() => {
    if (!searchQuery && searchOpen && document.activeElement !== searchRef.current) {
      const t = setTimeout(() => setSearchOpen(false), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [searchQuery, searchOpen]);

  const timeLabel = timeOptions.find((o) => o.id === timeFilter)?.label ?? 'All';
  const cityLabel = cityFilter || 'All';

  const closeSearch = () => {
    onSearch('');
    setSearchOpen(false);
  };

  if (searching) {
    return (
      <div className="dsc-pill dsc-pill-search" ref={rootRef} role="search">
        <span className="dsc-pill-ico" aria-hidden="true">
          <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2.2} />
        </span>
        <input
          ref={searchRef}
          type="search"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeSearch();
          }}
          onBlur={() => {
            if (!searchQuery) setSearchOpen(false);
          }}
          placeholder="Search events or places"
          aria-label="Search events"
          className="dsc-pill-input"
          autoFocus
        />
        <button type="button" className="dsc-pill-btn" aria-label="Clear search" onClick={closeSearch}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  const visibleCities = cityOptions.filter((c) => cityMatches(c, cityQuery));

  return (
    <div className="dsc-pill" ref={rootRef}>
      <span className="dsc-pill-lbl" aria-hidden="true">at</span>

      <div className="dsc-pop">
        <button
          type="button"
          className="dsc-pill-sel"
          aria-haspopup="listbox"
          aria-expanded={menu === 'time'}
          aria-label={`Time: ${timeLabel}`}
          onClick={() => setMenu((m) => (m === 'time' ? null : 'time'))}
        >
          <span className="dsc-pill-val">{timeLabel === 'All' ? 'Time' : timeLabel}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.6} />
        </button>
        {menu === 'time' ? (
          <Menu label="Time">
            {timeOptions.map((o) => (
              <Option
                key={o.id}
                selected={timeFilter === o.id}
                onClick={() => {
                  onTime(o.id);
                  close();
                }}
              >
                {o.label}
              </Option>
            ))}
          </Menu>
        ) : null}
      </div>

      <span className="dsc-pill-lbl" aria-hidden="true">in</span>

      <div className="dsc-pop dsc-pop-r">
        <button
          type="button"
          className="dsc-pill-sel"
          aria-haspopup="listbox"
          aria-expanded={menu === 'city'}
          aria-label={`City: ${cityLabel}`}
          onClick={() => setMenu((m) => (m === 'city' ? null : 'city'))}
        >
          <span className="dsc-pill-val">{cityLabel === 'All' ? 'City' : cityLabel}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.6} />
        </button>
        {menu === 'city' ? (
          <Menu label="City" className="dsc-menu-city">
            {cityOptions.length > 6 ? (
              <input
                value={cityQuery}
                onChange={(e) => onCityQuery(e.target.value)}
                placeholder="Search city"
                aria-label="Search city"
                className="dsc-menu-input"
              />
            ) : null}
            {visibleCities.map((c) => (
              <Option
                key={c}
                selected={cityFilter === c}
                onClick={() => {
                  onCity(c);
                  close();
                }}
              >
                {c === 'All' ? 'All cities' : c}
              </Option>
            ))}
          </Menu>
        ) : null}
      </div>

      <span className="dsc-pill-fill" />

      {showMatch ? (
        <button
          type="button"
          className={`dsc-pill-btn dsc-pill-match${matchActive ? ' on' : ''}`}
          aria-pressed={matchActive}
          aria-label="Sort by music match"
          title="Sort by music match"
          onClick={onToggleMatch}
        >
          <HugeiconsIcon icon={MusicNote01Icon} size={18} strokeWidth={2.2} />
        </button>
      ) : null}

      <span className="dsc-pill-sep" aria-hidden="true" />

      <button
        type="button"
        className="dsc-pill-btn"
        aria-label="Search events"
        onClick={() => setSearchOpen(true)}
      >
        <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2.2} />
      </button>
    </div>
  );
}
