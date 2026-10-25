/**
 * Homepage card stack: page-side controller (the job Hero.jsx + HeroScene.jsx did in the React site).
 *
 *  · Mounts the WebGL scene (HeroSceneGL, vanilla three.js) lazily, only with motion allowed and WebGL2.
 *    Three.js is a dynamic import, so reduced-motion and no-WebGL visitors never download it.
 *    The DOM poster stack stays until the scene is ready; a slow start skips the assembly ("settle").
 *  · The rotating caption follows the card at the front; pointer or focus in it holds the cycle.
 *  · Opening a card shows that service's panel in the hero. The URL hash is the source of truth
 *    (/#optimalizace-firmy), so back/forward and a shared link work; Esc closes; focus moves to the
 *    panel heading and returns to the open link on close.
 *  · Arrows (buttons and ←/→ keys while the hero has focus) step the stack; drag/swipe lives in the
 *    scene (direction lock, thresholds, spring back, click still opens, vertical swipe scrolls).
 *  · No WebGL / reduced motion: "is-static": every service is listed with its own link, the poster
 *    stays, opening a service is a plain crossfade.
 */
type Scene = {
  next(): void;
  prev(): void;
  setHeld(h: boolean): void;
  jumpTo(i: number): void;
  focus(o?: { immediate?: boolean }): void;
  unfocus(o?: { immediate?: boolean }): Promise<void>;
  readonly current: number;
  warmUp(): Promise<void>;
  start(o: { converge: boolean }): void;
  dispose(): void;
};

const CONVERGE_BUDGET_MS = 1500;

export function initStack(root: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-stack-canvas]')!;
  const copy = root.querySelector<HTMLElement>('[data-stack-copy]')!;
  const blocks = [...root.querySelectorAll<HTMLElement>('[data-stack-blocks] > li')];
  const openLink = root.querySelector<HTMLAnchorElement>('[data-stack-open]')!;
  const openName = root.querySelector<HTMLElement>('[data-stack-open-name]')!;
  const steps = root.querySelector<HTMLElement>('[data-stack-steps]')!;
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const live = root.querySelector<HTMLElement>('[data-stack-live]')!;
  const links = blocks.map((b) => b.querySelector<HTMLAnchorElement>('[data-open-i]')!);
  const hashes = links.map((a) => a.dataset.hash!);
  const titles = blocks.map((b) => b.querySelector('.adv-stack__blockTitle')!.textContent ?? '');
  const count = blocks.length;

  let scene: Scene | null = null;
  let index = 0;
  let openIdx = -1;
  let openedHere = false; // opened from this page (so "close" can step back through history)

  panels.forEach((p) =>
    p.querySelectorAll<HTMLElement>('[data-stagger]').forEach((n, k) => n.style.setProperty('--s', String(k))),
  );

  /* ── caption ── */
  const setIndex = (i: number) => {
    index = i;
    blocks.forEach((b, k) => b.classList.toggle('is-current', k === i));
    openLink.href = links[i].href;
    openName.textContent = `: ${titles[i]}`;
    live.textContent = titles[i];
  };

  /* ── open / close ── */
  const indexFromHash = () => hashes.indexOf(decodeURIComponent(location.hash.slice(1)));

  const show = (i: number, { instant = false } = {}) => {
    root.classList.toggle('is-instant', instant);
    const was = openIdx;
    openIdx = i;
    if (scene) {
      if (scene.current !== i) scene.jumpTo(i);
      if (was < 0) scene.focus({ immediate: instant || reduced });
    } else setIndex(i);
    root.dataset.open = String(i);
    copy.setAttribute('aria-hidden', 'true');
    panels.forEach((p, k) => {
      if (k !== i) {
        p.hidden = true;
        p.classList.remove('is-in');
      }
    });
    const p = panels[i];
    p.hidden = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        p.classList.add('is-in');
        p.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true });
      }),
    );
    if (!instant && was < 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  const hide = () => {
    if (openIdx < 0) return;
    const from = openIdx;
    openIdx = -1;
    root.classList.remove('is-instant');
    panels.forEach((p) => {
      p.classList.remove('is-in');
      p.hidden = true;
    });
    delete root.dataset.open;
    copy.removeAttribute('aria-hidden');
    scene?.unfocus({ immediate: reduced });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (scene ? openLink : links[from]).focus({ preventScroll: true })),
    );
  };

  const open = (i: number) => {
    if (openIdx === i) return;
    if (openIdx < 0) openedHere = true;
    history[openIdx < 0 ? 'pushState' : 'replaceState']({ stack: i }, '', `#${hashes[i]}`);
    show(i);
  };
  const close = () => {
    if (openIdx < 0) return;
    if (openedHere && history.state?.stack != null) {
      history.back(); // popstate does the rest, so the browser's back button and ours agree
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    hide();
  };
  addEventListener('popstate', () => {
    const i = indexFromHash();
    if (i >= 0) show(i);
    else {
      openedHere = false;
      hide();
    }
  });

  links.forEach((a, i) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      open(i);
    }),
  );
  openLink.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    open(index);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-panel-close]').forEach((b) => b.addEventListener('click', close));
  root.querySelectorAll<HTMLButtonElement>('[data-panel-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.panelStep);
      history.replaceState({ stack: i }, '', `#${hashes[i]}`);
      show(i);
    }),
  );
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openIdx >= 0) {
      close();
      return;
    }
    if (!scene || openIdx >= 0 || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    const t = e.target as HTMLElement;
    if (!root.contains(t) || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
    if (e.key === 'ArrowRight') scene.next();
    else scene.prev();
  });

  // Hold the cycle while the caption is being read or reached for.
  const hold = root.querySelector<HTMLElement>('[data-stack-hold]')!;
  hold.addEventListener('pointerenter', () => scene?.setHeld(true));
  hold.addEventListener('pointerleave', () => scene?.setHeld(false));
  hold.addEventListener('focusin', () => scene?.setHeld(true));
  hold.addEventListener('focusout', () => scene?.setHeld(false));

  // Landing on /#<service>: open it at once.
  const initial = indexFromHash();
  if (initial >= 0) show(initial, { instant: true });

  /* ── scene ── */
  const hasWebGL = () => {
    try {
      return !!(window.WebGL2RenderingContext && document.createElement('canvas').getContext('webgl2'));
    } catch {
      return false;
    }
  };
  if (reduced || !hasWebGL()) {
    root.classList.add('is-static');
    return;
  }

  const mountedAt = performance.now();
  (async () => {
    try {
      const [{ HeroSceneGL }, { waitForFonts }] = await Promise.all([
        import('./HeroSceneGL.js'),
        import('./panelTexture.js'),
      ]);
      await waitForFonts();
      const cards = JSON.parse(root.dataset.cards || '[]');
      const s = new HeroSceneGL(canvas, {
        onAdvance: (i: number) => setIndex(i),
        onOpen: (i: number) => open(i),
        cards,
        narrow: innerWidth < 768,
        textEl: copy,
      }) as unknown as Scene;
      scene = s;
      if ((window as unknown as { __ADV_CAPTURE__?: boolean }).__ADV_CAPTURE__)
        (window as unknown as { __ADV_STACK__?: Scene }).__ADV_STACK__ = s;
      await s.warmUp();
      const startOpen = openIdx >= 0;
      const converge = !startOpen && performance.now() - mountedAt < CONVERGE_BUDGET_MS;
      root.classList.add(converge ? 'is-converge' : 'is-settle');
      s.start({ converge });
      if (startOpen) {
        s.jumpTo(openIdx);
        s.focus({ immediate: true });
      }
      steps.hidden = false;
      root.querySelector('[data-stack-prev]')!.addEventListener('click', () => s.prev());
      root.querySelector('[data-stack-next]')!.addEventListener('click', () => s.next());
    } catch (err) {
      // A shader compile failure or a lost context must not take the hero down: the poster stays.
      console.warn('Card stack: WebGL scene unavailable, keeping the static stack.', err);
      scene?.dispose();
      scene = null;
      root.classList.remove('is-converge', 'is-settle');
      root.classList.add('is-static');
    }
  })();
}
