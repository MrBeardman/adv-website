/**
 * Homepage workflow hero (components/home/Workflow.astro): draws the foil wires between the rendered
 * steps and runs one packet of light through them on a loop. Each step lights (its check fills, its
 * result brightens) when the packet arrives; the last one ticks its results one by one.
 *
 * Layout comes from CSS. Wide: edges go right to left-edge (four columns, one split into three branches,
 * a merge). Narrow (the graph is one column): one rail in the file's left margin, the steps in order.
 * Without JS the wires are missing but every step is shown done; with reduced motion the wires are drawn
 * and nothing moves. Pauses off screen and in a hidden tab.
 */
const SVG = 'http://www.w3.org/2000/svg';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAIL = 46;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Edge {
  from: string;
  to: string;
  path: SVGPathElement;
  trail: SVGPathElement;
  dot: SVGCircleElement;
  len: number;
}

export function initWorkflow(root: HTMLElement) {
  const file = root.querySelector<HTMLElement>('.adv-wf__file');
  const svg = root.querySelector<SVGSVGElement>('[data-wf-wires]');
  if (!file || !svg) return;
  const nodes = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-wf-node]').forEach((el) => nodes.set(el.dataset.wfNode!, el));
  const order = [...nodes.keys()];
  // edges from the markup: each node names where its work comes from
  const pairs: [string, string][] = [];
  nodes.forEach((el, id) =>
    (el.dataset.wfFrom ?? '')
      .split(' ')
      .filter(Boolean)
      .forEach((f) => pairs.push([f, id])),
  );

  let edges: Edge[] = [];
  let stages: Edge[][] = [];
  let vertical = false;

  function layout() {
    svg!.replaceChildren();
    const box = file!.getBoundingClientRect();
    const r = (el: HTMLElement) => {
      const b = el.getBoundingClientRect();
      return { l: b.left - box.left, r: b.right - box.left, t: b.top - box.top, b: b.bottom - box.top };
    };
    const first = r(nodes.get(order[0])!);
    const second = r(nodes.get(order[1])!);
    vertical = second.l < first.r - 4;
    const rail = Math.max(8, first.l - 14);

    const make = (from: string, to: string, d: string): Edge => {
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'adv-wf__wire');
      path.dataset.from = from;
      path.dataset.to = to;
      const trail = document.createElementNS(SVG, 'path');
      trail.setAttribute('d', d);
      trail.setAttribute('class', 'adv-wf__trail');
      trail.style.opacity = '0';
      const dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('class', 'adv-wf__packet');
      dot.style.opacity = '0';
      svg!.append(path, trail, dot);
      const len = path.getTotalLength();
      trail.style.strokeDasharray = `${TAIL} ${len + TAIL}`;
      return { from, to, path, trail, dot, len };
    };

    if (!vertical) {
      edges = pairs.map(([f, t]) => {
        const a = r(nodes.get(f)!);
        const b = r(nodes.get(t)!);
        const x1 = a.r;
        const y1 = (a.t + a.b) / 2;
        const x2 = b.l;
        // into the merge card, land at different heights so three wires do not meet in one point
        const into = pairs.filter((p) => p[1] === t);
        const k = into.findIndex((p) => p[0] === f);
        const y2 = into.length > 1 ? b.t + ((b.b - b.t) * (k + 1)) / (into.length + 1) : (b.t + b.b) / 2;
        const dx = (x2 - x1) / 2;
        return make(f, t, `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
      });
      const by = (from: string[]) => edges.filter((e) => from.includes(e.from));
      // stage by distance from the start
      const seen = new Set([order[0]]);
      stages = [];
      let frontier = [order[0]];
      while (frontier.length) {
        const st = by(frontier).filter((e) => !seen.has(e.to) || e.to === order[order.length - 1]);
        if (!st.length) break;
        stages.push(st);
        frontier = [...new Set(st.map((e) => e.to))].filter((id) => !seen.has(id));
        frontier.forEach((id) => seen.add(id));
      }
    } else {
      // one rail down the left margin, a short stub into every step
      const rs = order.map((id) => r(nodes.get(id)!));
      const mid = (k: number) => (rs[k].t + rs[k].b) / 2;
      edges = [];
      for (let k = 0; k < order.length - 1; k++) {
        const y1 = mid(k);
        const y2 = mid(k + 1);
        edges.push(make(order[k], order[k + 1], `M${rs[k].l},${y1} H${rail} V${y2} H${rs[k + 1].l}`));
      }
      stages = edges.map((e) => [e]);
    }
  }

  // hover a step: its wires brighten
  nodes.forEach((el, id) => {
    const hot = (on: boolean) =>
      edges.forEach((e) => (e.from === id || e.to === id) && e.path.classList.toggle('is-hot', on));
    el.addEventListener('pointerenter', () => hot(true));
    el.addEventListener('pointerleave', () => hot(false));
    el.addEventListener('focus', () => hot(true));
    el.addEventListener('blur', () => hot(false));
  });

  layout();
  new ResizeObserver(() => layout()).observe(file);
  if (reduceMotion) return;

  // ---- the loop ----
  const STAGE = 1100;
  const HOLD = 2600;
  const RESET = 700;
  root.classList.add('is-running');
  const setDone = (id: string, on: boolean) => nodes.get(id)?.classList.toggle('is-done', on);
  setDone(order[0], true);

  let visible = true;
  let raf = 0;
  let t0 = performance.now();
  let pausedAt = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const total = stages.length * STAGE + HOLD + RESET;
    const t = (now - t0) % total;
    const s = Math.floor(t / STAGE);
    stages.forEach((st, k) => {
      const p = k === s ? ease((t - k * STAGE) / STAGE) : k < s ? 1 : 0;
      st.forEach((e) => {
        const active = k === s;
        e.trail.style.opacity = active ? '1' : '0';
        e.dot.style.opacity = active ? '1' : '0';
        if (active) {
          e.trail.style.strokeDashoffset = `${TAIL - p * (e.len + TAIL)}`;
          const pt = e.path.getPointAtLength(p * e.len);
          e.dot.setAttribute('cx', `${pt.x}`);
          e.dot.setAttribute('cy', `${pt.y}`);
        }
        setDone(e.to, p >= 1 && t < stages.length * STAGE + HOLD);
      });
    });
  };

  const start = () => {
    if (raf || !visible || document.hidden) return;
    t0 += performance.now() - pausedAt;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    pausedAt = performance.now();
  };
  pausedAt = performance.now();
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    visible ? start() : stop();
  }).observe(file);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
