// About: the 6 crew badges clip on one after another when they come into view, and "Tell your people" copies our
// link: its tab drops off the flyer, "Link copied" shows in the gap, and the tab fades back in.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const crew = document.querySelector('[data-crew]');
  if (crew && !reduce && 'IntersectionObserver' in window) {
    crew.classList.add('wait');
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      requestAnimationFrame(() => { crew.classList.add('in'); crew.classList.remove('wait'); });
    }, { threshold: 0.35 });
    io.observe(crew);
  }

  const tab = document.querySelector('[data-copy]');
  if (!tab) return;
  const face = tab.querySelector('.tab-face'), status = document.querySelector('[data-copied]');
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return; } catch (_) { /* fall back below */ }
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
    (document.querySelector('.v12') || document.body).append(t); t.select();
    try { document.execCommand('copy'); } catch (_) { /* nothing else to try */ }
    t.remove();
  };
  let busy = false;
  tab.addEventListener('click', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    await copy(tab.dataset.copy);
    status.textContent = 'Link copied';
    tab.classList.add('torn');
    const done = () => { tab.classList.remove('torn'); face.getAnimations().forEach((a) => a.cancel()); status.textContent = ''; busy = false; };
    if (reduce) { face.style.opacity = 0; setTimeout(() => { face.style.opacity = ''; done(); }, 1600); return; }
    // torn off: it tips at the top edge, then falls away under its own weight
    face.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(8px) rotate(-6deg)', opacity: 1, offset: 0.22 },
      { transform: 'translateY(150%) rotate(-16deg)', opacity: 0 }], { duration: 760, easing: 'cubic-bezier(.45, 0, .8, .35)', fill: 'forwards' });
    setTimeout(() => {
      tab.classList.remove('torn');   // "Link copied" fades out as the tab fades back in, in place
      face.animate([{ transform: 'none', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }).onfinish = done;
    }, 1900);
  });
})();
