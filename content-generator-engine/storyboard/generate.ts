// props in → storyboard JSON + render out, with a critic on both sides.
//
//   node storyboard/generate.ts events/brunch.json [more.json …] [--stills] [--video] [--frames=0,20,76]
//
// 1. Plan: buildStoryboard() turns the event into a storyboard.
// 2. Critique the plan: copy, footage match, text sizes, the stranger test.
//    A failing plan never renders.
// 3. --stills: render key frames, measure them (is frame 0 white, is there an
//    orange cast, are the photos lit), critique, write a contact sheet.
// 4. --video: render the mp4 (only if both critiques pass).
//
// Everything lands in out/<storyboard id>/.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EventInput } from '../src/lib/storyboard.ts';
import { buildStoryboard, type Library } from './build.ts';
import { critiqueBoard, critiqueFrames, type FrameStats } from './critique.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const wantStills = args.includes('--stills') || args.includes('--video');
const wantVideo = args.includes('--video');

/** Frames worth looking at: hook, ticket, viewfinder, burst, album, you, stamp, end card. */
export const KEY_FRAMES = [0, 4, 20, 50, 76, 128, 152, 208, 236];
const framesArg = args.find((a) => a.startsWith('--frames='));
const frames = framesArg ? framesArg.slice(9).split(',').map(Number) : KEY_FRAMES;

const BROWSER = process.env.REMOTION_BROWSER;
const chromiumOptions = { gl: (process.env.REMOTION_GL ?? 'angle') as 'angle' | 'swangle' };

const library = JSON.parse(readFileSync(path.join(ROOT, 'footage/library.json'), 'utf8')) as Library;

const print = (s: string) => process.stdout.write(`${s}\n`);

/** Mean luma, red/blue over lit pixels, from a 54×96 downscale. */
const measure = (png: string, frame: number): FrameStats => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-vf', 'scale=54:96', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  let luma = 0;
  let r = 0;
  let b = 0;
  let lit = 0;
  for (let i = 0; i < raw.length; i += 3) {
    const y = (0.2126 * raw[i] + 0.7152 * raw[i + 1] + 0.0722 * raw[i + 2]) / 255;
    luma += y;
    if (y > 0.15) {
      r += raw[i];
      b += raw[i + 2];
      lit++;
    }
  }
  return { frame, meanLuma: luma / (raw.length / 3), redOverBlue: lit ? r / Math.max(1, b) : 1, litFraction: lit / (raw.length / 3) };
};

const contactSheet = (pngs: string[], out: string) => {
  const inputs = pngs.flatMap((p) => ['-i', p]);
  const scaled = pngs.map((_, i) => `[${i}:v]scale=360:640,pad=368:648:4:4:black[s${i}]`).join(';');
  const cols = Math.ceil(pngs.length / 2);
  const layout = pngs.map((_, i) => `${(i % cols) * 368}_${Math.floor(i / cols) * 648}`).join('|');
  const filter = `${scaled};${pngs.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${pngs.length}:layout=${layout}:fill=black`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, '-frames:v', '1', '-q:v', '3', out]);
};

const main = async () => {
  if (!files.length) {
    print('usage: node storyboard/generate.ts events/<event>.json [...] [--stills] [--video]');
    process.exit(1);
  }

  const plans = files.map((file) => {
    const event = JSON.parse(readFileSync(path.resolve(file), 'utf8')) as EventInput;
    const sb = buildStoryboard(event, library);
    const review = critiqueBoard(sb, library);
    const dir = path.join(ROOT, 'out', sb.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(sb, null, 2));
    writeFileSync(path.join(dir, 'critique-plan.json'), JSON.stringify(review, null, 2));
    print(`\n${sb.id}: plan ${review.pass ? 'PASS' : 'FAIL'}`);
    for (const i of review.issues) print(`  ${i.level} ${i.rule}: ${i.detail}`);
    print(`  sizes(px): ${Object.entries(review.sizes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    return { sb, review, dir };
  });

  if (!wantStills) return;

  const { bundle } = await import('@remotion/bundler');
  const { openBrowser, renderMedia, renderStill, selectComposition } = await import('@remotion/renderer');
  print('\nbundling…');
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), rootDir: ROOT, publicDir: path.join(ROOT, 'public') });
  const browser = await openBrowser('chrome', { browserExecutable: BROWSER ?? null, chromiumOptions });
  const common = { serveUrl, puppeteerInstance: browser, browserExecutable: BROWSER ?? null, chromiumOptions, logLevel: 'error' as const };

  for (const { sb, review, dir } of plans) {
    if (!review.pass) {
      print(`${sb.id}: plan failed the critic; fix the storyboard before rendering.`);
      continue;
    }
    const inputProps = sb as unknown as Record<string, unknown>;
    const composition = await selectComposition({ ...common, id: 'pxi-film', inputProps });

    const pngs: string[] = [];
    const stats: FrameStats[] = [];
    for (const frame of frames) {
      const output = path.join(dir, `frame-${String(frame).padStart(3, '0')}.png`);
      await renderStill({ ...common, composition, inputProps, frame, output, imageFormat: 'png' });
      pngs.push(output);
      stats.push(measure(output, frame));
      print(`  ${sb.id} frame ${frame}`);
    }
    const look = critiqueFrames(stats);
    writeFileSync(path.join(dir, 'critique-frames.json'), JSON.stringify({ ...look, stats }, null, 2));
    contactSheet(pngs, path.join(dir, 'contact-sheet.jpg'));
    print(`${sb.id}: frames ${look.pass ? 'PASS' : 'FAIL'}`);
    for (const i of look.issues) print(`  ${i.level} ${i.rule}: ${i.detail}`);

    if (wantVideo && look.pass) {
      const outputLocation = path.join(dir, `${sb.id}.mp4`);
      await renderMedia({
        ...common,
        composition,
        inputProps,
        codec: 'h264',
        crf: 16,
        pixelFormat: 'yuv420p',
        imageFormat: 'jpeg',
        jpegQuality: 92,
        concurrency: Number(process.env.REMOTION_CONCURRENCY ?? 2),
        outputLocation,
        onProgress: ({ progress }) => {
          const pct = Math.round(progress * 100);
          if (pct % 10 === 0) print(`  ${sb.id} render ${pct}%`);
        },
      });
      print(`${sb.id}: ${outputLocation}`);
    }
  }
  await browser.close({ silent: true });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
