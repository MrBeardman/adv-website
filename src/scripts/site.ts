/**
 * Shared behaviour for every page. Section-specific scripts live next to their section.
 * Everything degrades gracefully: without JS the content is fully visible and usable, with
 * prefers-reduced-motion the movement is dropped (see site.css) and every scene shows its final state.
 */
import { initStream } from './stream';
import { countUp } from './count';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** One passive scroll/resize listener for everything that follows scroll position (rAF-throttled). */
const scrollJobs: (() => void)[] = [];
export function onScroll(job: () => void) {
  scrollJobs.push(job);
  job();
}
let ticking = false;
const runJobs = () => {
  ticking = false;
  scrollJobs.forEach((j) => j());
};
const schedule = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(runJobs);
  }
};
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });

// 1. Reveal: [data-reveal] arrives blurred and settles sharp, once. The attribute is removed after
//    the reveal so it no longer overrides the element's own transitions (hover lift, spotlight).
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const done = (el: HTMLElement) => {
    el.removeAttribute('data-reveal');
    el.classList.remove('is-in');
  };
  if (!('IntersectionObserver' in window) || reduceMotion) {
    els.forEach(done);
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add('is-in');
        io.unobserve(el);
        const i = Number(getComputedStyle(el).getPropertyValue('--i')) || 0;
        window.setTimeout(() => done(el), i * 90 + 1000);
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

// 2. Headline line reveals: [data-lines] holds .adv-line > span rows (authored in the markup).
function initLines() {
  const els = document.querySelectorAll<HTMLElement>('[data-lines]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-lines-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-lines-in');
        io.unobserve(e.target);
      }),
    { threshold: 0.2 },
  );
  els.forEach((el) => io.observe(el));
}

// 3. Scroll-lit words: [data-lit] text is split into words; each word brightens as the block
//    scrolls through the middle of the viewport.
function initLit() {
  document.querySelectorAll<HTMLElement>('[data-lit]').forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode as Text);
    const words: HTMLElement[] = [];
    texts.forEach((t) => {
      const frag = document.createDocumentFragment();
      t.data.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part);
        else {
          const w = document.createElement('span');
          w.className = 'adv-w';
          w.textContent = part;
          frag.append(w);
          words.push(w);
        }
      });
      t.replaceWith(frag);
    });
    if (reduceMotion) return;
    const n = words.length;
    onScroll(() => {
      const r = el.getBoundingClientRect();
      const vh = innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = (vh * 0.82 - r.top) / (r.height + vh * 0.3);
      const lit = Math.max(0, Math.min(1, p)) * (n + 2);
      words.forEach((w, i) => w.style.setProperty('--lit', Math.max(0, Math.min(1, lit - i)).toFixed(2)));
    });
  });
}

// 4. Header: solid once scrolled, hides on the way down, returns on the way up. Mobile drawer.
function initHeader() {
  const hd = document.querySelector<HTMLElement>('[data-header]');
  if (!hd) return;
  let lastY = scrollY;
  onScroll(() => {
    const y = scrollY;
    hd.classList.toggle('is-scrolled', y > 12);
    if (y > lastY + 4 && y > 480 && !hd.classList.contains('is-open')) hd.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 480) hd.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 4) lastY = y;
  });
  // Services menu: hover intent with a fine pointer, the caret for touch and keyboard, Esc / outside closes.
  const subLi = hd.querySelector<HTMLElement>('[data-sub]');
  if (subLi) {
    const caret = subLi.querySelector<HTMLButtonElement>('.adv-header__caret')!;
    let timer = 0;
    const setSub = (open: boolean) => {
      subLi.classList.toggle('is-open', open);
      caret.setAttribute('aria-expanded', String(open));
    };
    if (finePointer) {
      subLi.addEventListener('pointerenter', () => {
        clearTimeout(timer);
        setSub(true);
      });
      subLi.addEventListener('pointerleave', () => {
        timer = window.setTimeout(() => setSub(false), 200);
      });
    }
    caret.addEventListener('click', () => setSub(!subLi.classList.contains('is-open')));
    subLi.addEventListener('focusout', (e) => {
      if (!subLi.contains(e.relatedTarget as Node)) setSub(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && subLi.classList.contains('is-open')) {
        setSub(false);
        caret.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (!subLi.contains(e.target as Node)) setSub(false);
    });
  }
  const burger = hd.querySelector<HTMLButtonElement>('[data-burger]');
  if (!burger) return;
  const set = (open: boolean) => {
    hd.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? burger.dataset.close! : burger.dataset.open!);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => set(!hd.classList.contains('is-open')));
  hd.querySelectorAll('[data-drawer] a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hd.classList.contains('is-open')) {
      set(false);
      burger.focus();
    }
  });
  matchMedia('(min-width: 1001px)').addEventListener('change', (e) => e.matches && set(false));
}

// 5. Live scenes ([data-live]) loop in CSS; they pause while off screen. Every CSS loop on the page
//    also pauses while the tab is hidden (html.is-away, see site.css).
function initLive() {
  document.addEventListener('visibilitychange', () =>
    document.documentElement.classList.toggle('is-away', document.hidden),
  );
  const scenes = [...document.querySelectorAll<HTMLElement>('[data-live]')];
  if (!scenes.length || reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('is-paused', !e.isIntersecting)),
  );
  scenes.forEach((s) => {
    s.classList.add('is-paused');
    io.observe(s);
  });
}

// 6. Card spotlight: the pointer position inside each matte card, as --mx/--my.
function initSpotlight() {
  if (!finePointer) return;
  document.querySelectorAll<HTMLElement>('.adv-card').forEach((c) =>
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    }),
  );
}

// 7. Count-ups (scripts/count.ts) when visible; [data-count-manual] ones are started by their section.
function initCounters() {
  const els = document.querySelectorAll<HTMLElement>('[data-count]:not([data-count-manual])');
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        countUp(el, Number(el.dataset.delay || 0));
      }),
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}

// 8. "Play once" scenes: [data-play] gets .is-playing the first time it is half in view
//    (drawn charts, bar meters, timelines). Reduced motion: final state at once.
function initPlay() {
  const els = document.querySelectorAll<HTMLElement>('[data-play]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-playing'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-playing');
        io.unobserve(e.target);
      }),
    { threshold: 0.35 },
  );
  els.forEach((el) => {
    el.classList.add('is-armed');
    io.observe(el);
  });
}

// 9. Typewriter: [data-type] cycles through data-words (JSON array); the first word is in the markup.
function initType() {
  document.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => {
    const words: string[] = JSON.parse(el.dataset.words || '[]');
    if (reduceMotion || words.length < 2) return;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);
    (async () => {
      let wi = 0;
      await sleep(3200);
      for (;;) {
        while (!visible || document.hidden) await sleep(400);
        const w = words[wi % words.length];
        for (let i = w.length; i >= 0; i--) {
          el.textContent = w.slice(0, i);
          await sleep(38);
        }
        await sleep(260);
        wi++;
        const next = words[wi % words.length];
        for (let i = 1; i <= next.length; i++) {
          el.textContent = next.slice(0, i);
          await sleep(78);
        }
        await sleep(2600);
      }
    })();
  });
}

// 10. Background mood follows scroll progress (--p on .adv-bg, 0 at the top, 1 at the bottom).
function initBackground() {
  const bg = document.querySelector<HTMLElement>('.adv-bg');
  if (!bg || reduceMotion) return;
  onScroll(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bg.style.setProperty('--p', (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(4));
  });
}

initReveal();
initLines();
initLit();
initHeader();
initLive();
initSpotlight();
initCounters();
initPlay();
initType();
initBackground();
if (document.querySelector('[data-stream]')) initStream({ reduceMotion, onScroll });
else {
  // Pages without the stream: a section node lights when it scrolls into view.
  const kick = document.querySelectorAll<HTMLElement>('.adv-node');
  if (reduceMotion || !('IntersectionObserver' in window)) kick.forEach((k) => k.classList.add('is-lit'));
  else {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-lit');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -25% 0px' },
    );
    kick.forEach((k) => io.observe(k));
  }
}
