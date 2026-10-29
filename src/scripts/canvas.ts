/**
 * The page as a workflow canvas (components/ui/NodeFrame.astro): one foil wire from every node's output
 * port to the next node's input port, and a packet of light that runs down it with scroll. A node whose
 * input the light has reached switches its status from waiting to done.
 *
 * Opt in: <div class="adv-canvas" data-canvas> as the first child of <main> (Base.astro `canvas`).
 * Reduced motion and no JS: every node shows done; with reduced motion the wire is drawn fully lit.
 */
const NS = 'http://www.w3.org/2000/svg';

interface Opts {
  reduceMotion: boolean;
  onScroll: (job: () => void) => void;
}

export function initCanvas({ reduceMotion, onScroll }: Opts) {
  const host = document.querySelector<HTMLElement>('[data-canvas]');
  const main = host?.parentElement;
  if (!host || !main) return;
  const nodes = [...main.querySelectorAll<HTMLElement>('[data-nf]')];
  if (nodes.length < 2) return;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'adv-canvas__svg');
  host.append(svg);
  let segs: { base: SVGPathElement; lit: SVGPathElement; len: number; y0: number; y1: number }[] = [];
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('r', '3.5');
  dot.setAttribute('class', 'adv-canvas__packet');

  // layout position relative to <main>, ignoring transforms (reveals)
  const box = (el: HTMLElement) => {
    let x = 0;
    let y = 0;
    let n: HTMLElement | null = el;
    while (n && n !== main) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent as HTMLElement | null;
    }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
  };

  const status = (node: HTMLElement, done: boolean) => {
    const s = node.querySelector<HTMLElement>('.adv-nf__status');
    if (!s) return;
    node.classList.toggle('is-done', done);
    const label = s.querySelector('span');
    const text = done ? s.dataset.done! : s.dataset.wait!;
    if (label && label.textContent !== text) label.textContent = text;
  };

  const build = () => {
    svg.replaceChildren();
    svg.setAttribute('width', `${main.clientWidth}`);
    svg.setAttribute('height', `${main.scrollHeight}`);
    segs = [];
    for (let k = 0; k < nodes.length - 1; k++) {
      const out = nodes[k].querySelector<HTMLElement>('[data-nf-out]');
      const inn = nodes[k + 1].querySelector<HTMLElement>('[data-nf-in]');
      if (!out || !inn) continue;
      const a = box(out);
      const b = box(inn);
      const dy = (b.y - a.y) / 2;
      const d = `M${a.x},${a.y} C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
      const base = document.createElementNS(NS, 'path');
      base.setAttribute('d', d);
      base.setAttribute('class', 'adv-canvas__wire');
      const lit = document.createElementNS(NS, 'path');
      lit.setAttribute('d', d);
      lit.setAttribute('class', 'adv-canvas__lit');
      svg.append(base, lit);
      const len = base.getTotalLength();
      lit.style.strokeDasharray = `${len} ${len}`;
      lit.style.strokeDashoffset = reduceMotion ? '0' : `${len}`;
      segs.push({ base, lit, len, y0: a.y, y1: b.y });
    }
    svg.append(dot);
    update();
  };

  const update = () => {
    if (reduceMotion) {
      nodes.forEach((n) => status(n, true));
      dot.style.opacity = '0';
      return;
    }
    const top = main.getBoundingClientRect().top;
    const line = innerHeight * 0.62 - top; // the reading line, in <main> coordinates
    let active = -1;
    segs.forEach((s, k) => {
      const p = Math.min(1, Math.max(0, (line - s.y0) / (s.y1 - s.y0)));
      s.lit.style.strokeDashoffset = `${s.len * (1 - p)}`;
      if (p > 0 && p < 1) active = k;
      status(nodes[k + 1], p >= 1);
      if (k === active) {
        const pt = s.base.getPointAtLength(p * s.len);
        dot.setAttribute('cx', `${pt.x}`);
        dot.setAttribute('cy', `${pt.y}`);
      }
    });
    status(nodes[0], true);
    dot.style.opacity = active >= 0 ? '1' : '0';
  };

  build();
  new ResizeObserver(build).observe(main);
  onScroll(update);
}
