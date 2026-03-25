/**
 * OpenStreetMap embed URL (bbox only; marker query param is unreliable).
 */
export function singleEventMapEmbedSrc(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  const pad = 0.02;
  const bboxParam = `${lo - pad},${la - pad},${lo + pad},${la + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bboxParam)}&layer=mapnik`;
}
