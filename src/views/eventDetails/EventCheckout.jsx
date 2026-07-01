'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, Alert01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import Button from '../../components/ui/Button';
import { eventsService } from '../../services/events';
import { getTicketQuote, createCheckoutSession, generateTicket, purchaseTicket, getUserTickets } from '../../services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { displayImageSrc } from '@/lib/mediaUrl';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import TicketDeliveryActions from '@/components/tickets/TicketDeliveryActions';
import TicketEmailPreview from '@/components/tickets/TicketEmailPreview';
import { buildTicketEmailPreviewInput } from '@/lib/ticketEmailPreview';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';


function parseTicketTiers(event) {
  if (!event || event.ticketType !== 'PAID') return [];
  const raw = event.ticketTiersJson;
  if (Array.isArray(raw) && raw.length) {
    const rows = raw.filter((t) => t && t.id && typeof t.priceUsd === 'number' && t.priceUsd > 0);
    if (rows.length) {
      return rows.map((t) => ({
        id: t.id,
        label: t.label || t.name || 'Ticket',
        priceUsd: t.priceUsd,
      }));
    }
  }
  const base = Number(event.ticketPrice);
  if (base > 0) return [{ id: null, label: 'General admission', priceUsd: base }];
  return [];
}

function formatPrice(usd, currency = 'USD') {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
}

function onImageErrorToDefault(e) {
  const el = e?.currentTarget;
  if (!el || el.dataset.fallbackApplied === '1') return;
  el.dataset.fallbackApplied = '1';
  el.src = DEFAULT_IMG;
}

/**
 * Unified checkout: guests sign in/up first (with redirect back here), then Apple Pay / Google Pay / hosted Stripe or free ticket.
 */
export default function EventCheckout({ basePath = '/events' }) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const tierFromUrl = searchParams.get('tier');
  const { user, isAuthenticated } = useAuth();

  const [apiEvent, setApiEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(!!id);
  const [quoteTotal, setQuoteTotal] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [walletSecret, setWalletSecret] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [issuedTicketId, setIssuedTicketId] = useState(null);
  const [issuedPreview, setIssuedPreview] = useState(null);

  const checkoutReturnPath = useMemo(() => {
    if (!id) return basePath;
    const qs = selectedTierId ? `?tier=${encodeURIComponent(selectedTierId)}` : '';
    return `${basePath}/${id}/checkout${qs}`;
  }, [id, selectedTierId, basePath]);

  const loginHref = `/login?redirect=${encodeURIComponent(checkoutReturnPath)}`;
  const signupHref = `/signup?mode=signup&redirect=${encodeURIComponent(checkoutReturnPath)}`;

  const stripeReturnUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${checkoutReturnPath}` : '';

  useEffect(() => {
    if (!id) {
      setEventLoading(false);
      return;
    }
    setEventLoading(true);
    eventsService
      .getEvent(id)
      .then((data) => setApiEvent(data.event || data))
      .catch(() => setApiEvent(null))
      .finally(() => setEventLoading(false));
  }, [id]);

  const tiers = useMemo(() => (apiEvent ? parseTicketTiers(apiEvent) : []), [apiEvent]);

  useEffect(() => {
    if (!tiers.length) {
      setSelectedTierId(null);
      return;
    }
    const fromUrl = tierFromUrl != null && tiers.some((t) => String(t.id) === String(tierFromUrl)) ? tierFromUrl : null;
    setSelectedTierId((prev) => {
      if (fromUrl != null) return tiers.find((t) => String(t.id) === String(fromUrl))?.id ?? tiers[0].id;
      if (prev != null && tiers.some((t) => t.id === prev)) return prev;
      return tiers[0].id;
    });
  }, [tiers, tierFromUrl]);

  const apiTierId = typeof selectedTierId === 'string' ? selectedTierId : undefined;

  const isPaidEvent = apiEvent?.ticketType === 'PAID' && tiers.length > 0;
  const isFreeEvent = apiEvent && apiEvent.ticketType !== 'PAID';

  const refreshQuote = useCallback(() => {
    if (!apiEvent?.id || !isPaidEvent) {
      setQuoteTotal(null);
      return;
    }
    getTicketQuote(apiEvent.id, null, apiTierId)
      .then((q) => setQuoteTotal(q.totalForBuyerUsd))
      .catch(() => setQuoteTotal(null));
  }, [apiEvent?.id, isPaidEvent, apiTierId]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const priceDisplay = useMemo(() => {
    if (!apiEvent) return null;
    if (!isPaidEvent) return 'Free';
    if (quoteTotal != null) return formatPrice(quoteTotal, apiEvent.currency);
    const t = tiers.find((x) => x.id === selectedTierId) || tiers[0];
    if (t?.priceUsd != null) return formatPrice(t.priceUsd, apiEvent.currency);
    return formatPrice(apiEvent.ticketPrice, apiEvent.currency);
  }, [apiEvent, isPaidEvent, quoteTotal, tiers, selectedTierId]);

  const startWalletCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { clientSecret } = await purchaseTicket(apiEvent.id, apiTierId);
      setWalletSecret(clientSecret);
      setWalletOpen(true);
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Could not start wallet checkout.');
    } finally {
      setJoining(false);
    }
  };

  const startHostedCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { url } = await createCheckoutSession(
        apiEvent.id,
        `${origin}${basePath}?payment=success`,
        `${origin}${basePath}?payment=cancelled`,
        apiTierId
      );
      if (url) window.location.href = url;
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Checkout failed.');
    } finally {
      setJoining(false);
    }
  };

  /** After successful free ticket issue, fire the album/event deep link so the native app opens to it. */
  const eventAlbumId = apiEvent?.albumId || apiEvent?.albums?.[0]?.id || null;
  const successDeepLinkUrl = eventAlbumId
    ? `pxi://album/${eventAlbumId}`
    : apiEvent?.id
      ? `pxi://event/${apiEvent.id}`
      : null;

  const handleFreeTicket = async () => {
    if (!apiEvent || !isFreeEvent || !isAuthenticated || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await generateTicket(user.id, apiEvent.id);
      setJoinSuccess(true);
      const ticketId = result?.ticket?.id ?? null;
      const qrValue = result?.ticket?.pasetoToken ?? null;
      setIssuedTicketId(ticketId);
      if (ticketId && qrValue && apiEvent) {
        setIssuedPreview(buildTicketEmailPreviewInput(apiEvent, ticketId, qrValue));
      } else {
        setIssuedPreview(null);
      }
      // Attempt to open the album in the app right away on mobile; harmless if app isn't installed.
      if (successDeepLinkUrl && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('pxi_pending_deeplink', successDeepLinkUrl);
        } catch {}
        const ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod|Android/i.test(ua)) {
          window.location.href = successDeepLinkUrl;
        }
      }
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  if (eventLoading && !apiEvent) {
    return (
      <div className="pt-40 flex items-center justify-center text-white min-h-screen bg-black">
        <HugeiconsIcon icon={Loading02Icon} size={32} className="animate-spin" />
      </div>
    );
  }

  if (!apiEvent) {
    return (
      <div className="pt-40 text-center text-white min-h-screen bg-black">
        Event not found.
      </div>
    );
  }  return (
    <>
      <div className="relative text-white min-h-screen bg-[#050505] overflow-x-hidden font-sans">
        {/* Blurred album cover background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {apiEvent?.coverImage ? (
            <img
              src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover scale-150 blur-[60px] opacity-[0.25]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0a0a0a]/90 to-black" />
        </div>

        {/* Custom Scrollbar for this page */}
        <style dangerouslySetInnerHTML={{__html: `
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}} />

        <div className="relative z-10">
          {/* Floating Back Navigation wrapped in a capsule/pill tray */}
          <div className="fixed top-24 left-6 z-30 md:left-8">
            <Link
              href={`${basePath}/${apiEvent.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border-0 bg-black/45 hover:bg-black/65 backdrop-blur-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-all shadow-lg"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              event
            </Link>
          </div>

          {/* Main Split Container */}
          <div className="flex min-h-screen items-center justify-center py-10 md:py-20 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl w-full mx-auto">
              
              {/* Left column: Checkout Card */}
              <div className="order-2 lg:order-1 w-full">
                <div className="bg-zinc-950/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] space-y-6 shadow-2xl border border-white/5">
                  <h2 className="text-3xl font-black">{priceDisplay}</h2>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Total for paid tickets includes service and processing fees — see quote when you select a tier.
                  </p>

                  {isPaidEvent && tiers.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ticket tier</p>
                      {tiers.map((t) => (
                        <label
                          key={t.id ?? 'base'}
                          className={`flex items-center justify-between gap-3 p-4 rounded-xl cursor-pointer transition-colors border-0 ${
                            selectedTierId === t.id
                              ? 'bg-[#d946ef]/20 text-white'
                              : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/80'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                              selectedTierId === t.id ? 'border-[#d946ef] bg-[#d946ef]/20' : 'border-white/30 bg-transparent'
                            }`}>
                              {selectedTierId === t.id && (
                                <div className="h-2 w-2 rounded-full bg-[#d946ef]" />
                              )}
                            </div>
                            <span className="font-bold text-white text-sm">{t.label}</span>
                          </span>
                          <span className="text-sm font-black text-amber-200">{formatPrice(t.priceUsd, apiEvent.currency)}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {joinSuccess ? (
                    <div className="space-y-6">
                      <div className="space-y-4 rounded-2xl bg-white/[0.03] p-5">
                        <div className="text-center space-y-1">
                           <p className="text-lg font-black uppercase tracking-widest text-white">You’re in!</p>
                           <p className="text-sm text-zinc-400">Your spot is confirmed.</p>
                        </div>
                        {eventAlbumId ? (
                          <Link
                            href={`/album/${eventAlbumId}`}
                            className="inline-flex w-full items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 text-xs font-black uppercase tracking-widest text-white transition hover:scale-105 border-0"
                          >
                            Open album
                          </Link>
                        ) : null}
                        {successDeepLinkUrl ? (
                          <a
                            href={successDeepLinkUrl}
                            className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 py-3 text-center text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
                          >
                            Open in PXI app
                          </a>
                        ) : null}
                        {issuedTicketId ? (
                          <>
                            {issuedPreview ? (
                              <TicketEmailPreview preview={issuedPreview} className="mt-2" compact />
                            ) : null}
                            <TicketDeliveryActions ticketId={issuedTicketId} />
                          </>
                        ) : (
                          <p className="text-zinc-400 text-xs text-center">Preparing your delivery options…</p>
                        )}
                      </div>

                      {/* Browse More Events button once checked out */}
                      <Link
                        href="/events"
                        className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] transition hover:scale-105 border-0"
                      >
                        Browse More Events
                      </Link>
                    </div>
                  ) : (
                    <>
                      {!isAuthenticated ? (
                        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                          <p className="text-sm font-bold text-white">Sign in or create an account to continue</p>
                          <p className="text-zinc-500 text-xs leading-relaxed">
                            We need your PXI account to issue your ticket. After you log in, you can pay with Apple Pay, Google Pay, Link,
                            or card.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                              href={loginHref}
                              className="flex-1 text-center py-3.5 rounded-full bg-pxi-purple text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity border-0"
                            >
                              Log in
                            </Link>
                            <Link
                              href={signupHref}
                              className="flex-1 text-center py-3.5 rounded-full border border-white/25 hover:bg-white/5 text-white text-xs font-black uppercase tracking-widest transition-colors"
                            >
                              Sign up
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {joinError && <p className="text-red-400 text-sm">{joinError}</p>}

                      {isAuthenticated && isPaidEvent ? (
                        <div className="space-y-3 pt-2">
                          {/* Apple Pay Button */}
                          <button
                            type="button"
                            onClick={startWalletCheckout}
                            disabled={joining}
                            className="w-full flex items-center justify-center gap-2 rounded-full bg-black text-white py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 hover:bg-zinc-900 border border-white/10 shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:scale-95 disabled:cursor-wait"
                          >
                            {joining && !walletOpen ? (
                              <HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin mx-auto" />
                            ) : (
                              <>
                                <img src="/apple-logo-white.svg" alt="Apple" className="h-[18px] w-auto -mt-1" />
                                <span>Pay</span>
                              </>
                            )}
                          </button>

                          {/* Google Pay Button */}
                          <button
                            type="button"
                            onClick={startWalletCheckout}
                            disabled={joining}
                            className="w-full flex items-center justify-center gap-2 rounded-full bg-white text-black py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 hover:bg-zinc-200 border-0 shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:scale-95 disabled:cursor-wait"
                          >
                            {joining && !walletOpen ? (
                              <HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin mx-auto text-black" />
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path fill="#4285F4" d="M47.53 24.45c0-1.68-.15-3.31-.44-4.89H24.5v9.26h12.92c-.56 2.99-2.27 5.53-4.88 7.27v6.02h7.89c4.63-4.26 7.3-10.53 7.3-17.66z"/>
                                  <path fill="#34A853" d="M24.5 48c6.48 0 11.92-2.14 15.89-5.81l-7.89-6.02c-2.15 1.44-4.9 2.29-8 2.29-6.14 0-11.34-4.14-13.19-9.71h-8.15v6.3A23.95 23.95 0 0024.5 48z"/>
                                  <path fill="#FBBC05" d="M11.31 28.75c-.47-1.44-.74-2.97-.74-4.55 0-1.58.27-3.11.74-4.55v-6.3h-8.15C1.15 17.3 0 20.78 0 24.2c0 3.42 1.15 6.9 3.16 10.05l8.15-6.3z"/>
                                  <path fill="#EA4335" d="M24.5 9.55c3.52 0 6.69 1.21 9.17 3.59l6.89-6.89C36.41 2.45 30.97 0 24.5 0 14.93 0 6.74 5.48 2.65 13.55l8.15 6.3c1.85-5.57 7.05-10.3 13.7-10.3z"/>
                                </svg>
                                <span>Pay</span>
                              </>
                            )}
                          </button>

                          {/* Standard Pay Button */}
                          <Button
                            variant="neon"
                            className="w-full uppercase tracking-widest py-3.5 rounded-full shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:scale-95 disabled:cursor-wait"
                            onClick={startWalletCheckout}
                            disabled={joining}
                          >
                            {joining && !walletOpen ? (
                              <HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin mx-auto" />
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="20" height="14" x="2" y="5" rx="2" />
                                  <line x1="2" x2="22" y1="10" y2="10" />
                                </svg>
                                <span>Pay</span>
                              </span>
                            )}
                          </Button>
                        </div>
                      ) : null}

                      {isAuthenticated && isFreeEvent ? (
                        <Button
                          variant="neonOrange"
                          className="w-full uppercase tracking-widest py-4 rounded-full transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:scale-95 disabled:cursor-wait"
                          onClick={handleFreeTicket}
                          disabled={joining}
                        >
                          {joining ? <HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin mx-auto" /> : 'Join Event'}
                        </Button>
                      ) : null}

                      <p className="text-center text-[10px] text-zinc-500 pt-2">
                        By joining, you agree to our{' '}
                        <Link href="/legal#terms" className="underline hover:text-zinc-400">Terms of Service</Link>.
                      </p>

                      <div className="flex items-start gap-2 px-1">
                        <HugeiconsIcon icon={Alert01Icon} size={13} className="text-zinc-600 flex-shrink-0 mt-0.5" />
                        <p className="text-zinc-600 text-xs leading-relaxed">
                          The vendor flat fee and consumer fee structure apply to paid tickets as described at checkout. Face-value
                          refunds depend on the organizer.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right side: Cover Card */}
              <div className="order-1 lg:order-2 w-full flex justify-center">
                <div className="w-full max-w-[340px] flex flex-col gap-4">
                  {/* Image cover card */}
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-[2rem] border-0 shadow-2xl relative bg-zinc-900/50">
                    <img
                      src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
                      alt={apiEvent.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* Info text below the image */}
                  <div className="px-2 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-pxi-purple">Event Cover</p>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">{apiEvent.name}</h1>
                    <p className="text-zinc-400 text-sm">
                      {apiEvent.startDate
                        ? new Date(apiEvent.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : 'Date TBA'}
                      {' · '}
                      {apiEvent.location || 'Location TBA'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <StripePaymentModal
        open={walletOpen}
        clientSecret={walletSecret}
        returnUrl={stripeReturnUrl}
        onCancel={() => {
          setWalletOpen(false);
          setWalletSecret(null);
        }}
        onSuccess={async () => {
          setWalletOpen(false);
          setWalletSecret(null);
          setJoinSuccess(true);
          // Paid-ticket fulfillment happens in the Stripe webhook, so the ticket
          // row may take a moment to appear. Poll briefly for the matching ticket
          // so the delivery-actions block can show wallet/email buttons.
          if (apiEvent?.id && user?.id) {
            for (let i = 0; i < 6; i += 1) {
              try {
                const tickets = await getUserTickets(user.id);
                const found = tickets.find((t) => t.eventId === apiEvent.id);
                if (found?.id && found.pasetoSignature) {
                  setIssuedTicketId(found.id);
                  setIssuedPreview(
                    buildTicketEmailPreviewInput(apiEvent, found.id, found.pasetoSignature, {
                      selectedTierId: apiTierId,
                    }),
                  );
                  break;
                }
              } catch {
                // Network blip while polling for the webhook-issued ticket; retry below.
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        }}
      />
    </>
  );
}
