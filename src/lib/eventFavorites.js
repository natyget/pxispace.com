import { api } from '../services/api';

const LOCAL_KEY = 'pxi_web_event_favorites';
const MIGRATED_KEY = 'pxi_web_event_favorites_migrated';

function toFavoriteSet(eventIds) {
  return new Set((eventIds ?? []).map(String));
}

function resolveLoggedIn(isLoggedIn) {
  if (typeof isLoggedIn === 'boolean') return isLoggedIn;
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem('pxi_token');
}

function readLocalFavoriteIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeLocalFavoriteIds(set) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([...set]));
}

async function fetchServerFavoriteEventIds() {
  const data = await api.get('/api/users/me/event-favorites');
  return toFavoriteSet(data.eventIds);
}

async function syncLocalFavoritesToServer(localIds) {
  if (localIds.size === 0) {
    return fetchServerFavoriteEventIds();
  }
  const data = await api.post('/api/users/me/event-favorites/sync', {
    eventIds: [...localIds],
  });
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LOCAL_KEY);
  }
  return toFavoriteSet(data.eventIds);
}

function toggleLocalFavoriteEventId(id, isFavorite) {
  const next = new Set(readLocalFavoriteIds());
  const sid = String(id);
  if (isFavorite) next.delete(sid);
  else next.add(sid);
  writeLocalFavoriteIds(next);
  return next;
}

/** @deprecated use loadFavoriteEventIds */
export function readFavoriteEventIds() {
  return readLocalFavoriteIds();
}

/**
 * Load favorites: localStorage for guests, server for logged-in users.
 * On first login, merges local favorites into the DB once.
 */
export async function loadFavoriteEventIds(isLoggedIn) {
  if (typeof window === 'undefined') return new Set();
  if (!resolveLoggedIn(isLoggedIn)) {
    return readLocalFavoriteIds();
  }

  try {
    const migrated = window.localStorage.getItem(MIGRATED_KEY);
    if (migrated === '1') {
      return fetchServerFavoriteEventIds();
    }

    const localIds = readLocalFavoriteIds();
    const merged = await syncLocalFavoritesToServer(localIds);
    window.localStorage.setItem(MIGRATED_KEY, '1');
    return merged;
  } catch {
    if (window.localStorage.getItem(MIGRATED_KEY) === '1') return new Set();
    return readLocalFavoriteIds();
  }
}

export async function addFavoriteEventId(id) {
  const data = await api.post(`/api/users/me/event-favorites/${encodeURIComponent(String(id))}`);
  return toFavoriteSet(data.eventIds);
}

export async function removeFavoriteEventId(id) {
  const data = await api.delete(`/api/users/me/event-favorites/${encodeURIComponent(String(id))}`);
  return toFavoriteSet(data.eventIds);
}

export async function toggleFavoriteEventId(id, isFavorite, isLoggedIn) {
  if (!resolveLoggedIn(isLoggedIn)) {
    return toggleLocalFavoriteEventId(id, isFavorite);
  }
  return isFavorite ? removeFavoriteEventId(id) : addFavoriteEventId(id);
}
