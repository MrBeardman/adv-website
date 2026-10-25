/**
 * The stream of light (Relay reference): one continuous bundle of thin Ice/navy filaments that runs the
 * whole page, scroll-driven. It leaves the hero's workflow window, runs down a rail in the left gutter,
 * and every section is a node on it: when the light reaches a section's kicker ([data-node]) the node
 * lights, ticks, and a short branch draws to the kicker. It ends in the final CTA panel ([data-stream-end]).
 *
 * Markup contract (pages opt in through Base.astro `stream`):
 *   <div class="adv-stream" data-stream>     empty container, first child of <main>
 *   [data-stream-start]                      where the light starts (hero window)
 *   [data-node]                              section kickers, in page order
 *   [data-stream-end]                        where it ends (CTA panel)
 *
 * Cost: one SVG, a handful of paths; on scroll only stroke-dashoffset, one circle and classes change.
 * Reduced motion: drawn fully lit, every node ticked, no moving head. No JS: no stream, kickers still show.
 */
const NS = 'http://www.w3.org/2000/svg';

interface Opts {
  reduceMotion: boolean;
  onScroll: (job: () => void) => void;
}

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
};

export function initStream({ reduceMotion, onScroll }: Opts) {
  const host = document.querySelector<HTMLElement>('[data-stream]');
  const main = host?.parentElement;
  if (!host || !main) return;
  const nodesEls = [...main.querySelectorAll<HTMLElement>('.adv-node')];
  const startEl = main.querySelector<HTMLElement>('[data-stream-start]');
  const endEl = main.querySelector<HTMLElement>('[data-stream-end]');
  if (!nodesEls.length) return;
  const light = host.dataset.stream === 'light';

  let svg: SVGSVGElement | null = null;
  let lit: SVGPathElement[] = [];
  let lens: number[] = [];
  let tail: SVGPathElement | null = null;
  let head: SVGGElement | null = null;
  let samples: { l: number; y: number; x: number }[] = [];
  let nodeYs: number[] = [];
  let endY = Infinity;
  let mainTop = 0;

  // Layout position relative to <main> from offsets: unlike getBoundingClientRect this ignores the
  // reveal's translate and the hero window's tilt, so the rail does not depend on animation timing.
  const box = (el: HTMLElement) => {
    let x = 0;
    let y = 0;
    let n: HTMLElement | null = el;
    while (n && n !== main) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent as HTMLElement | null;
    }
    return { left: x, top: y, w: el.offsetWidth, h: el.offsetHeight };
  };

  const build = () => {
    const mr = main.getBoundingClientRect();
    mainTop = mr.top + scrollY;
    const W = main.clientWidth;
    const H = main.scrollHeight;
    const narrow = W < 760;
    // The rail runs through the section nodes (all on one vertical line in the left gutter).
    const nb = nodesEls.map(box);
    const x = Math.round(nb[0].left + nb[0].w / 2) + 0.5;
    const amp = narrow ? 3 : 14;
    nodeYs = nb.map((b) => Math.round(b.top + b.h / 2));

    // Polyline of anchor points the filaments pass through.
    let sx = x;
    let sy = Math.max(0, nodeYs[0] - 300);
    if (startEl) {
      const r = box(startEl);
      sx = r.left + Math.min(40, r.w * 0.1);
      sy = r.top + r.h - 2;
    }
    let ex = x;
    endY = H;
    if (endEl) {
      const r = box(endEl);
      ex = r.left + r.w / 2;
      endY = r.top + 1;
    }

    // Build one filament. `k` bends the wiggles differently per filament so they braid and pinch at nodes.
    const filament = (k: number, off: number) => {
      let d = `M${sx + off},${sy}`;
      const y0 = nodeYs[0];
      d += ` C${sx + off},${sy + (y0 - sy) * 0.55} ${x},${sy + (y0 - sy) * 0.45} ${x},${y0}`;
      for (let i = 1; i < nodeYs.length; i++) {
        const a = nodeYs[i - 1];
        const b = nodeYs[i];
        const w = amp * k * (i % 2 ? 1 : -1);
        d += ` C${x + w + off},${a + (b - a) * 0.33} ${x - w + off},${a + (b - a) * 0.66} ${x},${b}`;
      }
      const last = nodeYs[nodeYs.length - 1];
      if (endEl && endY > last) {
        d += ` C${x + off},${last + (endY - last) * 0.6} ${ex + off * 2},${endY - Math.min(120, (endY - last) * 0.4)} ${ex + off * 2},${endY}`;
      }
      return d;
    };

    svg?.remove();
    svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'adv-stream__svg' }) as SVGSVGElement;
    const defs = el('defs');
    const grad = el('linearGradient', {
      id: 'adv-stream-g',
      gradientUnits: 'userSpaceOnUse',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: H,
    });
    [
      [0, 'rgba(124,200,255,0.95)'],
      [0.35, 'rgba(64,104,235,0.9)'],
      [0.7, 'rgba(96,150,255,0.9)'],
      [1, 'rgba(124,200,255,1)'],
    ].forEach(([o, c]) => grad.append(el('stop', { offset: o as number, 'stop-color': c as string })));
    const glow = el('radialGradient', { id: 'adv-stream-h' });
    glow.append(el('stop', { offset: 0, 'stop-color': 'rgba(124,200,255,0.55)' }));
    glow.append(el('stop', { offset: 1, 'stop-color': 'rgba(124,200,255,0)' }));
    defs.append(grad, glow);
    svg.append(defs);

    // data-stream="light" (the calmer homepage): one fine strand at half strength.
    const strands = light
      ? [{ k: 0.6, off: 0, w: 1, o: 0.6 }]
      : narrow
        ? [{ k: 1, off: 0, w: 1.2, o: 1 }]
        : [
            { k: 1, off: 0, w: 1.3, o: 1 },
            { k: -0.7, off: 3, w: 0.8, o: 0.55 },
            { k: 1.6, off: -3, w: 0.6, o: 0.35 },
          ];
    lit = [];
    lens = [];
    strands.forEach((s, i) => {
      const d = filament(s.k, s.off);
      svg!.append(el('path', { d, class: 'adv-stream__base', 'stroke-width': s.w }));
      const p = el('path', {
        d,
        class: 'adv-stream__lit',
        stroke: 'url(#adv-stream-g)',
        'stroke-width': s.w,
        opacity: s.o,
      }) as SVGPathElement;
      svg!.append(p);
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L} ${L}`;
      p.style.strokeDashoffset = reduceMotion ? '0' : String(L);
      lit.push(p);
      lens.push(L);
      if (i === 0) {
        samples = [];
        const n = Math.max(60, Math.round(L / 10));
        for (let j = 0; j <= n; j++) {
          const pt = p.getPointAtLength((L * j) / n);
          samples.push({ l: (L * j) / n, x: pt.x, y: pt.y });
        }
        tail = el('path', { d, class: 'adv-stream__tail' }) as SVGPathElement;
        tail.style.strokeDasharray = `70 ${L + 70}`;
        svg!.append(tail);
      }
    });

    if (!reduceMotion) {
      head = el('g', { class: 'adv-stream__head' }) as SVGGElement;
      head.append(
        el('circle', { r: 18, fill: 'url(#adv-stream-h)' }),
        el('circle', { r: 2.4, class: 'adv-stream__dot' }),
      );
      svg.append(head);
    }
    host.append(svg);
    if (reduceMotion) {
      nodesEls.forEach((n) => n.classList.add('is-lit'));
      endEl?.classList.add('is-reached');
    }
    update();
  };

  const update = () => {
    if (!svg || reduceMotion || !samples.length) return;
    // The light's head sits a little below the middle of the viewport.
    const hy = scrollY + innerHeight * 0.62 - mainTop;
    let i = samples.findIndex((s) => s.y >= hy);
    if (i === -1) i = samples.length - 1;
    // Never ahead of the first node while the hero is still on screen: start at the window.
    const s = samples[Math.max(0, i)];
    const frac = s.l / lens[0];
    lit.forEach((p, k) => (p.style.strokeDashoffset = String(lens[k] * (1 - frac))));
    if (tail) tail.style.strokeDashoffset = String(-(s.l - 70));
    if (head) {
      head.setAttribute('transform', `translate(${s.x},${s.y})`);
      head.style.opacity = frac > 0.002 && frac < 0.999 ? '1' : '0';
    }
    nodeYs.forEach((y, k) => {
      nodesEls[k].classList.toggle('is-lit', y <= s.y + 1);
    });
    endEl?.classList.toggle('is-reached', frac > 0.995);
  };

  let t = 0;
  const rebuild = () => {
    clearTimeout(t);
    t = window.setTimeout(build, 150);
  };
  build();
  onScroll(update);
  new ResizeObserver(rebuild).observe(main);
  document.fonts?.ready.then(rebuild);
  addEventListener('load', rebuild);
}
