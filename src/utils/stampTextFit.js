/**
 * Shrink-to-fit text measurement for stamp SVG labels — mirrors mobile's
 * Skia-based `useTextFitter` (StampShapeGraphic.tsx). Replaces the old
 * `textLength`/`lengthAdjust="spacingAndGlyphs"` approach, which forced text
 * to stretch or squish to an exact length regardless of its natural width
 * (short strings got ugly letter-spacing, long ones overlapped/squished).
 * Instead: measure the text's natural width, shrink font-size to fit if it
 * overflows, and only truncate with an ellipsis as a last resort.
 */

const MIN_FONT_SIZE = 5;

let measureCtx;
function getMeasureCtx() {
    if (typeof document === 'undefined') return null;
    if (!measureCtx) {
        measureCtx = document.createElement('canvas').getContext('2d');
    }
    return measureCtx;
}

/** SSR-safe fallback when a canvas 2D context isn't available yet (avg glyph-width heuristic). */
function estimateWidth(text, fontPx, bold) {
    const ratio = 0.56;
    return text.length * fontPx * ratio * (bold ? 1.08 : 1);
}

function measureWidth(text, fontPx, family, bold) {
    const ctx = getMeasureCtx();
    if (!ctx) return estimateWidth(text, fontPx, bold);
    ctx.font = `${bold ? 'bold ' : ''}${fontPx}px ${family}`;
    return ctx.measureText(text).width;
}

/**
 * Fits `text` into `maxWidth` by shrinking `desiredSize` (metrics scale
 * linearly with font size), then truncates with an ellipsis if it's still
 * too wide at the minimum readable size. Never stretches short text.
 */
export function fitStampText(text, desiredSize, maxWidth, family, bold = false) {
    if (!text) return { text: '', size: desiredSize };
    const widthAtDesired = measureWidth(text, desiredSize, family, bold);
    if (widthAtDesired <= maxWidth || widthAtDesired <= 0) {
        return { text, size: desiredSize };
    }

    const shrunk = (maxWidth / widthAtDesired) * desiredSize;
    if (shrunk >= MIN_FONT_SIZE) {
        return { text, size: shrunk };
    }

    let trimmed = text;
    while (trimmed.length > 1 && measureWidth(`${trimmed}…`, MIN_FONT_SIZE, family, bold) > maxWidth) {
        trimmed = trimmed.slice(0, -1);
    }
    const finalText = trimmed.length < text.length ? `${trimmed}…` : text;
    return { text: finalText, size: MIN_FONT_SIZE };
}

/** Per-character advance widths at `sizePx` — for laying a heading out glyph-by-glyph along a curve. */
export function stampCharWidths(text, sizePx, family, bold = false) {
    return Array.from(text).map((ch) => measureWidth(ch, sizePx, family, bold));
}
