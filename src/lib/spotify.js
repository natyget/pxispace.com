/**
 * Build Spotify embed iframe src from a share URL (playlist, track, or album).
 */
export function spotifyEmbedSrc(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m = trimmed.match(/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/);
  if (!m) return null;
  const [, kind, spotifyId] = m;
  return `https://open.spotify.com/embed/${kind}/${spotifyId}?utm_source=generator`;
}
