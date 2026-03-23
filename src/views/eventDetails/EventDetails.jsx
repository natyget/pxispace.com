'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  AlertCircle,
  Loader2,
  Heart,
  Instagram,
  Globe,
  Smartphone,
  Sparkles,
  Music2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { eventsService } from '../../services/events';
import { getTicketQuote, createCheckoutSession, generateTicket, purchaseTicket } from '../../services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { spotifyEmbedSrc } from '@/lib/spotify';
import { readFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';
import { PXI_APP_STORE_URL, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
import { displayImageSrc } from '@/lib/mediaUrl';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';

const formatPrice = (usd, currency = 'USD') => {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
};

function parseTicketTiers(event) {
  if (!event || event.ticketType !== 'PAID') return [];
  const raw = event.ticketTiersJson;
  if (Array.isArray(raw) && raw.length) {
    const rows = raw.filter(
      (t) => t && t.id && typeof t.priceUsd === 'number' && t.priceUsd > 0
    );
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

function singleEventMapSrc(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  const pad = 0.02;
  const bboxParam = `${lo - pad},${la - pad},${lo + pad},${la + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bboxParam)}&layer=mapnik`;
}

function onImageErrorToDefault(e) {
  const el = e?.currentTarget;
  if (!el || el.dataset.fallbackApplied === '1') return;
  el.dataset.fallbackApplied = '1';
  el.src = DEFAULT_IMG;
}

/** OSM /export/embed: bbox only (marker query param is unreliable) */
function igHref(handle) {
  if (!handle) return null;
  const h = String(handle).replace(/^@/, '');
  return `https://instagram.com/${encodeURIComponent(h)}`;
}

const PUBLIC_EULA_COPY = (
  <>
    By getting a ticket you acknowledge this is a public event. Content you post may be visible to others and may be used in
    marketing by the host and PXI. See also the{' '}
    <Link href="/terms_of_service" className="text-pxi-purple underline hover:text-white">
      Terms of Service
    </Link>
    . Paid purchases are subject to the fee and refund rules shown at checkout.
  </>
);

const EventDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [apiEvent, setApiEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(!!id);
  const [quoteTotal, setQuoteTotal] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [walletSecret, setWalletSecret] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    setFavoriteIds(readFavoriteEventIds());
  }, []);

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
    setSelectedTierId((prev) => {
      if (prev != null && tiers.some((t) => t.id === prev)) return prev;
      return tiers[0].id;
    });
  }, [tiers]);

  const apiTierId = typeof selectedTierId === 'string' ? selectedTierId : undefined;

  const isPaidEvent = apiEvent?.ticketType === 'PAID' && tiers.length > 0;
  const isFreeEvent = apiEvent && apiEvent.ticketType !== 'PAID';
  const isPublic = apiEvent?.visibility === 'PUBLIC';
  const requireEula = isPublic && (isPaidEvent || isFreeEvent);

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

  const playlistEmbed = apiEvent?.spotifyPlaylistUrl ? spotifyEmbedSrc(apiEvent.spotifyPlaylistUrl) : null;
  const topTrackEmbed = apiEvent?.spotifyTopTrackUrl ? spotifyEmbedSrc(apiEvent.spotifyTopTrackUrl) : null;

  const mapSrc = apiEvent?.latitude != null && apiEvent?.longitude != null
    ? singleEventMapSrc(apiEvent.latitude, apiEvent.longitude)
    : null;

  const galleryImages = useMemo(() => {
    if (!apiEvent) return [];
    const thumbs = Array.isArray(apiEvent.scrapbookThumbnails) ? apiEvent.scrapbookThumbnails : [];
    const cover = apiEvent.coverImage ? [apiEvent.coverImage] : [];
    const raw = [...cover, ...thumbs.filter(Boolean)].slice(0, 32);
    const seen = new Set();
    const out = [];
    for (const u of raw) {
      const src = displayImageSrc(u, null);
      if (src && !seen.has(src)) {
        seen.add(src);
        out.push(src);
      }
    }
    return out.slice(0, 24);
  }, [apiEvent]);

  const canPurchase = !requireEula || eulaAccepted;

  const handleToggleFavorite = () => {
    if (!apiEvent?.id) return;
    toggleFavoriteEventId(apiEvent.id);
    setFavoriteIds(readFavoriteEventIds());
  };

  const startWalletCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) {
      setJoinError('Please sign in to continue.');
      return;
    }
    if (!canPurchase) {
      setJoinError('Please accept the EULA to continue.');
      return;
    }
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
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) {
      setJoinError('Please sign in to continue.');
      return;
    }
    if (!canPurchase) {
      setJoinError('Please accept the EULA to continue.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { url } = await createCheckoutSession(
        apiEvent.id,
        `${origin}/events?payment=success`,
        `${origin}/events?payment=cancelled`,
        apiTierId
      );
      if (url) window.location.href = url;
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Checkout failed.');
    } finally {
      setJoining(false);
    }
  };

  const handleFreeTicket = async () => {
    if (!apiEvent || !isFreeEvent || !isAuthenticated || !user?.id) {
      setJoinError('Please sign in to get a ticket.');
      return;
    }
    if (!canPurchase) {
      setJoinError('Please accept the EULA to continue.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      await generateTicket(user.id, apiEvent.id);
      setJoinSuccess(true);
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  if (eventLoading && !apiEvent) {
    return (
      <div className="pt-40 flex items-center justify-center text-white min-h-screen bg-black">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!apiEvent) {
    return (
      <div className="pt-40 text-center text-white min-h-screen bg-black">
        Event not found.
      </div>
    );
  }

  const host = apiEvent.host;
  const featured = apiEvent.featuredPeople || [];
  const favorited = favoriteIds.has(String(apiEvent.id));

  return (
    <>
      <div className="bg-black text-white min-h-screen">
        {/* Top CTAs */}
        <div className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <a
                href={PXI_APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                <Smartphone size={14} />
                App Store
              </a>
              <a
                href={PXI_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                <Smartphone size={14} />
                Google Play
              </a>
            </div>
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pxi-purple text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <Sparkles size={14} />
              Create an event
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section className="relative min-h-[70vh] flex items-end">
          <img
            src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={onImageErrorToDefault}
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          <div className="relative z-10 container mx-auto px-6 pb-16 pt-32 w-full">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="glass px-4 py-2 rounded-full text-xs uppercase">{apiEvent.effectiveStatus || 'Event'}</span>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="glass px-4 py-2 rounded-full text-xs uppercase inline-flex items-center gap-2 border border-white/10"
              >
                <Heart size={16} className={favorited ? 'fill-pink-500 text-pink-500' : ''} />
                {favorited ? 'Saved' : 'Favorite'}
              </button>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mt-2 leading-[0.9]">
              {apiEvent.name}
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mt-4 max-w-2xl">
              {apiEvent.location || 'Location TBA'} ·{' '}
              {apiEvent.startDate
                ? new Date(apiEvent.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })
                : 'Date TBA'}
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              {apiEvent.websiteUrl ? (
                <a
                  href={apiEvent.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
                >
                  <Glob size={16} /> Website
                </a>
              ) : null}
              {host?.instagramHandle ? (
                <a
                  href={igHref(host.instagramHandle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
                >
                  <Instagram size={16} /> @{String(host.instagramHandle).replace(/^@/, '')}
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-20">
            {/* Meta */}
            <div className="glass-dark p-8 rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-6 border border-white/5">
              <div className="flex items-center gap-3">
                <Calendar className="text-pxi-purple shrink-0" />
                <span className="text-sm">
                  {apiEvent.startDate
                    ? new Date(apiEvent.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-pxi-purple shrink-0" />
                <span className="text-sm">{apiEvent.location || 'TBA'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="text-pxi-purple shrink-0" />
                <span className="text-sm">{apiEvent._count?.tickets ?? 0} attending</span>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="text-pxi-purple shrink-0" />
                <span className="text-sm">{apiEvent.ticketType === 'PAID' ? 'Paid' : 'Free'}</span>
              </div>
            </div>

            {/* Map */}
            {mapSrc ? (
              <section>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Location</h2>
                <div className="rounded-3xl overflow-hidden border border-white/10 h-[320px] bg-zinc-900">
                  <iframe title="Event location" src={mapSrc} className="w-full h-full border-0" loading="lazy" />
                </div>
              </section>
            ) : null}

            {/* Gallery / scrapbook */}
            {galleryImages.length > 0 ? (
              <section>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Featured & scrapbook</h2>
                <p className="text-zinc-500 text-sm mb-6">Moments from the album — more in the PXI app.</p>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                  {galleryImages.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt=""
                      className="h-56 w-40 md:h-72 md:w-52 object-cover rounded-2xl border border-white/10 shrink-0"
                      onError={onImageErrorToDefault}
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {/* About */}
            <section>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">About</h2>
              <p className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                {apiEvent.description || 'Details coming soon.'}
              </p>
            </section>

            {/* Spotify */}
            {(playlistEmbed || topTrackEmbed) && (
              <section>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2">
                  <Music2 className="text-pxi-purple" />
                  Soundtrack
                </h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Playlist and top track for this event. Soon, ticket holders will be able to save the playlist to their own
                  Spotify.
                </p>
                <div className="space-y-6">
                  {playlistEmbed ? (
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Playlist</p>
                      <iframe
                        title="Spotify playlist"
                        src={playlistEmbed}
                        width="100%"
                        height="152"
                        className="rounded-xl border border-white/10"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  {topTrackEmbed ? (
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Top track</p>
                      <iframe
                        title="Spotify track"
                        src={topTrackEmbed}
                        width="100%"
                        height="152"
                        className="rounded-xl border border-white/10"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            )}

            {/* Line up */}
            {featured.length > 0 ? (
              <section>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Line up</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {featured.map((fp) => {
                    const u = fp.user;
                    if (!u) return null;
                    return (
                      <div
                        key={fp.id || fp.userId}
                        className="glass-dark rounded-2xl border border-white/10 p-6 flex gap-4 items-center"
                      >
                        <img
                          src={displayImageSrc(u.avatarUrl, DEFAULT_IMG)}
                          alt=""
                          className="w-16 h-16 rounded-full object-cover border border-white/10"
                          onError={onImageErrorToDefault}
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div>
                          <p className="font-black text-white">{u.name || u.username || 'Performer'}</p>
                          {u.username ? (
                            <p className="text-zinc-500 text-sm">@{u.username}</p>
                          ) : null}
                          <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-pxi-purple/20 text-pxi-purple border border-pxi-purple/30">
                            {fp.role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Diplomat passport (host) */}
            {host ? (
              <section className="glass-dark rounded-[2rem] border border-white/10 p-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">Diplomat passport</h2>
                <p className="text-zinc-500 text-sm mb-8">
                  Host credentials — scrapbook stamps represent events organized, not places visited.
                </p>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <img
                    src={displayImageSrc(host.avatarUrl, DEFAULT_IMG)}
                    alt=""
                    className="w-28 h-28 rounded-2xl object-cover border border-white/10 shrink-0"
                    onError={onImageErrorToDefault}
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-black">{host.name || host.username || 'Host'}</p>
                    {host.username ? <p className="text-zinc-500">@{host.username}</p> : null}
                    {host.city ? <p className="text-zinc-400 text-sm mt-2">{host.city}</p> : null}
                    {host.bio ? <p className="text-zinc-400 mt-4 leading-relaxed">{host.bio}</p> : null}
                    <div className="flex flex-wrap gap-3 mt-6">
                      {host.instagramHandle ? (
                        <a
                          href={igHref(host.instagramHandle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-pxi-purple hover:text-white inline-flex items-center gap-2"
                        >
                          <Instagram size={16} /> Instagram
                        </a>
                      ) : null}
                      {apiEvent.websiteUrl ? (
                        <a
                          href={apiEvent.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-pxi-purple hover:text-white inline-flex items-center gap-2"
                        >
                          <Glob size={16} /> Event site
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
                {apiEvent.scrapbookThumbnails?.length ? (
                  <div className="mt-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                      Event scrapbook stamps
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {apiEvent.scrapbookThumbnails.slice(0, 12).map((t, i) => (
                        <div
                          key={`${t}-${i}`}
                          className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 rotate-[-4deg] hover:rotate-0 transition-transform"
                        >
                          <img
                            src={displayImageSrc(t, DEFAULT_IMG)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={onImageErrorToDefault}
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          {/* Sidebar tickets */}
          <div className="lg:sticky lg:top-28 h-fit glass-dark p-10 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-3xl font-black">{priceDisplay}</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Total for paid tickets includes service and processing fees — see quote when you select a tier.
            </p>

            {isPaidEvent && tiers.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ticket tier</p>
                {tiers.map((t) => (
                  <label
                    key={t.id ?? 'base'}
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedTierId === t.id
                        ? 'border-pxi-purple bg-pxi-purple/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tier"
                        className="accent-pxi-purple"
                        checked={selectedTierId === t.id}
                        onChange={() => setSelectedTierId(t.id)}
                      />
                      <span className="font-bold">{t.label}</span>
                    </span>
                    <span className="text-sm font-black">{formatPrice(t.priceUsd, apiEvent.currency)}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {requireEula ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-pxi-purple">EULA — public event</p>
                <p className="text-zinc-400 text-xs leading-relaxed [&_a]:inline">{PUBLIC_EULA_COPY}</p>
                <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 accent-pxi-purple"
                    checked={eulaAccepted}
                    onChange={(e) => setEulaAccepted(e.target.checked)}
                  />
                  <span>I have read and agree to this agreement before purchasing or claiming a ticket.</span>
                </label>
              </div>
            ) : null}

            {joinSuccess && (
              <p className="text-green-400 text-sm font-medium">You’re in! Open the PXI app to view your ticket.</p>
            )}
            {joinError && <p className="text-red-400 text-sm">{joinError}</p>}

            {isPaidEvent ? (
              <div className="space-y-3">
                <Button
                  variant="neon"
                  className="w-full uppercase tracking-widest py-4"
                  onClick={startWalletCheckout}
                  disabled={joining || joinSuccess || !canPurchase || !isAuthenticated}
                >
                  {joining && !walletOpen ? (
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  ) : (
                    'Apple Pay / Google Pay / Link'
                  )}
                </Button>
                <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  Opens secure Stripe payment (wallets when your browser supports them). Or use hosted checkout below.
                </p>
                <Button
                  variant="glass"
                  className="w-full uppercase tracking-widest py-4 border-white/10"
                  onClick={startHostedCheckout}
                  disabled={joining || joinSuccess || !canPurchase || !isAuthenticated}
                >
                  Continue with card (hosted checkout)
                </Button>
              </div>
            ) : (
              <Button
                variant="neon"
                className="w-full uppercase tracking-widest py-4"
                onClick={handleFreeTicket}
                disabled={joining || joinSuccess || !canPurchase || !isAuthenticated}
              >
                {joining ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Get free ticket'}
              </Button>
            )}

            {!isAuthenticated ? (
              <p className="text-zinc-500 text-xs">Sign in to get tickets.</p>
            ) : null}

            <div className="flex items-start gap-2 px-1">
              <AlertCircle size={13} className="text-zinc-600 flex-shrink-0 mt-0.5" />
              <p className="text-zinc-600 text-xs leading-relaxed">
                The vendor flat fee and consumer fee structure apply to paid tickets as described at checkout. Face-value
                refunds depend on the organizer.
              </p>
            </div>
          </div>
        </div>
      </div>

      <StripePaymentModal
        open={walletOpen}
        clientSecret={walletSecret}
        onCancel={() => {
          setWalletOpen(false);
          setWalletSecret(null);
        }}
        onSuccess={() => {
          setWalletOpen(false);
          setWalletSecret(null);
          setJoinSuccess(true);
        }}
      />
    </>
  );
};

export default EventDetails;
