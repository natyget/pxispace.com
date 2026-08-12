#!/usr/bin/env node
/**
 * PXI icon builder — regenerates every favicon / app icon from ONE source.
 *
 * Source of truth: public/app-icon.png (the circular purple badge on
 * transparency). Nothing here redraws artwork; it only resamples and, where a
 * surface forces a square, paints the badge's OWN gradient behind it.
 *
 * THE ICON LAW
 *  - Browser tabs do NOT mask. Tab favicons stay a CIRCLE on transparency, so a
 *    tab never shows clipped purple corners.
 *  - Surfaces that force a square (iOS home screen, Android adaptive/maskable,
 *    Google's knowledge panel) must NEVER ship transparency: the host composites
 *    it on white and the badge floats in a white box. Those get the square
 *    filled with the badge's own purple gradient.
 *  - Small sizes are sharpened on the way down. The mark is dark purple on a
 *    mid purple disc (~1.5:1), so a plain box filter averages it into a smear.
 *
 * Run: node scripts/build-icons.mjs
 */

import { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const SOURCE = path.join(PUBLIC, 'app-icon.png');

/** Tab/browser favicons — circle on transparency, never a filled square. */
const CIRCLE_SIZES = [16, 32, 48, 96, 192, 512];
/** Square, host-masked surfaces — purple filled, no transparency. */
const APPLE_TOUCH_SIZE = 180;
const MASKABLE_SIZES = [192, 512];
/** Android adaptive icons crop to a circle inscribed in the middle ~80%. */
const MASKABLE_SAFE_RATIO = 0.78;
/** Sizes packed into favicon.ico (what Google Search fetches first). */
const ICO_SIZES = [16, 32, 48];

/**
 * Read the badge's own gradient off the source so a filled square is the same
 * material as the disc — a hand-picked hex drifts the moment the art changes.
 */
async function sampleDiscGradient() {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const y = Math.floor(height / 2);
  const at = (x) => {
    const i = (y * width + x) * channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  const opaque = (x) => at(x).a > 200;

  let left = 0;
  while (left < width - 1 && !opaque(left)) left += 1;
  let right = width - 1;
  while (right > 0 && !opaque(right)) right -= 1;

  const from = at(left);
  const to = at(right);
  const hex = (c) => `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return { from: hex(from), to: hex(to), mid: hex({
    r: Math.round((from.r + to.r) / 2),
    g: Math.round((from.g + to.g) / 2),
    b: Math.round((from.b + to.b) / 2),
  }) };
}

function gradientSquare(size, from, to) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
           <stop offset="0" stop-color="${from}"/>
           <stop offset="1" stop-color="${to}"/>
         </linearGradient>
       </defs>
       <rect width="${size}" height="${size}" fill="url(#g)"/>
     </svg>`,
  );
}

/** Downsample the badge. Small sizes get an unsharp pass or the mark smears. */
async function badgeAt(size) {
  let pipeline = sharp(SOURCE).resize(size, size, {
    kernel: 'lanczos3',
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (size <= 96) pipeline = pipeline.sharpen({ sigma: 0.6, m1: 1, m2: 3 });
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Minimal ICO container with PNG-compressed frames (universally supported since
 * Vista). sharp cannot write .ico, and this is the file Google fetches first.
 */
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(16 * frames.length);
  let offset = header.length + directory.length;
  frames.forEach((frame, i) => {
    const at = i * 16;
    // 256px is encoded as 0 in the ICO directory; every size we ship is < 256.
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, at + 0); // width
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, at + 1); // height
    directory.writeUInt8(0, at + 2); // palette size (0 = truecolor)
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // color planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(frame.data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += frame.data.length;
  });

  return Buffer.concat([header, directory, ...frames.map((f) => f.data)]);
}

async function main() {
  const { from, to, mid } = await sampleDiscGradient();
  console.log(`Badge gradient sampled: ${from} → ${to} (mid ${mid})`);

  // 1. Tab favicons — circle on transparency.
  for (const size of CIRCLE_SIZES) {
    const data = await badgeAt(size);
    await writeFile(path.join(PUBLIC, `icon-${size}.png`), data);
    console.log(`  icon-${size}.png (circle, transparent)`);
  }

  // 2. favicon.ico — the file Google Search asks for before it reads any <link>.
  const icoFrames = [];
  for (const size of ICO_SIZES) {
    icoFrames.push({ size, data: await badgeAt(size) });
  }
  await writeFile(path.join(PUBLIC, 'favicon.ico'), buildIco(icoFrames));
  console.log(`  favicon.ico (${ICO_SIZES.join('/')} frames)`);

  // 3. Apple touch icon — iOS ignores alpha and masks to a squircle, so the
  //    square is filled with the badge's gradient (it used to be black).
  await sharp(gradientSquare(APPLE_TOUCH_SIZE, from, to))
    .composite([{ input: await badgeAt(APPLE_TOUCH_SIZE) }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, `icon-${APPLE_TOUCH_SIZE}.png`));
  console.log(`  icon-${APPLE_TOUCH_SIZE}.png (apple-touch, purple square)`);

  // 4. Android maskable — the launcher crops to its own shape, so the badge is
  //    inset into the safe zone and the bleed is the same purple.
  for (const size of MASKABLE_SIZES) {
    const inner = Math.round(size * MASKABLE_SAFE_RATIO);
    const pad = Math.round((size - inner) / 2);
    await sharp(gradientSquare(size, from, to))
      .composite([{ input: await badgeAt(inner), top: pad, left: pad }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, `maskable-${size}.png`));
    console.log(`  maskable-${size}.png (purple square, ${MASKABLE_SAFE_RATIO * 100}% safe zone)`);
  }

  // 5. Square logo for Google's knowledge panel / Organization JSON-LD. Google
  //    composites schema logos on white, so this one must not be transparent.
  await sharp(gradientSquare(512, from, to))
    .composite([{ input: await badgeAt(Math.round(512 * 0.86)), top: 36, left: 36 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'logo-square.png'));
  console.log('  logo-square.png (schema.org logo, purple square)');

  console.log(`\nBrand fill in use: ${mid} — keep theme_color in sync.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
