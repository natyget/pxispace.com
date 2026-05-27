/** Read-only reaction / comment display (mirrors mobile album thread cards). */

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
  thumbsup: '👍',
  thumbsdown: '👎',
};

export function normalizeEmojiForDisplay(emoji) {
  if (!emoji || typeof emoji !== 'string') return '❤️';
  const t = emoji.trim();
  if (/\p{Emoji}/u.test(t)) return t;
  const lower = t.toLowerCase().replace(/^:|:$/g, '');
  return EMOJI_SHORTCODES[lower] ?? t;
}

export function getThreadReactionPills(item) {
  const raw = (item?.reactionCounts ?? []).filter((r) => (r.count ?? 0) > 0);
  const sorted = [...raw].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const mapped = sorted.map((r) => ({
    emoji: normalizeEmojiForDisplay(r.emoji),
    count: r.count ?? 0,
  }));
  return mapped.length > 5 ? mapped.slice(0, 4) : mapped;
}

export function getLastThreadComment(item) {
  const list = item?.comments;
  if (!Array.isArray(list) || list.length === 0) return null;
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted[sorted.length - 1] ?? null;
}
