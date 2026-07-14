/**
 * Branch Web SDK — install-handoff links (deferred deep linking).
 *
 * Lazy-loads the official Branch web snippet (https://cdn.branch.io/branch-latest.min.js)
 * on first use, inits with the public NEXT_PUBLIC_BRANCH_KEY, and exposes
 * `createBranchInstallLink()` which mints a Branch link carrying the deep-link URL
 * so a store install can route the user back to the right screen post-install.
 *
 * Design constraints:
 * - Client-side only (all entry points guard `typeof window`).
 * - Dependency-free: the loader snippet is inlined; no npm package.
 * - Never blocks the caller: every path resolves within LINK_TIMEOUT_MS and
 *   resolves `null` on any error/timeout so callers keep their existing fallback.
 * - Single memoized init — the SDK is loaded and initialized at most once.
 */

const BRANCH_SDK_URL = 'https://cdn.branch.io/branch-latest.min.js';
const LINK_TIMEOUT_MS = 2500;

let branchInitPromise = null;

/**
 * Official Branch web snippet (inlined, un-minified variable names kept):
 * stubs the `branch` API onto `window` with a call queue, then injects the
 * async script tag. Queued calls (init/link/...) replay once the SDK loads.
 */
function injectBranchSnippet() {
  /* eslint-disable */
  (function (b, r, a, n, c, h, _, s, d, k) {
    if (!b[n] || !b[n]._q) {
      for (; s < _.length; ) c(h, _[s++]);
      d = r.createElement(a);
      d.async = 1;
      d.src = BRANCH_SDK_URL;
      k = r.getElementsByTagName(a)[0];
      k.parentNode.insertBefore(d, k);
      b[n] = h;
    }
  })(
    window,
    document,
    'script',
    'branch',
    function (b, r) {
      b[r] = function () {
        b._q.push([r, arguments]);
      };
    },
    { _q: [], _v: 1 },
    'addListener banner closeBanner closeJourney data deepview deepviewCta first init link logout removeListener setBranchViewData setIdentity track trackCommerceEvent logEvent disableTracking getBrowserFingerprintId crossPlatformIds lastAttributedTouchData setAPIResponseCallback qrCode setRequestMetaData setAPIUrl getAPIUrl setDMAParamsForEEA'.split(
      ' ',
    ),
    0,
  );
  /* eslint-enable */
}

/**
 * Load + init the Branch SDK exactly once. Resolves to the `window.branch`
 * object on success, or `null` when unavailable (SSR, missing key, init error).
 * If the CDN script never loads, the returned promise simply never settles —
 * callers are protected by the timeout in `createBranchInstallLink`.
 */
function ensureBranch() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const key = process.env.NEXT_PUBLIC_BRANCH_KEY;
  if (!key) return Promise.resolve(null);

  if (!branchInitPromise) {
    branchInitPromise = new Promise((resolve) => {
      try {
        injectBranchSnippet();
        window.branch.init(key, (err) => {
          resolve(err ? null : window.branch);
        });
      } catch {
        resolve(null);
      }
    });
  }
  return branchInitPromise;
}

/** Resolve `promise`, or `null` after `ms` — never rejects. */
function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/**
 * Create a Branch install link wrapping the given deep-link/canonical URL.
 *
 * @param {{ url: string, feature?: string }} params
 * @returns {Promise<string|null>} the Branch link, or `null` on any
 *   error/timeout (2.5s cap) — callers must keep their existing fallback.
 */
export async function createBranchInstallLink({ url, feature } = {}) {
  if (typeof window === 'undefined' || !url) return null;
  try {
    const link = await withTimeout(
      (async () => {
        const branch = await ensureBranch();
        if (!branch) return null;
        return new Promise((resolve) => {
          try {
            branch.link(
              {
                channel: 'pxispace-web',
                feature: feature || 'web-handoff',
                data: {
                  $canonical_url: url,
                  url,
                  $desktop_url: url,
                  $fallback_url: url,
                },
              },
              (err, branchUrl) => {
                resolve(err || typeof branchUrl !== 'string' || !branchUrl ? null : branchUrl);
              },
            );
          } catch {
            resolve(null);
          }
        });
      })(),
      LINK_TIMEOUT_MS,
    );
    return link || null;
  } catch {
    return null;
  }
}
