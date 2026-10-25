/**
 * The breathing workflow grid (ported from ADV\inspo\adv-palette-study.html, the engine Honza picked).
 * A hairline grid that breathes; small workflows build themselves on it node by node, run (an Ice
 * pulse travels the edges), complete with a tick and a ripple, and fade. A soft lens follows a mouse.
 *
 * Differences from the study: flows never land on the text or the hero window (every
 * [data-grid-avoid] element inside the canvas' parent is kept clear, with margin), narrow screens use
 * a compressed template, and colours come from the CSS tokens (--adv-grid-rgb, --adv-accent-rgb).
 *
 * Cost: one 2D canvas, at most two flows, paused when off screen or in a hidden tab.
 * Reduced motion: one finished flow is drawn once, statically.
 */
export function initFlowGrid(cv: HTMLCanvasElement) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const host = cv.parentElement!;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const cell = 56;
  const BUILD = 0.55;
  const RUN = 0.42;
  const MID = (cv.dataset.labels || 'fetch,parse,enrich,approve,sync,notify,route,check').split(',');
  const FIRST = cv.dataset.first || 'trigger';
  const LAST = cv.dataset.last || 'done';
  // data-flows="off": only the breathing grid and the pointer lens (the calmer homepage hero)
  const FLOWS = cv.dataset.flows !== 'off';
  const TEMPLATES = [
    {
      n: [
        [0, 0],
        [3, 0],
        [6, 1],
        [9, 1],
      ],
      e: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
    {
      n: [
        [0, 1],
        [3, 0],
        [3, 2],
        [6, 1],
        [9, 1],
      ],
      e: [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
        [3, 4],
      ],
    },
    {
      n: [
        [0, 1],
        [3, 1],
        [6, 0],
        [6, 2],
        [9, 1],
      ],
      e: [
        [0, 1],
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
      ],
    },
    {
      n: [
        [0, 0],
        [3, 0],
        [3, 2],
        [6, 2],
        [9, 1],
      ],
      e: [
        [0, 1],
        [0, 2],
        [2, 3],
        [1, 4],
        [3, 4],
      ],
    },
  ];
  type Node = { x: number; y: number; d: number; label: string };
  type Edge = { a: number; b: number; pts: number[][]; seg: number[]; len: number };
  type Flow = {
    t0: number;
    nodes: Node[];
    edges: Edge[];
    box: number[];
    R: number;
    Td: number;
    Tf: number;
    rippled: boolean;
  };

  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const gridRGB = css('--adv-grid-rgb') || '236,238,244';
  const accRGB = css('--adv-accent-rgb') || '124,200,255';
  const bg2 = css('--adv-bg-2') || '#0e1016';
  let W = 0;
  let H = 0;
  let base: HTMLCanvasElement | null = null;
  let flows: Flow[] = [];
  let ripples: { x: number; y: number; t0: number }[] = [];
  let avoid: number[][] = []; // in grid cells: [c0, r0, c1, r1]
  let mx = -1e4;
  let my = -1e4;
  let visible = true;
  let T = 0;
  let nextAt = 0.6;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

  const measureAvoid = () => {
    const hr = cv.getBoundingClientRect();
    // In pixels, with a 20px margin: text and the hero window stay clear.
    avoid = [...host.querySelectorAll<HTMLElement>('[data-grid-avoid] > *')].map((n) => {
      const r = n.getBoundingClientRect();
      return [r.left - hr.left - 20, r.top - hr.top - 20, r.right - hr.left + 20, r.bottom - hr.top + 20];
    });
  };
  const overlaps = (a: number[], b: number[]) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

  function makeFlow(t0: number): Flow | null {
    const narrow = W < 700;
    const sx = narrow ? 0.5 : 1;
    const cols = Math.floor(W / cell);
    const rows = Math.floor(H / cell);
    const spanC = Math.round(9 * sx);
    const maxC = cols - 1 - spanC;
    if (maxC < 1) return null;
    // Try every template (flatter ones fit tighter gaps) at random grid positions.
    const order = TEMPLATES.slice().sort(() => Math.random() - 0.5);
    for (let k = 0; k < 120; k++) {
      const tp = order[k % order.length];
      const spanR = Math.max(...tp.n.map(([, r]) => r));
      const maxR = rows - 1 - spanR;
      if (maxR < 2) continue;
      const c0 = 1 + ((Math.random() * maxC) | 0);
      const r0 = 2 + ((Math.random() * (maxR - 1)) | 0); // row 2+: clear of the header
      // pixel box of the nodes, plus room for node size and the labels under them
      const box = [c0 * cell - 14, r0 * cell - 14, (c0 + spanC) * cell + 34, (r0 + spanR) * cell + 30];
      if (box[3] > H - 8) continue;
      if (avoid.some((a) => overlaps(box, a))) continue;
      if (flows.some((f) => overlaps([box[0] - cell, box[1] - cell, box[2] + cell, box[3] + cell], f.box))) continue;
      const nodes: Node[] = tp.n.map(([c, r]) => ({
        x: (c0 + Math.round(c * sx)) * cell,
        y: (r0 + r) * cell,
        d: 0,
        label: '',
      }));
      for (let i = 0; i < nodes.length; i++)
        tp.e.forEach(([a, b]) => {
          nodes[b].d = Math.max(nodes[b].d, nodes[a].d + 1);
        });
      const pool = MID.slice().sort(() => Math.random() - 0.5);
      nodes.forEach((n, i) => {
        n.label = i === 0 ? FIRST : i === nodes.length - 1 ? LAST : pool[i % pool.length];
      });
      const edges: Edge[] = tp.e.map(([a, b]) => {
        const A = nodes[a];
        const B = nodes[b];
        const midX = Math.round((A.x + B.x) / 2 / cell) * cell;
        const pts =
          A.y === B.y
            ? [
                [A.x, A.y],
                [B.x, B.y],
              ]
            : [
                [A.x, A.y],
                [midX, A.y],
                [midX, B.y],
                [B.x, B.y],
              ];
        let len = 0;
        const seg: number[] = [];
        for (let i = 1; i < pts.length; i++) {
          const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
          seg.push(l);
          len += l;
        }
        return { a, b, pts, seg, len };
      });
      const maxD = Math.max(...nodes.map((n) => n.d));
      const R = maxD * BUILD + 0.9;
      const Td = R + maxD * RUN;
      return { t0, nodes, edges, box, R, Td, Tf: Td + 1.8, rippled: false };
    }
    return null;
  }

  // stroke the part of a polyline between lengths l0 and l1
  function poly(e: Edge, l0: number, l1: number) {
    if (l1 <= l0) return;
    ctx!.beginPath();
    let acc = 0;
    let started = false;
    for (let i = 1; i < e.pts.length; i++) {
      const [x0, y0] = e.pts[i - 1];
      const [x1, y1] = e.pts[i];
      const L = e.seg[i - 1];
      const s = Math.max(l0, acc);
      const t = Math.min(l1, acc + L);
      if (t > s) {
        const k0 = (s - acc) / L;
        const k1 = (t - acc) / L;
        if (!started) {
          ctx!.moveTo(x0 + (x1 - x0) * k0 + 0.5, y0 + (y1 - y0) * k0 + 0.5);
          started = true;
        }
        ctx!.lineTo(x0 + (x1 - x0) * k1 + 0.5, y0 + (y1 - y0) * k1 + 0.5);
      }
      acc += L;
    }
    ctx!.stroke();
  }

  function drawFlow(f: Flow, now: number) {
    const c = ctx!;
    const tau = now - f.t0;
    const fa = Math.min(clamp(tau / 0.4), 1 - clamp((tau - f.Tf) / 1.0));
    if (fa <= 0) return;
    c.save();
    c.globalAlpha = fa;
    c.lineCap = 'round';
    const ta = (n: Node) => n.d * BUILD;
    const tr = (n: Node) => f.R + n.d * RUN;
    f.edges.forEach((e) => {
      const A = f.nodes[e.a];
      const B = f.nodes[e.b];
      const kb = clamp((tau - ta(A) - 0.15) / Math.max(0.2, ta(B) - ta(A) - 0.15));
      c.strokeStyle = `rgba(${gridRGB},.24)`;
      c.lineWidth = 1;
      poly(e, 0, e.len * easeOut(kb));
      const kr = clamp((tau - tr(A)) / (tr(B) - tr(A)));
      if (kr > 0) {
        const h = e.len * kr;
        c.strokeStyle = `rgba(${accRGB},.42)`;
        c.lineWidth = 1.2;
        poly(e, 0, h);
        if (kr < 1) {
          // the travelling pulse: a wide faint stroke under a bright one (cheaper than shadowBlur)
          c.strokeStyle = `rgba(${accRGB},.22)`;
          c.lineWidth = 6;
          poly(e, Math.max(0, h - 30), h);
          c.strokeStyle = `rgba(${accRGB},.95)`;
          c.lineWidth = 1.6;
          poly(e, Math.max(0, h - 26), h);
        }
      }
    });
    f.nodes.forEach((n, i) => {
      const s = easeOut(clamp((tau - ta(n)) / 0.35));
      if (s <= 0) return;
      const active = tau >= tr(n);
      const last = i === f.nodes.length - 1;
      const sz = (last ? 18 : 14) * s;
      const r = 4 * s;
      c.beginPath();
      c.roundRect(n.x - sz / 2 + 0.5, n.y - sz / 2 + 0.5, sz, sz, r);
      c.fillStyle = bg2;
      c.fill();
      if (active) {
        c.fillStyle = `rgba(${accRGB},.14)`;
        c.fill();
      }
      c.strokeStyle = active ? `rgba(${accRGB},.9)` : `rgba(${gridRGB},.38)`;
      c.lineWidth = 1;
      c.stroke();
      if (active && !last) {
        c.fillStyle = `rgba(${accRGB},1)`;
        c.beginPath();
        c.arc(n.x + 0.5, n.y + 0.5, 2.2, 0, 7);
        c.fill();
      }
      const flash = clamp((tau - tr(n)) / 0.6);
      if (active && flash < 1) {
        c.strokeStyle = `rgba(${accRGB},${0.6 * (1 - flash)})`;
        c.beginPath();
        c.roundRect(
          n.x - sz / 2 - 6 * flash,
          n.y - sz / 2 - 6 * flash,
          sz + 12 * flash,
          sz + 12 * flash,
          r + 4 * flash,
        );
        c.stroke();
      }
      if (last && tau >= f.Td) {
        const k = easeOut(clamp((tau - f.Td) / 0.4));
        c.strokeStyle = `rgba(${accRGB},1)`;
        c.lineWidth = 1.6;
        c.beginPath();
        const p = [
          [n.x - 4, n.y],
          [n.x - 1, n.y + 3],
          [n.x + 4.5, n.y - 3.5],
        ];
        c.moveTo(p[0][0], p[0][1]);
        if (k < 0.4) {
          const q = k / 0.4;
          c.lineTo(p[0][0] + (p[1][0] - p[0][0]) * q, p[0][1] + (p[1][1] - p[0][1]) * q);
        } else {
          const q = (k - 0.4) / 0.6;
          c.lineTo(p[1][0], p[1][1]);
          c.lineTo(p[1][0] + (p[2][0] - p[1][0]) * q, p[1][1] + (p[2][1] - p[1][1]) * q);
        }
        c.stroke();
        if (!f.rippled) {
          f.rippled = true;
          ripples.push({ x: n.x, y: n.y, t0: now });
        }
      }
      c.font = '500 9.5px "JetBrains Mono", ui-monospace, monospace';
      c.textAlign = 'center';
      c.fillStyle = active ? `rgba(${accRGB},${0.75 * s})` : `rgba(${gridRGB},${0.32 * s})`;
      c.fillText(n.label.toUpperCase(), n.x, n.y + sz / 2 + 15);
    });
    c.restore();
  }

  function gridPath() {
    const c = ctx!;
    c.beginPath();
    for (let x = 0; x <= W; x += cell) {
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, H);
    }
    for (let y = 0; y <= H; y += cell) {
      c.moveTo(0, y + 0.5);
      c.lineTo(W, y + 0.5);
    }
  }

  function draw(now: number) {
    const c = ctx!;
    c.clearRect(0, 0, W, H);
    // the grid itself is pre-rendered once per size (base layer); breathing is only its alpha
    const breath = RM ? 1 : 0.8 + 0.2 * Math.sin(now * 0.55);
    if (base) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = breath;
      c.drawImage(base, 0, 0);
      c.restore();
    }
    ripples = ripples.filter((rp) => now - rp.t0 < 2.4);
    ripples.forEach((rp) => {
      const age = now - rp.t0;
      const rad = 20 + age * 240;
      const fade = 1 - age / 2.4;
      const rg = c.createRadialGradient(rp.x, rp.y, Math.max(0, rad - 60), rp.x, rp.y, rad + 8);
      rg.addColorStop(0, `rgba(${accRGB},0)`);
      rg.addColorStop(0.85, `rgba(${accRGB},${0.22 * fade})`);
      rg.addColorStop(1, `rgba(${accRGB},0)`);
      gridPath();
      c.strokeStyle = rg;
      c.stroke();
    });
    if (mx > -1e3) {
      gridPath();
      const lg = c.createRadialGradient(mx, my, 0, mx, my, 210);
      lg.addColorStop(0, `rgba(${gridRGB},.16)`);
      lg.addColorStop(1, `rgba(${gridRGB},0)`);
      c.strokeStyle = lg;
      c.stroke();
    }
    if (!RM && FLOWS && now >= nextAt && flows.length < 2) {
      const f = makeFlow(now);
      if (f) flows.push(f);
      nextAt = now + 3.2 + Math.random() * 2.2;
    }
    flows = flows.filter((f) => now - f.t0 < f.Tf + 1.05);
    flows.forEach((f) => drawFlow(f, now));
  }

  const size = () => {
    const r = cv.getBoundingClientRect();
    W = r.width;
    H = r.height;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // base layer: the hairline grid with its radial falloff, drawn once
    base = document.createElement('canvas');
    base.width = cv.width;
    base.height = cv.height;
    const b = base.getContext('2d')!;
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = b.createRadialGradient(W * 0.72, H * 0.4, 0, W * 0.72, H * 0.4, Math.max(W, H) * 0.78);
    g.addColorStop(0, `rgba(${gridRGB},0.1)`);
    g.addColorStop(1, `rgba(${gridRGB},0)`);
    b.beginPath();
    for (let x = 0; x <= W; x += cell) {
      b.moveTo(x + 0.5, 0);
      b.lineTo(x + 0.5, H);
    }
    for (let y = 0; y <= H; y += cell) {
      b.moveTo(0, y + 0.5);
      b.lineTo(W, y + 0.5);
    }
    b.strokeStyle = g;
    b.lineWidth = 1;
    b.stroke();
    measureAvoid();
    flows = [];
    ripples = [];
    if (RM) {
      const f = FLOWS ? makeFlow(0) : null;
      if (f) {
        f.t0 = -(f.Td + 0.6);
        f.Tf = 1e9;
        f.rippled = true;
        flows.push(f);
      }
      draw(0);
    }
  };
  host.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });
  host.addEventListener('pointerleave', () => {
    mx = my = -1e4;
  });
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
  }).observe(cv);
  let rz = 0;
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return; // phones fire resize when the URL bar moves
    lastW = innerWidth;
    clearTimeout(rz);
    rz = window.setTimeout(size, 140);
  });
  size();
  document.fonts?.ready.then(measureAvoid);
  if (!RM) {
    let last = performance.now();
    let frame = 0;
    const loop = (nowMs: number) => {
      const dt = Math.min((nowMs - last) / 1000, 0.05);
      last = nowMs;
      if (visible && !document.hidden) {
        T += dt;
        // without flows only the slow breath and the lens move: every second frame is enough
        if (FLOWS || (frame++ & 1) === 0) draw(T);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
