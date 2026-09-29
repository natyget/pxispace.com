// Loads a classic script once per document. The redesign's vendor bundles (icon data,
// the bundled app components on window.PXI) are plain IIFEs that set a global, so they
// are served from /public/site/vendor and injected in the demo's order rather than bundled.

const pending = new Map();

export function loadScript(src) {
  if (!pending.has(src)) {
    pending.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = () => {
          pending.delete(src);
          s.remove();
          reject(new Error(`failed to load ${src}`));
        };
        document.head.appendChild(s);
      }),
    );
  }
  return pending.get(src);
}
