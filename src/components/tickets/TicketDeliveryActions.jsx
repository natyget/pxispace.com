'use client';

// Post-purchase ticket delivery: Apple / Google Wallet buttons + email-resend.
// The ticket email itself is sent automatically when the ticket is issued —
// this surface only offers wallet saves and a resend affordance.
// Wallet buttons appear only when the backend reports them configured.

import React, { useEffect, useState } from 'react';
import {
  getTicketDeliveryOptions,
  resendTicketEmail,
  getGoogleWalletSaveUrl,
  downloadApplePass,
} from '@/services/tickets';

export default function TicketDeliveryActions({ ticketId, className = '' }) {
  const [options, setOptions] = useState(null);
  const [busy, setBusy] = useState(null); // 'apple' | 'google' | 'email' | null
  const [note, setNote] = useState(null); // { kind: 'ok' | 'err', text }

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    getTicketDeliveryOptions(ticketId)
      .then((res) => {
        if (!cancelled) setOptions(res);
      })
      .catch(() => {
        if (!cancelled) setOptions(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (!ticketId || !options) return null;

  const handleApple = async () => {
    setBusy('apple');
    setNote(null);
    try {
      const blob = await downloadApplePass(ticketId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pxi-ticket-${ticketId}.pkpass`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setNote({ kind: 'err', text: 'Could not generate the Apple Wallet pass. Try again in a moment.' });
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy('google');
    setNote(null);
    try {
      const res = await getGoogleWalletSaveUrl(ticketId);
      if (res?.saveUrl) window.open(res.saveUrl, '_blank', 'noopener');
    } catch {
      setNote({ kind: 'err', text: 'Could not open Google Wallet. Try again in a moment.' });
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    setBusy('email');
    setNote(null);
    try {
      await resendTicketEmail(ticketId);
      setNote({ kind: 'ok', text: 'Ticket email sent again — check your inbox.' });
    } catch {
      setNote({ kind: 'err', text: 'Could not resend the email right now.' });
    } finally {
      setBusy(null);
    }
  };

  const walletBtn =
    'inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs font-black uppercase tracking-widest transition hover:scale-[1.02] disabled:opacity-50';

  return (
    <div className={`space-y-2 ${className}`}>
      {options.appleWallet?.available ? (
        <button
          type="button"
          onClick={handleApple}
          disabled={busy !== null}
          className={`${walletBtn} bg-black text-white border border-white/25`}
        >
          {busy === 'apple' ? 'Preparing pass…' : ' Add to Apple Wallet'}
        </button>
      ) : null}
      {options.googleWallet?.available ? (
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy !== null}
          className={`${walletBtn} bg-white text-black`}
        >
          {busy === 'google' ? 'Opening…' : 'Add to Google Wallet'}
        </button>
      ) : null}
      {options.email?.available ? (
        <p className="text-center text-[11px] text-zinc-500">
          A copy was emailed to you automatically.{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={busy !== null}
            className="font-semibold text-pxi-purple hover:text-white disabled:opacity-50"
          >
            {busy === 'email' ? 'Sending…' : 'Resend'}
          </button>
        </p>
      ) : null}
      {note ? (
        <p className={`text-center text-[11px] ${note.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {note.text}
        </p>
      ) : null}
    </div>
  );
}
