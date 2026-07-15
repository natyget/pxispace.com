'use client';

// Web ad beacons (W12): anonymous viewers get a persistent anonId so frequency
// caps and dedupe work logged-out. Impressions batch through sendBeacon-style
// fire-and-forget posts; clicks flush immediately. Never let tracking failures
// affect the page.

import { useEffect, useRef } from 'react';
import { trackAdEvents } from '@/services/ads';

const ANON_ID_KEY = 'pxi_anon_id';
const FLUSH_MS = 8000;

export function getAnonId() {
    if (typeof window === 'undefined') return null;
    try {
        let anonId = window.localStorage.getItem(ANON_ID_KEY);
        if (!anonId) {
            anonId = (window.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
                .replace(/[^A-Za-z0-9_-]/g, '');
            window.localStorage.setItem(ANON_ID_KEY, anonId);
        }
        return anonId;
    } catch {
        return null;
    }
}

const seenImpressions = new Set();
let queue = [];
let timer = null;

function flush() {
    if (queue.length === 0) return;
    const events = queue.splice(0, 50);
    trackAdEvents({ anonId: getAnonId(), events });
}

function scheduleFlush() {
    if (timer) return;
    timer = setTimeout(() => {
        timer = null;
        flush();
    }, FLUSH_MS);
}

export function queueAdImpression(ad) {
    if (!ad?.campaignId) return;
    const key = `${ad.campaignId}:${ad.event?.id}:${ad.surface}`;
    if (seenImpressions.has(key)) return;
    seenImpressions.add(key);
    queue.push({ campaignId: ad.campaignId, eventId: ad.event?.id, surface: ad.surface, kind: 'IMPRESSION' });
    if (queue.length >= 20) flush();
    else scheduleFlush();
}

export function trackAdClick(ad) {
    if (!ad?.campaignId) return;
    queue.push({ campaignId: ad.campaignId, eventId: ad.event?.id, surface: ad.surface, kind: 'CLICK' });
    flush();
}

/** Fires one impression when the element is ≥50% visible. */
export function useAdImpression(ad) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ad || !ref.current || typeof IntersectionObserver === 'undefined') return;
        const node = ref.current;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        queueAdImpression(ad);
                        observer.disconnect();
                        return;
                    }
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [ad]);

    return ref;
}
