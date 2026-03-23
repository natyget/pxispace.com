const KEY = 'pxi_web_event_favorites';

export function readFavoriteEventIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

export function writeFavoriteEventIds(set) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function toggleFavoriteEventId(id) {
  const s = readFavoriteEventIds();
  const sid = String(id);
  if (s.has(sid)) s.delete(sid);
  else s.add(sid);
  writeFavoriteEventIds(s);
  return s;
}
