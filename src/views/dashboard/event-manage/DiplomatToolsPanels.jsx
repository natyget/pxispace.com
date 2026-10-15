'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isVendorUser } from '@/lib/accountTier';
import TierLock from '@/components/dashboard/shell/TierLock';
import { createRefLink, downloadCsv, getWaitlist, listRefLinks } from '@/services/diplomatTools';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Diplomat tools on a night's page: referral links, waitlist and guest export. Citizens see the lock. */
export default function DiplomatToolsPanels({ eventId }) {
  const { user } = useAuth();

  if (!isVendorUser(user)) {
    return (
      <TierLock
        compact
        requirement="vendor"
        title="Diplomat tools"
        body="Waitlists, referral links and guest lists for your nights."
        primaryHref="/dashboard/vendor-upgrade"
        primaryLabel="Connect Stripe"
      />
    );
  }

  return (
    <div className="space-y-8">
      <ReferralLinks eventId={eventId} />
      <Waitlist eventId={eventId} />
      <Guests eventId={eventId} />
    </div>
  );
}

function ReferralLinks({ eventId }) {
  const [links, setLinks] = useState(null);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let alive = true;
    listRefLinks(eventId)
      .then((res) => alive && setLinks(res.links || []))
      .catch(() => alive && setError('Could not load referral links.'));
    return () => {
      alive = false;
    };
  }, [eventId]);

  const make = async (e) => {
    e.preventDefault();
    const name = label.trim();
    if (!name || busy) return;
    setBusy(true);
    setError('');
    try {
      const link = await createRefLink(eventId, name);
      setLinks((prev) => [...(prev || []), { ...link, clicks: 0, tickets: 0, revenueCents: 0 }]);
      setLabel('');
    } catch (err) {
      setError(err.message || 'Could not make the link.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(link.code);
      setTimeout(() => setCopied(''), 2500);
    } catch {
      window.prompt('Copy referral link:', link.url);
    }
  };

  return (
    <section id="referral-links" className="scroll-mt-6">
      <h2 className="mb-2 text-[11px] font-bold tracking-[0.02em] text-zinc-500">Referral links</h2>
      <form onSubmit={make} className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={40}
          placeholder="Label, e.g. Instagram"
          aria-label="Referral link label"
          className="glass-field min-h-[44px] min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm text-white"
        />
        <button
          type="submit"
          disabled={!label.trim() || busy}
          className="pill-solid inline-flex min-h-[44px] shrink-0 items-center px-5 text-[13px] disabled:opacity-45"
        >
          {busy ? 'Making...' : 'Make link'}
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}

      {links === null ? (
        <div className="mt-3 h-16 animate-pulse rounded-2xl bg-pxi-field" />
      ) : links.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No links yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-zinc-500">
                <th className="px-3 pb-2 font-semibold">Link</th>
                <th className="px-3 pb-2 text-right font-semibold">Clicks</th>
                <th className="px-3 pb-2 text-right font-semibold">Tickets</th>
                <th className="px-3 pb-2 text-right font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.code}>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-semibold text-white">{link.label}</p>
                    <button
                      type="button"
                      onClick={() => copy(link)}
                      className="pill-ghost mt-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.02em]"
                    >
                      {copied === link.code ? 'Copied' : 'Copy link'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{link.clicks ?? 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{link.tickets ?? 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{usd.format((link.revenueCents ?? 0) / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Waitlist({ eventId }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let alive = true;
    getWaitlist(eventId)
      .then((res) => alive && setCount(res.count ?? 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [eventId]);

  return (
    <section id="waitlist" className="scroll-mt-6">
      <h2 className="mb-2 text-[11px] font-bold tracking-[0.02em] text-zinc-500">Waitlist</h2>
      <div className="glass-field flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <p className="text-sm text-zinc-400">
          <span className="text-2xl font-black tabular-nums text-white">{count ?? ''}</span> on the list
        </p>
        <CsvButton path={`/api/events/${eventId}/waitlist?format=csv`} filename={`waitlist-${eventId}.csv`} />
      </div>
    </section>
  );
}

function Guests({ eventId }) {
  return (
    <section id="guests" className="scroll-mt-6">
      <h2 className="mb-2 text-[11px] font-bold tracking-[0.02em] text-zinc-500">Guests</h2>
      <div className="glass-field flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <p className="text-sm text-zinc-400">Names and tiers. No emails or phones.</p>
        <CsvButton path={`/api/events/${eventId}/guests.csv`} filename={`guests-${eventId}.csv`} />
      </div>
    </section>
  );
}

function CsvButton({ path, filename }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      await downloadCsv(path, filename);
    } catch {
      setError('Could not download the file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="pill-ghost inline-flex min-h-[40px] items-center px-4 text-[11px] font-bold tracking-[0.02em] disabled:opacity-45"
      >
        {busy ? 'Downloading...' : 'Download CSV'}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
