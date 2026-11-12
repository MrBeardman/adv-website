/**
 * Hero art with a built-in scroll cue, one per page, each in that page's own language (Honza, Nov 12 2026:
 * "the scroll cue in all the heroes in their respective style"). The automation page's cue is drawn by its
 * flow grid (flowGrid.ts); these are the others. Every cue has the same anatomy, so a visitor learns it
 * once: the page's motif, a wire down, an arrowhead, the label.
 *
 *   rings       business optimisation: three loose, out-of-step rings and scattered tasks that settle into
 *               one evenly turning machine; work only starts to flow down once it is in order
 *   responsive  websites: one page that reflows from desktop to tablet to phone; the cue is its scrollbar
 *   build       prototypes and software: a dashed sketch of an app that a build line turns into the real
 *               thing; the cue's dashed wire turns solid the same way
 *   dataline    homepage: loose bits of data fall into one line, like the hero's stream through the A
 *
 * <canvas data-art="rings" data-cue="pokračovat" data-labels="a,b,c">; sized by CSS. One 2D canvas each,
 * paused off screen and in a hidden tab. Reduced motion: the finished frame, drawn once, no pulses.
 * The cue fades as the page scrolls; the art stays.
 */
type Scene = { frame: (dt: number) => void; reset?: () => void; done?: () => boolean };

const TAU = Math.PI * 2;
const CUE_TRAVEL = 1.3; // seconds a pulse takes down the wire
const CUE_PERIOD = 3.4; // one pulse per period
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const out = (k: number) => 1 - Math.pow(1 - k, 3);
const io = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function initHeroArt(cv: HTMLCanvasElement) {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const c = ctx;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kind = cv.dataset.art || 'rings';
  const CUE = (cv.dataset.cue || '').toUpperCase();
  const LABELS = (cv.dataset.labels || '').split(',').map((s) => s.trim().toUpperCase());
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const G = css('--adv-grid-rgb') || '236,238,244';
  const A = css('--adv-accent-rgb') || '124,200,255';
  const BG = css('--adv-bg-2') || '#0c0e14';
  const g = (a: number) => `rgba(${G},${a})`;
  const ac = (a: number) => `rgba(${A},${a})`;
  const FONT = '500 9.5px "JetBrains Mono", ui-monospace, monospace';
  let W = 0;
  let H = 0;
  // the same picture on every load: a small seeded generator instead of Math.random
  let seed = 11;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  };
  const box = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  };

  /** the arrowhead and the label under it; `lit` 0..1 */
  function head(x: number, y1: number, lit: number, dashed = false) {
    const draw = (style: string, w: number) => {
      c.strokeStyle = style;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(x - 6, y1 - 6);
      c.lineTo(x, y1);
      c.lineTo(x + 6, y1 - 6);
      c.stroke();
    };
    c.lineJoin = 'round';
    if (dashed) c.setLineDash([3, 3]);
    draw(g(0.55), 1.2);
    c.setLineDash([]);
    if (lit > 0) draw(ac(lit), 1.6);
    if (!CUE) return;
    c.font = FONT;
    c.textAlign = 'center';
    c.fillStyle = g(0.5);
    c.fillText(CUE, x, y1 + 20);
    if (lit > 0) {
      c.fillStyle = ac(0.8 * lit);
      c.fillText(CUE, x, y1 + 20);
    }
  }

  /**
   * The cue: a wire from y0 to y1, something travelling it once per period, the arrowhead lighting when it
   * lands. `since`: seconds since the art above is ready (negative = not yet: the wire waits, dim).
   */
  function cue(x: number, y0: number, y1: number, since: number, style: 'pulse' | 'thumb' | 'solidify') {
    const fade = 1 - clamp(scrollY / 260);
    if (fade <= 0) return;
    const len = y1 - y0;
    const k = since < 0 ? -1 : RM ? 1.2 : (since % CUE_PERIOD) / CUE_TRAVEL;
    const arrived = k >= 1 ? 1 - clamp((k - 1) / 1.2) : 0;
    c.save();
    c.globalAlpha = fade;
    c.lineCap = 'round';
    c.strokeStyle = g(style === 'thumb' ? 0.22 : 0.34);
    c.lineWidth = 1;
    if (style === 'solidify') c.setLineDash([3, 4]);
    line(x, y0, x, y1 - (style === 'thumb' ? 14 : 0));
    c.setLineDash([]);
    if (style === 'thumb') {
      // a scrollbar: the thumb slides down its track and rests at the end
      const t = k < 0 ? 0 : io(clamp(k));
      const y = y0 + (len - 36) * t;
      box(x - 2.5, y, 5, 18, 2.5);
      c.fillStyle = g(0.5);
      c.fill();
      if (k >= 0) {
        c.fillStyle = ac(k < 1 ? 0.95 : arrived);
        c.fill();
      }
    } else if (k >= 0 && k < 1) {
      const h = len * k;
      c.strokeStyle = ac(0.42);
      c.lineWidth = 1.2;
      line(x, y0, x, y0 + h);
      c.strokeStyle = ac(0.22);
      c.lineWidth = 6;
      line(x, y0 + Math.max(0, h - 30), x, y0 + h);
      c.strokeStyle = ac(0.95);
      c.lineWidth = 1.6;
      line(x, y0 + Math.max(0, h - 26), x, y0 + h);
    } else if (arrived > 0) {
      c.strokeStyle = ac(0.42 * arrived);
      c.lineWidth = 1.2;
      line(x, y0, x, y1);
    }
    head(x, y1, arrived, style === 'solidify' && arrived <= 0);
    c.restore();
  }

  // Business optimisation: disorder that settles into a machine.
  function rings(): Scene {
    const R = [
      { r: 58, n: 6, dir: 1 },
      { r: 100, n: 10, dir: -1 },
      { r: 142, n: 14, dir: 1 },
    ];
    const CHAOS = [0.55, -0.22, 0.34]; // rad/s, each ring on its own
    const START = [0.8, 2.0, 3.2];
    const DUR = 3.6;
    const DONE = 7.9;
    const FLOW = 1.15; // seconds between two tasks sending work in
    const segs = R.map((ring) =>
      Array.from({ length: ring.n }, () => ({
        da: (rnd() - 0.5) * 1.5,
        lf: 0.25 + rnd() * 1.1,
        dr: (rnd() - 0.5) * 36,
      })),
    );
    const rot = [rnd() * TAU, rnd() * TAU, rnd() * TAU];
    const N = R[2].n;
    const dots = Array.from({ length: N }, () => ({
      a: rnd() * TAU,
      d: 28 + rnd() * 150,
      ph: rnd() * TAU,
      sp: 0.4 + rnd() * 0.6,
      delay: rnd() * 0.9,
    }));
    const links = Array.from({ length: 10 }, () => [(rnd() * N) | 0, (rnd() * N) | 0]);
    let tau = RM ? 99 : 0;
    return {
      reset: () => (tau = 0),
      done: () => tau > DONE + 1,
      frame(dt) {
        tau += dt;
        const cx = W / 2;
        const cy = 200;
        const o = START.map((s) => io(clamp((tau - s) / DUR)));
        R.forEach((ring, k) => {
          const chaos = CHAOS[k] * (1 + 0.5 * Math.sin(tau * 1.3 + k * 2));
          const order = ring.dir * 0.34 * (R[0].r / ring.r); // meshed: the same speed at every rim
          rot[k] += dt * lerp(chaos, order, o[k]);
        });
        const P = dots.map((d, i) => {
          const od = io(clamp((tau - 3.4 - d.delay) / 3.2));
          const wob = d.a + Math.sin(tau * d.sp + d.ph) * 0.35;
          const ao = rot[2] + (i + 0.5) * (TAU / N); // its slot: the gap between two outer segments
          return {
            x: lerp(cx + Math.cos(wob) * d.d, cx + Math.cos(ao) * R[2].r, od),
            y: lerp(cy + Math.sin(wob) * d.d, cy + Math.sin(ao) * R[2].r, od),
            od,
          };
        });
        // once in order, tasks take turns sending work to the hub
        const flowing = tau - DONE - 0.3;
        const active = flowing > 0 ? (Math.floor(flowing / FLOW) * 5) % N : -1;
        c.lineCap = 'round';
        // the tangle: who hands what to whom today; it thins out as things find their place
        links.forEach(([a, b]) => {
          const al = 0.14 * (1 - Math.max(P[a].od, P[b].od));
          if (al <= 0.005 || a === b) return;
          c.strokeStyle = g(al);
          c.lineWidth = 1;
          line(P[a].x, P[a].y, P[b].x, P[b].y);
        });
        R.forEach((ring, k) => {
          const lit = clamp((tau - START[k] - DUR) / 0.7);
          segs[k].forEach((s, i) => {
            const a = rot[k] + (i * TAU) / ring.n + s.da * (1 - o[k]);
            const half = (TAU / ring.n) * 0.36 * lerp(s.lf, 1, o[k]);
            const r = ring.r + s.dr * (1 - o[k]);
            c.beginPath();
            c.arc(cx, cy, r, a - half, a + half);
            c.strokeStyle = g(lerp(0.2, 0.32, o[k]));
            c.lineWidth = lerp(1.2, 1.6, o[k]);
            c.stroke();
            if (lit > 0) {
              c.strokeStyle = ac(0.6 * lit);
              c.stroke();
            }
          });
        });
        P.forEach((p) => {
          box(p.x - 3, p.y - 3, 6, 6, 1.5);
          c.fillStyle = BG;
          c.fill();
          c.strokeStyle = p.od > 0.98 ? ac(0.9) : g(0.45);
          c.lineWidth = 1;
          c.stroke();
        });
        // what the tasks are: every second one carries its name; loose at first, then around the dial
        if (W >= 500) {
          c.font = FONT;
          P.forEach((p, i) => {
            const label = i % 2 === 0 ? LABELS[i / 2] : '';
            if (!label) return;
            const ang = Math.atan2(p.y - cy, p.x - cx);
            const cos = Math.cos(ang);
            const sin = Math.sin(ang);
            const x = lerp(p.x + 9 * (cos >= 0 ? 1 : -1), cx + cos * (R[2].r + 46), p.od);
            const y = lerp(p.y + 3, cy + sin * (R[2].r + 46) + 3 + (Math.abs(cos) < 0.3 ? sin * 4 : 0), p.od);
            // out of the way of the cue's wire at the bottom
            const clear = clamp((Math.abs(ang - Math.PI / 2) - 0.3) / 0.25);
            c.textAlign = p.od > 0.5 && Math.abs(cos) < 0.3 ? 'center' : cos >= 0 ? 'left' : 'right';
            c.fillStyle = i === active && flowing % FLOW < 0.9 ? ac(0.95 * clear) : g(lerp(0.3, 0.6, p.od) * clear);
            c.fillText(label, x, y);
          });
        }
        // a fine dial around the machine, drawn in as the outer ring settles (it leaves the cue's wire free)
        if (o[2] > 0.02) {
          c.lineWidth = 1;
          for (let t = 0; t < 72; t++) {
            const a = (t / 72) * TAU - rot[2] * 0.25;
            const down = Math.abs(((((a - Math.PI / 2 + Math.PI) % TAU) + TAU) % TAU) - Math.PI);
            if (down < 0.14) continue;
            const long = t % 6 === 0;
            const r0 = R[2].r + 26;
            const r1 = r0 + (long ? 9 : 4);
            c.strokeStyle = g((long ? 0.36 : 0.16) * o[2]);
            line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          }
        }
        // a runner of light on every ring that is in step
        R.forEach((ring, k) => {
          const lit = clamp((tau - START[k] - DUR) / 0.7);
          if (lit <= 0 || RM) return;
          const a = -ring.dir * tau * 0.9 + k * 2;
          c.beginPath();
          c.arc(cx, cy, ring.r, a, a + 0.42);
          c.strokeStyle = `rgba(255,255,255,${0.8 * lit})`;
          c.lineWidth = 1.8;
          c.stroke();
        });
        // work flows in: one task after another sends a pulse down its spoke to the hub
        if (flowing > 0 && !RM) {
          const k = (flowing % FLOW) / 0.8;
          if (k < 1) {
            const p = P[active];
            const q1 = io(k);
            const q0 = Math.max(0, q1 - 0.2);
            c.strokeStyle = g(0.14);
            c.lineWidth = 1;
            line(p.x, p.y, cx, cy);
            c.strokeStyle = ac(0.22);
            c.lineWidth = 6;
            line(lerp(p.x, cx, q0), lerp(p.y, cy, q0), lerp(p.x, cx, q1), lerp(p.y, cy, q1));
            c.strokeStyle = ac(0.95);
            c.lineWidth = 1.6;
            line(lerp(p.x, cx, q0), lerp(p.y, cy, q0), lerp(p.x, cx, q1), lerp(p.y, cy, q1));
          }
        }
        // the hub: lights up with a tick when everything runs in step
        const done = clamp((tau - DONE) / 0.5);
        box(cx - 13, cy - 13, 26, 26, 7);
        c.fillStyle = BG;
        c.fill();
        if (done > 0) {
          c.fillStyle = ac(0.14 * done);
          c.fill();
        }
        c.strokeStyle = done > 0 ? ac(0.38 + 0.52 * done) : g(0.38);
        c.lineWidth = 1;
        c.stroke();
        if (done > 0) {
          const k = out(done);
          const p = [
            [cx - 5, cy],
            [cx - 1.5, cy + 3.5],
            [cx + 5.5, cy - 4],
          ];
          c.strokeStyle = ac(1);
          c.lineWidth = 1.6;
          c.lineJoin = 'round';
          c.beginPath();
          c.moveTo(p[0][0], p[0][1]);
          if (k < 0.4) {
            const q = k / 0.4;
            c.lineTo(lerp(p[0][0], p[1][0], q), lerp(p[0][1], p[1][1], q));
          } else {
            const q = (k - 0.4) / 0.6;
            c.lineTo(p[1][0], p[1][1]);
            c.lineTo(lerp(p[1][0], p[2][0], q), lerp(p[1][1], p[2][1], q));
          }
          c.stroke();
        }
        cue(cx, cy + R[2].r + 20, H - 44, tau - DONE - 0.4, 'pulse');
      },
    };
  }

  // Websites: one page, three screens.
  function responsive(): Scene {
    type Rect = [number, number, number, number];
    // frame size, then every block as x, y, w, h inside the frame
    const L: { f: [number, number]; b: Record<string, Rect> }[] = [
      {
        f: [340, 216],
        b: {
          logo: [14, 28, 10, 10],
          n1: [238, 31, 18, 3],
          n2: [264, 31, 18, 3],
          n3: [290, 31, 18, 3],
          h1: [14, 58, 150, 8],
          h2: [14, 72, 110, 8],
          sub: [14, 90, 130, 4],
          cta: [14, 104, 56, 16],
          img: [190, 52, 124, 72],
          c1: [14, 142, 94, 56],
          c2: [116, 142, 94, 56],
          c3: [218, 142, 96, 56],
        },
      },
      {
        f: [236, 272],
        b: {
          logo: [14, 28, 10, 10],
          n1: [144, 31, 16, 3],
          n2: [166, 31, 16, 3],
          n3: [188, 31, 16, 3],
          h1: [14, 56, 140, 8],
          h2: [14, 70, 100, 8],
          sub: [14, 88, 120, 4],
          cta: [14, 102, 56, 16],
          img: [14, 132, 196, 60],
          c1: [14, 204, 94, 56],
          c2: [116, 204, 94, 56],
          c3: [14, 268, 94, 56],
        },
      },
      {
        f: [136, 272],
        b: {
          logo: [12, 28, 10, 10],
          n1: [102, 28, 14, 2.5],
          n2: [102, 32.5, 14, 2.5],
          n3: [102, 37, 14, 2.5],
          h1: [12, 56, 100, 8],
          h2: [12, 70, 72, 8],
          sub: [12, 88, 88, 4],
          cta: [12, 102, 56, 16],
          img: [12, 130, 104, 54],
          c1: [12, 194, 104, 40],
          c2: [12, 242, 104, 40],
          c3: [12, 290, 104, 40],
        },
      },
    ];
    const HOLD = 2.4;
    const MORPH = 1.1;
    const STEP = HOLD + MORPH;
    let tau = 0;
    return {
      frame(dt) {
        tau += dt;
        const p = RM ? 0 : (tau % (STEP * 3)) / STEP;
        const i = Math.floor(p);
        const f = io(clamp(((p - i) * STEP - HOLD) / MORPH));
        const from = L[i];
        const to = L[(i + 1) % 3];
        const fw = lerp(from.f[0], to.f[0], f);
        const fh = lerp(from.f[1], to.f[1], f);
        const cx = W / 2;
        const x0 = cx - fw / 2;
        const y0 = 190 - fh / 2;
        const R = (k: string): Rect => {
          const a = from.b[k];
          const b = to.b[k];
          return [x0 + lerp(a[0], b[0], f), y0 + lerp(a[1], b[1], f), lerp(a[2], b[2], f), lerp(a[3], b[3], f)];
        };
        c.save();
        c.globalAlpha = RM ? 1 : out(clamp(tau / 0.7));
        // the screen
        box(x0, y0, fw, fh, 10);
        c.fillStyle = 'rgba(7,8,12,.6)';
        c.fill();
        c.strokeStyle = g(0.3);
        c.lineWidth = 1;
        c.stroke();
        c.save();
        box(x0, y0, fw, fh, 10);
        c.clip();
        c.strokeStyle = g(0.14);
        line(x0, y0 + 16.5, x0 + fw, y0 + 16.5);
        c.fillStyle = g(0.28);
        for (let d = 0; d < 3; d++) {
          c.beginPath();
          c.arc(x0 + 12 + d * 7, y0 + 8.5, 1.6, 0, TAU);
          c.fill();
        }
        const fill = (k: string, style: string, r: number) => {
          const [x, y, w, h] = R(k);
          box(x, y, w, h, r);
          c.fillStyle = style;
          c.fill();
        };
        fill('logo', ac(0.9), 3);
        ['n1', 'n2', 'n3'].forEach((k) => fill(k, g(0.3), 1.5));
        fill('h1', g(0.6), 2.5);
        fill('h2', g(0.6), 2.5);
        fill('sub', g(0.24), 2);
        fill('cta', ac(0.9), 5);
        const [ix, iy, iw, ih] = R('img');
        const lg = c.createLinearGradient(ix, iy, ix + iw, iy + ih);
        lg.addColorStop(0, ac(0.26));
        lg.addColorStop(1, ac(0.05));
        box(ix, iy, iw, ih, 6);
        c.fillStyle = lg;
        c.fill();
        c.strokeStyle = ac(0.3);
        c.stroke();
        ['c1', 'c2', 'c3'].forEach((k) => {
          const [x, y, w, h] = R(k);
          box(x, y, w, h, 6);
          c.fillStyle = g(0.05);
          c.fill();
          c.strokeStyle = g(0.18);
          c.stroke();
          box(x + 10, y + 10, w * 0.5, 4, 2);
          c.fillStyle = g(0.4);
          c.fill();
          box(x + 10, y + 20, w * 0.72, 3, 1.5);
          c.fillStyle = g(0.18);
          c.fill();
        });
        c.restore();
        // which screen it is right now
        const active = f < 0.5 ? i : (i + 1) % 3;
        c.font = FONT;
        c.textAlign = 'center';
        LABELS.slice(0, 3).forEach((label, k) => {
          c.fillStyle = k === active ? ac(0.9) : g(0.3);
          c.fillText(label, cx + (k - 1) * 84, 356);
        });
        c.restore();
        cue(cx, 374, H - 44, tau - 0.8, 'thumb');
      },
    };
  }

  // Prototypes and software: a sketch that gets built.
  function build(): Scene {
    const FW = 340;
    const FH = 228;
    const T0 = 0.9; // the build line starts
    const SWEEP = 4.6;
    const HOLD = 9;
    const BACK = 1;
    const CYCLE = T0 + SWEEP + HOLD + BACK;
    const chart = [0.62, 0.5, 0.56, 0.36, 0.42, 0.2, 0.26, 0.08];
    let tau = RM ? T0 + SWEEP + 1 : 0;
    return {
      frame(dt) {
        tau += dt;
        const t = RM ? T0 + SWEEP + 1 : tau % CYCLE;
        const cx = W / 2;
        const x0 = cx - FW / 2;
        const y0 = 66;
        const k = io(clamp((t - T0) / SWEEP));
        const sx = x0 - 10 + (FW + 20) * k; // the build line
        const back = clamp((t - T0 - SWEEP - HOLD) / BACK); // 0..1: the finished app fades back to the sketch
        const enter = RM ? 1 : out(clamp(tau / 0.7));
        const stroke = (x: number, y: number, w: number, h: number, r: number) => {
          box(x0 + x, y0 + y, w, h, r);
          c.stroke();
        };
        const fill = (x: number, y: number, w: number, h: number, r: number, style: string) => {
          box(x0 + x, y0 + y, w, h, r);
          c.fillStyle = style;
          c.fill();
        };
        const chartPath = () => {
          c.beginPath();
          chart.forEach((v, i) => {
            const x = x0 + 104 + (i * 212) / (chart.length - 1);
            const y = y0 + 118 + v * 52;
            if (i === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          });
        };
        c.save();
        c.globalAlpha = enter;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        // 1. the sketch, right of the build line (everything, once the app has faded back)
        c.save();
        if (back <= 0) {
          c.beginPath();
          c.rect(sx, 0, W, H);
          c.clip();
        }
        c.setLineDash([3, 3]);
        c.strokeStyle = g(0.28);
        c.lineWidth = 1;
        stroke(0, 0, FW, FH, 10);
        line(x0, y0 + 18.5, x0 + FW, y0 + 18.5);
        line(x0 + 78.5, y0 + 18, x0 + 78.5, y0 + FH);
        [34, 52, 70, 88].forEach((y) => stroke(12, y, 54, 8, 3));
        stroke(94, 34, 90, 8, 3);
        stroke(276, 30, 50, 16, 5);
        stroke(94, 58, 110, 44, 6);
        stroke(216, 58, 110, 44, 6);
        stroke(94, 112, 232, 64, 6);
        chartPath();
        c.stroke();
        stroke(94, 188, 232, 8, 3);
        stroke(94, 204, 232, 8, 3);
        c.restore();
        // 2. the built app, left of the line
        if (k > 0 && back < 1) {
          c.save();
          c.globalAlpha = enter * (1 - back);
          c.beginPath();
          c.rect(0, 0, sx, H);
          c.clip();
          fill(0, 0, FW, FH, 10, 'rgba(7,8,12,.6)');
          c.strokeStyle = g(0.34);
          c.lineWidth = 1;
          stroke(0, 0, FW, FH, 10);
          c.save();
          box(x0, y0, FW, FH, 10);
          c.clip();
          fill(0, 18, 78, FH - 18, 0, g(0.035));
          c.strokeStyle = g(0.14);
          line(x0, y0 + 18.5, x0 + FW, y0 + 18.5);
          line(x0 + 78.5, y0 + 18, x0 + 78.5, y0 + FH);
          c.fillStyle = g(0.28);
          for (let d = 0; d < 3; d++) {
            c.beginPath();
            c.arc(x0 + 12 + d * 7, y0 + 9.5, 1.6, 0, TAU);
            c.fill();
          }
          c.restore();
          fill(12, 34, 54, 8, 3, ac(0.2));
          c.strokeStyle = ac(0.6);
          stroke(12, 34, 54, 8, 3);
          [52, 70, 88].forEach((y) => fill(12, y, 54, 8, 3, g(0.14)));
          fill(94, 34, 90, 8, 3, g(0.6));
          fill(276, 30, 50, 16, 5, ac(0.9));
          [94, 216].forEach((x) => {
            fill(x, 58, 110, 44, 6, g(0.05));
            c.strokeStyle = g(0.2);
            stroke(x, 58, 110, 44, 6);
            fill(x + 10, 68, 40, 4, 2, g(0.25));
            fill(x + 10, 80, 56, 9, 3, g(0.55));
          });
          fill(94, 112, 232, 64, 6, g(0.04));
          c.strokeStyle = g(0.2);
          stroke(94, 112, 232, 64, 6);
          chartPath();
          c.strokeStyle = ac(0.95);
          c.lineWidth = 1.6;
          c.stroke();
          c.lineWidth = 1;
          [188, 204].forEach((y) => {
            fill(94, y, 232, 8, 3, g(0.1));
            fill(98, y + 2, 4, 4, 2, ac(0.9));
            fill(108, y + 2.5, 70, 3, 1.5, g(0.3));
          });
          c.restore();
        }
        // 3. the build line itself
        if (k > 0 && k < 1) {
          const edge = Math.min(clamp(k / 0.06), clamp((1 - k) / 0.06));
          c.strokeStyle = ac(0.14 * edge);
          c.lineWidth = 9;
          line(sx, y0 - 6, sx, y0 + FH + 6);
          c.strokeStyle = ac(0.9 * edge);
          c.lineWidth = 1.4;
          line(sx, y0 - 10, sx, y0 + FH + 10);
        }
        // where it is: sketch, prototype, software
        const stage = back > 0.5 || k <= 0 ? 0 : k < 1 ? 1 : 2;
        c.font = FONT;
        c.textAlign = 'center';
        LABELS.slice(0, 3).forEach((label, i) => {
          c.fillStyle = i === stage ? ac(0.9) : i < stage ? g(0.5) : g(0.26);
          c.fillText(label, cx + (i - 1) * 96, y0 + FH + 30);
        });
        c.restore();
        const ready = t - T0 - SWEEP - 0.3;
        cue(cx, 368, H - 44, back > 0 ? -1 : ready, 'solidify');
      },
    };
  }

  // Homepage: loose data becomes one line.
  function dataline(): Scene {
    const MERGE = 112; // where the bits have become the line
    const SPREAD = 150;
    const bits = Array.from({ length: 16 }, (_, i) => ({
      x: (rnd() - 0.5) * SPREAD,
      y: rnd() * MERGE,
      v: 16 + rnd() * 18,
      ch: rnd() < 0.5 ? '0' : '1',
      hot: i % 4 === 0,
    }));
    let tau = 0;
    return {
      frame(dt) {
        tau += dt;
        const fade = 1 - clamp(scrollY / 260);
        if (fade <= 0) return;
        const cx = W / 2;
        const y1 = H - 42;
        c.save();
        c.globalAlpha = fade * (RM ? 1 : out(clamp((tau - 0.6) / 0.9)));
        c.font = '500 9.5px "JetBrains Mono", ui-monospace, monospace';
        c.textAlign = 'center';
        bits.forEach((b) => {
          b.y += b.v * dt;
          if (b.y > MERGE) {
            b.y = 0;
            b.x = (rnd() - 0.5) * SPREAD;
            b.ch = rnd() < 0.5 ? '0' : '1';
          }
          const q = b.y / MERGE;
          // in quickly, then dissolving as it is pulled into the line
          const al = (q < 0.12 ? q / 0.12 : Math.pow(1 - (q - 0.12) / 0.88, 1.5)) * 0.8;
          c.fillStyle = b.hot ? ac(al) : g(al * 0.75);
          c.fillText(b.ch, cx + b.x * Math.pow(1 - q, 1.3), b.y + 8);
        });
        // three strands that close into one point
        c.lineCap = 'round';
        const top = MERGE - 46;
        for (let s = 0; s < 3; s++) {
          c.beginPath();
          for (let y = top; y <= y1 - 2; y += 3) {
            const q = (y - top) / (y1 - top);
            const x = cx + Math.sin(y * 0.075 - tau * 2 + s * 2.1) * 7 * Math.pow(1 - q, 0.9);
            if (y === top) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          const lg = c.createLinearGradient(0, top, 0, y1);
          lg.addColorStop(0, s === 1 ? ac(0) : g(0));
          lg.addColorStop(0.45, s === 1 ? ac(0.7) : g(0.34));
          lg.addColorStop(1, s === 1 ? ac(0.9) : g(0.5));
          c.strokeStyle = lg;
          c.lineWidth = s === 1 ? 1.3 : 1;
          c.stroke();
        }
        // a glint runs down the line and lights the arrowhead when it lands
        const k = RM ? 1.2 : (tau % CUE_PERIOD) / CUE_TRAVEL;
        const arrived = k >= 1 ? 1 - clamp((k - 1) / 1.2) : 0;
        if (k < 1) {
          const from = top + 30;
          const y = lerp(from, y1, k);
          c.strokeStyle = ac(0.22);
          c.lineWidth = 6;
          line(cx, Math.max(from, y - 24), cx, y);
          c.strokeStyle = 'rgba(255,255,255,.9)';
          c.lineWidth = 1.6;
          line(cx, Math.max(from, y - 18), cx, y);
        }
        head(cx, y1, arrived);
        c.restore();
      },
    };
  }

  const scene = ({ rings, responsive, build, dataline } as Record<string, () => Scene>)[kind]?.();
  if (!scene) return;

  let visible = true;
  let started = false;
  const size = () => {
    W = cv.clientWidth;
    H = cv.clientHeight;
    if (!W || !H) return false;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    return true;
  };
  const paint = (dt: number) => {
    c.clearRect(0, 0, W, H);
    scene.frame(dt);
  };
  const start = () => {
    if (started || !size()) return;
    started = true;
    if (RM) {
      paint(0);
      return;
    }
    new IntersectionObserver((es) => (visible = es[0].isIntersecting)).observe(cv);
    let last = performance.now();
    const loop = (now: number) => {
      // the first frame's timestamp can be earlier than `last`: never step backwards
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      if (visible && !document.hidden && W) paint(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  // hidden on narrow screens (display: none): start when it first gets a size, keep the bitmap in step after
  new ResizeObserver(() => {
    if (!started) start();
    else if (size() && RM) paint(0);
  }).observe(cv);
  start();
  // a mouse over a finished scene plays it again
  cv.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse' && !RM && scene.reset && scene.done?.()) scene.reset();
  });
}
