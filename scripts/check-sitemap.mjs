#!/usr/bin/env node
/**
 * Sitemap integrity check.
 *
 * Fetches every <loc> in the sitemap and fails if any of them is not a 200.
 *
 * This exists because the hand-maintained sitemap drifted badly: it advertised four
 * /editorial URLs that 404'd, two cities we do not operate in, and omitted a live city hub.
 * A sitemap full of 404s is worse than no sitemap — it is a direct quality signal to Google
 * that the site does not know what it publishes.
 *
 * Usage:
 *   node scripts/check-sitemap.mjs                      # against http://localhost:5173
 *   node scripts/check-sitemap.mjs https://pxispace.com # against a deployed origin
 *
 * Exit codes: 0 = every URL is 200. 1 = at least one is not (or the sitemap is unreachable).
 */

const origin = (process.argv[2] || process.env.SITEMAP_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;

/** Redirects are a failure here, not a success: a sitemap must list final URLs only. */
async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: controller.signal });
    // Some hosts do not implement HEAD on rendered routes; fall back to a GET.
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'manual', signal: controller.signal });
    }
    return { url, status: res.status, location: res.headers.get('location') || null };
  } catch (err) {
    return { url, status: 0, error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const sitemapUrl = `${origin}/sitemap.xml`;
  process.stdout.write(`Checking ${sitemapUrl}\n`);

  let xml;
  try {
    const res = await fetch(sitemapUrl);
    if (!res.ok) {
      console.error(`FAIL  sitemap.xml returned ${res.status}`);
      process.exit(1);
    }
    xml = await res.text();
  } catch (err) {
    console.error(`FAIL  could not fetch sitemap: ${err?.message || err}`);
    process.exit(1);
  }

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length === 0) {
    console.error('FAIL  sitemap contains no <loc> entries');
    process.exit(1);
  }

  // When checking a non-production origin, rewrite the production host in each <loc> so we
  // are actually testing the build in front of us rather than what is already deployed.
  const targets = locs.map((loc) => {
    try {
      const u = new URL(loc);
      const o = new URL(origin);
      if (u.origin !== o.origin) return `${o.origin}${u.pathname}${u.search}`;
      return loc;
    } catch {
      return loc;
    }
  });

  const results = await mapLimit(targets, CONCURRENCY, probe);

  const bad = results.filter((r) => r.status !== 200);
  const dupes = targets.filter((t, i) => targets.indexOf(t) !== i);

  for (const r of results) {
    const mark = r.status === 200 ? 'ok  ' : 'FAIL';
    const extra = r.location ? ` -> ${r.location}` : r.error ? ` (${r.error})` : '';
    if (r.status !== 200) console.error(`${mark} ${r.status} ${r.url}${extra}`);
  }

  if (dupes.length) {
    console.error(`FAIL  duplicate <loc> entries: ${[...new Set(dupes)].join(', ')}`);
  }

  process.stdout.write(`\n${results.length - bad.length}/${results.length} URLs returned 200\n`);

  if (bad.length || dupes.length) {
    console.error(`\n${bad.length} bad URL(s), ${new Set(dupes).size} duplicate(s). Sitemap must contain only live, canonical, non-redirecting URLs.`);
    process.exit(1);
  }
  process.stdout.write('Sitemap is clean.\n');
}

main();
