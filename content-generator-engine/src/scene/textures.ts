// Every word in the film is drawn into a canvas and printed onto a 3D object
// (ticket, card, album page, print lip, stamp ink, passport page). Nothing is
// an overlay. Each hook loads through useAsyncTexture so the frame waits for it.

import { staticFile } from 'remotion';
import * as THREE from 'three';
import { loadImageTexture, useAsyncTexture } from '../lib/asyncTexture';
import { fontsReady, mono, serif } from '../lib/fonts';
import { ALBUM, fitPx, PAIN_CARD, PASSPORT, PRINT, STAMP, TICKET } from '../lib/layout';
import { asset } from '../lib/storyboard';

const INK = '#16130f';

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
};

const toTexture = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });

/** Same texture for the same key; the key carries everything the drawing depends on. */
const useDrawn = <T extends unknown[]>(parts: T, draw: (...args: T) => HTMLCanvasElement | Promise<HTMLCanvasElement>) =>
  useAsyncTexture(JSON.stringify(parts), (key) =>
    fontsReady.then(() => draw(...(JSON.parse(key) as T))).then(toTexture),
  );

export const usePhoto = (file: string) => useAsyncTexture(staticFile(asset(file)), loadImageTexture);
export const useMark = () => useAsyncTexture(staticFile('brand/pxi-mark.png'), loadImageTexture);

/** Ticket front: title fitted to the width, meta in mono, stub with the price. Transparent ink on clear. */
export const useTicketPrint = (title: string, meta: string[]) =>
  useDrawn<[string, string[]]>([title, meta], (t, m) => {
    const [W, H] = TICKET.canvas;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = INK;
    const left = 470;
    const px = fitPx(t, TICKET.titleWidthPx - 120, TICKET.titleMaxPx);
    ctx.font = `${px}px "${serif}"`;
    ctx.fillText(t, left, 300);
    ctx.font = `${TICKET.metaPx}px "${mono}"`;
    ctx.fillText(m[0], left, 440);
    ctx.fillText(m[1], left, 520);
    ctx.font = `34px "${mono}"`;
    ctx.globalAlpha = 0.7;
    ctx.fillText(m[3], left, 640);
    ctx.globalAlpha = 1;
    // Stub.
    ctx.save();
    ctx.translate(W * 0.9, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = `110px "${serif}"`;
    ctx.fillText(m[2], 0, 10);
    ctx.font = `30px "${mono}"`;
    ctx.fillText('admit one', 0, 70);
    ctx.restore();
    return c;
  });

/** A torn paper card with one line in serif. */
export const usePainCard = (text: string) =>
  useDrawn<[string]>([text], (t) => {
    const [W, H] = PAIN_CARD.canvas;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fitPx(t, W * 0.86, PAIN_CARD.px)}px "${serif}"`;
    ctx.fillText(t, W / 2, H / 2 + 8);
    return c;
  });

/** Print lip: a first name, handwritten-sized, "you" a touch bigger. */
export const useLip = (name: string) =>
  useDrawn<[string]>([name], (n) => {
    const [W, H] = PRINT.lipCanvas;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${n === 'you' ? PRINT.lipPx : PRINT.lipPx * 0.62}px "${serif}"`;
    ctx.fillText(n, W / 2, H / 2);
    return c;
  });

/** Album page: dark linen board, the count up top, avatars and who was there at the foot. */
export const useAlbumPage = (counterText: string, proof: string, avatarFiles: string[], proofOn: boolean) =>
  useDrawn<[string, string, string[], boolean]>([counterText, proof, avatarFiles, proofOn], async (count, p, avatars, on) => {
    const [W, H] = ALBUM.canvas;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#17150f';
    ctx.fillRect(0, 0, W, H);
    // Linen weave.
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    for (let x = 0; x < W; x += 5) ctx.fillRect(x, 0, 1, H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f2ece2';
    ctx.textAlign = 'center';
    ctx.font = `${ALBUM.headerPx}px "${serif}"`;
    ctx.fillText(count, W / 2, 190);
    if (on) {
      const imgs = await Promise.all(avatars.map((a) => loadImg(staticFile(asset(a)))));
      const r = 46;
      const total = imgs.length * (r * 1.5) + r * 0.5;
      let x = W / 2 - total / 2 + r;
      const y = H - 210;
      for (const img of imgs) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const s = Math.max((r * 2) / img.width, (r * 2) / img.height);
        ctx.drawImage(img, x - (img.width * s) / 2, y - (img.height * s) / 2, img.width * s, img.height * s);
        ctx.restore();
        ctx.strokeStyle = '#17150f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        x += r * 1.5;
      }
      ctx.fillStyle = '#f2ece2';
      ctx.font = `${fitPx(p, W * 0.62, ALBUM.proofPx)}px "${serif}"`;
      ctx.fillText(p, W / 2, H - 90);
    }
    return c;
  });

/** Fresh stamp ink: a double ring, "verified" across the middle, event and date round it. */
export const useStampInk = (top: string, middle: string, bottom: string, color: string) =>
  useDrawn<[string, string, string, string]>([top, middle, bottom, color], (t, m, b, col) => {
    const S = STAMP.canvas;
    const [c, ctx] = canvas(S, S);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${STAMP.topPx}px "${serif}"`;
    ctx.fillText(t, S / 2, S / 2 - 10);
    ctx.fillRect(S * 0.2, S / 2 + 70, S * 0.6, 5);
    ctx.font = `${fitPx(m, S * 0.56, STAMP.middlePx)}px "${serif}"`;
    ctx.fillText(m, S / 2, S / 2 - 150);
    ctx.font = `${STAMP.bottomPx}px "${mono}"`;
    ctx.fillText(b, S / 2, S / 2 + 145);
    // Worn ink: knock out specks.
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 900; i++) {
      const a = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const r2 = (Math.sin(i * 78.233) * 12345.678) % 1;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(Math.abs(a) * S, Math.abs(r2) * S, 3 + (i % 4), 2 + (i % 3));
    }
    return c;
  });

const PAST_INKS = ['#3d5a8a', '#4f6f52', '#7a4b6a', '#5c5c5c', '#8a5a3d', '#3d6f78', '#6a5a8a', '#5a6f3d'];

/** Passport page: guilloche paper, earlier stamps (the track record), the end line and url at the foot. */
export const usePassportPage = (pastStamps: number, city: string, endLines: [string, string], url: string) =>
  useDrawn<[number, string, [string, string], string]>([pastStamps, city, endLines, url], (n, cityName, lines, u) => {
    const [W, H] = PASSPORT.canvas;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#ece5d6';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(90, 110, 120, 0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const y = 60 + i * 30 + Math.sin(x / 70 + i * 0.6) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Earlier stamps round the edges, faded, each a past album.
    const spots = [
      [240, 330, -0.3], [1040, 300, 0.25], [210, 1090, 0.2], [1070, 1080, -0.2],
      [300, 1500, -0.12], [990, 1520, 0.3], [640, 230, 0.05], [650, 1470, -0.25],
    ];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n && i < spots.length; i++) {
      const [x, y, rot] = spots[i];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = PAST_INKS[i];
      ctx.fillStyle = PAST_INKS[i];
      ctx.lineWidth = 7;
      if (i % 2) ctx.strokeRect(-120, -80, 240, 160);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, 110, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = `42px "${serif}"`;
      ctx.fillText('verified', 0, -6);
      ctx.font = `22px "${mono}"`;
      ctx.fillText(`${cityName} · album ${String(i + 1).padStart(2, '0')}`, 0, 38);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK;
    ctx.font = `${PASSPORT.endPx}px "${serif}"`;
    ctx.fillText(lines[0], W / 2, H - 330);
    ctx.fillText(lines[1], W / 2, H - 240);
    ctx.font = `${PASSPORT.urlPx}px "${mono}"`;
    ctx.fillText(u, W / 2, H - 130);
    return c;
  });
