'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, Alert01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import Button from '../../components/ui/Button';
import { eventsService } from '../../services/events';
import { getTicketQuote, generateTicket, purchaseTicket, getUserTickets, getMyCredits } from '../../services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { displayImageSrc } from '@/lib/mediaUrl';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import TicketEmailPreview from '@/components/tickets/TicketEmailPreview';
import TicketDeliveryActions from '@/components/tickets/TicketDeliveryActions';
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
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [promoCode, setPromoCode] = useState('');

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

  // PXI credits: fetch balance once signed in so the "use credits" toggle can render.
  useEffect(() => {
    if (!isAuthenticated) {
      setCreditBalanceCents(0);
      return;
    }
    let cancelled = false;
    getMyCredits()
      .then((res) => {
        if (!cancelled) setCreditBalanceCents(res?.balanceCents ?? 0);
      })
      .catch(() => {
        if (!cancelled) setCreditBalanceCents(0);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const startWalletCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { clientSecret } = await purchaseTicket(apiEvent.id, apiTierId, {
        applyCredits: useCredits && creditBalanceCents > 0,
        promoCode: promoCode.trim() || undefined,
      });
      setWalletSecret(clientSecret);
      setWalletOpen(true);
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Could not start wallet checkout.');
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
        } catch {
          /* private browsing / storage disabled; deep link still attempted below */
        }
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
                    {isPaidEvent
                      ? 'Total includes a 4.59% service fee plus Stripe processing costs, on top of the ticket price.'
                      : 'This event is free to join.'}
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
                        {issuedTicketId && issuedPreview ? (
                          <>
                            <TicketEmailPreview preview={issuedPreview} className="mt-2" compact />
                            <TicketDeliveryActions ticketId={issuedTicketId} className="mt-3" />
                          </>
                        ) : (
                          <p className="text-zinc-400 text-xs text-center">Preparing your ticket…</p>
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
                        <div className="space-y-2 pt-2">
                          {creditBalanceCents > 0 ? (
                            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 cursor-pointer">
                              <span className="text-xs text-zinc-300">
                                Use my PXI credits
                                <span className="ml-1.5 font-bold text-white">
                                  (${(creditBalanceCents / 100).toFixed(2)} available)
                                </span>
                                <span className="block text-[10px] text-zinc-500 mt-0.5">
                                  Credits discount PXI fees on this order; applied at payment.
                                </span>
                              </span>
                              <input
                                type="checkbox"
                                checked={useCredits}
                                onChange={(e) => setUseCredits(e.target.checked)}
                                className="h-4 w-4 accent-white"
                              />
                            </label>
                          ) : null}
                          <input
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Promo / ambassador code (optional)"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 outline-none focus:border-white/25"
                          />
                          <Button
                            variant="neon"
                            className="w-full uppercase tracking-widest py-3.5 rounded-full shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:scale-95 disabled:cursor-wait"
                            onClick={startWalletCheckout}
                            disabled={joining}
                          >
                            {joining && !walletOpen ? (
                              <HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin mx-auto" />
                            ) : (
                              'Continue to payment'
                            )}
                          </Button>
                          <p className="text-center text-[10px] text-zinc-500">
                            Apple Pay, Google Pay, and card accepted via Stripe on the next step.
                          </p>
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
                          Paid tickets are processed by Stripe — PXI never sees or stores your card details. Refunds are
                          issued at the organizer&apos;s discretion.
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
