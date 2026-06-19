/** Read-only reaction / comment display (mirrors mobile album thread cards). */

export const REACTION_BAR_SUGGESTIONS = ['❤️', '🔥', '😂', '🤩', '👏'];

const EMOJI_SHORTCODES = {
  fire: '🔥',
  heart: '❤️',
  '100': '💯',
  camera: '📸',
  skull: '💀',
  joy: '😂',
  goat: '🐐',
  crown: '👑',
  zap: '⚡',
  star: '🤩',
  melt: '🫠',
  sob: '😭',
  salute: '🫡',
  moai: '🗿',
  rocket: '🚀',
  gem: '💎',
  handshake: '🤝',
  rofl: '🤣',
  mindblown: '🤯',
  heart_eyes_cat: '😻',
  dove: '🕊️',
  toast: '🥂',
  thumbsup: '👍',
  thumbsdown: '👎',
  clap: '👏',
  smile: '😊',
  grinning: '😀',
  slight_smile: '🙂',
  heart_eyes: '😍',
  eyes: '👀',
  party: '🎉',
  money: '💰',
  pill: '💊',
  wilted: '🥲',
};

export function normalizeEmojiForDisplay(emoji) {
  if (!emoji || typeof emoji !== 'string') return '❤️';
  const t = emoji.trim();
  if (/\p{Emoji}/u.test(t)) return t;
  const lower = t.toLowerCase().replace(/^:|:$/g, '');
  return EMOJI_SHORTCODES[lower] ?? EMOJI_SHORTCODES[t] ?? t;
}

/** Merge server counts with suggestion emojis — mirrors mobile `AlbumReactionBar` displayList. */
export function buildReactionDisplayList(item) {
  const raw = (item?.reactionCounts ?? []).filter((r) => (r.count ?? 0) > 0);
  const up = item?.reactions?.upvotes ?? 0;
  const mapped = raw.map((r) => ({
    emoji: normalizeEmojiForDisplay(r.emoji),
    count: r.count ?? 0,
  }));
  if (mapped.length === 0 && up > 0) {
    mapped.push({ emoji: '🔥', count: up });
  }
  const combined = [...mapped];
  REACTION_BAR_SUGGESTIONS.forEach((suggestionEmoji) => {
    if (!combined.some((r) => r.emoji === suggestionEmoji)) {
      combined.push({ emoji: suggestionEmoji, count: 0 });
    }
  });
  return combined;
}

/** @deprecated Use buildReactionDisplayList for reaction bar parity. */
export function getThreadReactionPills(item) {
  const list = buildReactionDisplayList(item).filter((r) => r.count > 0);
  const sorted = [...list].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return sorted.length > 5 ? sorted.slice(0, 4) : sorted;
}

export function getLastThreadComment(item) {
  const list = item?.comments;
  if (!Array.isArray(list) || list.length === 0) return null;
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted[sorted.length - 1] ?? null;
}
