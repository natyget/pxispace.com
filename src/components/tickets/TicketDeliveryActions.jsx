'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  getTicketDeliveryOptions,
  sendTicketEmail,
  downloadAppleWalletPass,
  getGoogleWalletSaveUrl,
} from '@/services/tickets';

/**
 * Shows the three delivery options after a ticket is issued.
 *   • Email me a copy   — always available (account email)
 *   • Add to Apple Wallet — visible on iOS / macOS Safari when backend configured
 *   • Add to Google Wallet — visible on Android / desktop browsers when backend configured
 *
 * The component is intentionally self-contained: pass a `ticketId` and it
 * fetches its own delivery-options to know which buttons to show.
 */
export default function TicketDeliveryActions({ ticketId, className = '' }) {
  const [options, setOptions] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!ticketId) return undefined;
    (async () => {
      try {
        const data = await getTicketDeliveryOptions(ticketId);
        if (!cancelled) setOptions(data);
      } catch {
        if (!cancelled) setOptions(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  // Platform sniff: hide buttons that wouldn't work on the current OS to avoid
  // dead-end clicks. The endpoint itself still works for cross-device "send to my phone"
  // flows, but the post-issuance UX should match the user's device.
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isAppleDevice = /iPhone|iPad|iPod|Macintosh/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  // Show Google Wallet button on Android (native), or any non-Apple desktop browser.
  const showAppleButton = options?.appleWallet?.available && (isAppleDevice || (!isAndroid && !isAppleDevice));
  const showGoogleButton = options?.googleWallet?.available && (isAndroid || (!isAppleDevice && !isAndroid));

  const handleEmail = useCallback(async () => {
    setLoadingEmail(true);
    setErrMsg(null);
    setEmailMsg(null);
    try {
      const res = await sendTicketEmail(ticketId);
      setEmailMsg(res?.emailedAt ? 'Sent ✓' : 'Email sent');
      setOptions((prev) => (prev ? { ...prev, email: { ...prev.email, sentAt: res?.emailedAt ?? new Date().toISOString() } } : prev));
    } catch (err) {
      setErrMsg(err.message || 'Failed to send email');
    } finally {
      setLoadingEmail(false);
    }
  }, [ticketId]);

  const handleApple = useCallback(async () => {
    setLoadingApple(true);
    setErrMsg(null);
    try {
      const blob = await downloadAppleWalletPass(ticketId);
      const url = URL.createObjectURL(blob);
      // Triggers Wallet on iOS / opens the pass viewer on macOS.
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ticket.pkpass';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setErrMsg(err.message || 'Failed to build Apple Wallet pass');
    } finally {
      setLoadingApple(false);
    }
  }, [ticketId]);

  const handleGoogle = useCallback(async () => {
    setLoadingGoogle(true);
    setErrMsg(null);
    try {
      const { saveUrl } = await getGoogleWalletSaveUrl(ticketId);
      if (!saveUrl) throw new Error('No save URL returned');
      window.location.href = saveUrl;
    } catch (err) {
      setErrMsg(err.message || 'Failed to build Google Wallet save URL');
      setLoadingGoogle(false);
    }
  }, [ticketId]);

  if (!ticketId) return null;

  const alreadyEmailed = !!options?.email?.sentAt;

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        type="button"
        onClick={handleEmail}
        disabled={loadingEmail}
        className="w-full rounded-full bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all duration-500 disabled:opacity-60 disabled:scale-95 disabled:cursor-wait flex items-center justify-between gap-3 shadow-lg"
      >
        <span className="flex items-center gap-3">
          <span aria-hidden className="text-base">✉️</span>
          <span>{alreadyEmailed ? 'Resend email' : 'Email me a copy'}</span>
        </span>
        <span className="text-xs text-zinc-500">
          {loadingEmail ? '…' : emailMsg ?? (alreadyEmailed ? 'Sent ✓' : null)}
        </span>
      </button>

      {showAppleButton ? (
        <button
          type="button"
          onClick={handleApple}
          disabled={loadingApple}
          className="w-full rounded-full bg-black text-white border border-white/15 hover:bg-zinc-900 px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-500 disabled:opacity-60 disabled:scale-95 disabled:cursor-wait flex items-center justify-center gap-3 shadow-lg"
        >
          <span aria-hidden className="text-base"></span>
          {loadingApple ? 'Building…' : 'Add to Apple Wallet'}
        </button>
      ) : null}

      {showGoogleButton ? (
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="w-full rounded-full bg-white text-black hover:bg-zinc-100 px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-500 disabled:opacity-60 disabled:scale-95 disabled:cursor-wait flex items-center justify-center gap-3 shadow-lg"
        >
          <span aria-hidden className="text-base">G</span>
          {loadingGoogle ? 'Opening…' : 'Add to Google Wallet'}
        </button>
      ) : null}

      {errMsg ? <p className="text-red-400 text-xs">{errMsg}</p> : null}
    </div>
  );
}
