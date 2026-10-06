// Fonts for the link-preview cards (/og/event, /og/go). next/og's renderer needs the font file itself.

/** Stack Sans Notch (the site's display face) as TTF from Google Fonts, subset to the card's own text. */
export async function loadDisplayFont(text) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@700&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}
