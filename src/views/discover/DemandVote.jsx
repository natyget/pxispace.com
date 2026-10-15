'use client';

import { useState } from 'react';

// Same base as src/services/api.js: the browser calls the API directly.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const FIELD = 'rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-white/30 focus:outline-none';

/**
 * "I want more [genre] in [area]": one vote per email, per city, area and genre. The city's top lines follow, as plain
 * text. The email is PXI's: it is only used to say the night is on, and is never shown to anyone.
 *
 * @param {{ cityCode: string, areas: string[], genres: { slug: string, name: string }[], top: { area: string, genre: string, count: number }[] }} props
 */
export default function DemandVote({ cityCode, areas, genres, top }) {
  const [genre, setGenre] = useState(genres[0]?.slug ?? '');
  const [area, setArea] = useState(areas[0] ?? '');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const genreName = (slug) => genres.find((g) => g.slug === slug)?.name ?? slug;

  async function vote(event) {
    event.preventDefault();
    setState('sending');
    try {
      const res = await fetch(`${API_BASE}/api/public/demand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityCode, area, genre, email: email.trim() }),
      });
      setState(res.ok ? 'counted' : 'failed');
    } catch {
      setState('failed');
    }
  }

  return (
    <section className="mx-auto max-w-[1080px] px-5 pb-16" aria-label="Demand votes">
      {state === 'counted' ? (
        <p className="text-lg text-white">Counted. We&apos;ll email you when it happens.</p>
      ) : (
        <form onSubmit={vote}>
          <p className="text-lg text-white">
            I want more{' '}
            <label className="sr-only" htmlFor="demand-genre">Genre</label>
            <select id="demand-genre" value={genre} onChange={(e) => setGenre(e.target.value)} className={FIELD}>
              {genres.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>{' '}
            in{' '}
            <label className="sr-only" htmlFor="demand-area">Area</label>
            <select id="demand-area" value={area} onChange={(e) => setArea(e.target.value)} className={FIELD}>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="demand-email">Email</label>
            <input
              id="demand-email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${FIELD} flex-1`}
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              className="rounded-xl bg-pxi-purple px-5 py-2 font-semibold text-white disabled:opacity-50"
            >
              Vote
            </button>
          </div>
          {state === 'failed' ? <p className="mt-3 text-sm text-zinc-400">Could not count that. Try again.</p> : null}
        </form>
      )}

      {top.length ? (
        <ul className="mt-8 space-y-1 text-base text-zinc-300">
          {top.map((row) => (
            <li key={`${row.area}|${row.genre}`}>
              <span className="font-semibold text-pxi-purple">{row.count}</span>{' '}
              want {genreName(row.genre)} in {row.area}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
