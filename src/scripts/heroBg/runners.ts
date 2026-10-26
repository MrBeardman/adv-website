/**
 * Light runners (option A of ADV\inspo\adv-hero-bg.html, drawRunners(), as Honza asked for it:
 * pure thin lines). Short Ice trails run along the grid lines with a tail fading to nothing and turn
 * at a crossing now and then. No glowing heads, no glowing crossings. A few extra start near a
 * desktop mouse. Spawns keep clear of the copy column. Every number lives in ./tuning.ts (RUNNERS).
 * Reduced motion: none are drawn (the still frame is the breathing floor alone).
 */
import { RUNNERS as R } from './tuning';
import type { BgEffect, BgFrame } from './types';

type Runner = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  sp: number;
  life: number;
  max: number;
  /** corners passed, oldest first; the trail is corners + head, trimmed to R.tail */
  pts: number[][];
};

let list: Runner[] = [];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function spawn(f: BgFrame, near: boolean) {
  const { W, H, cell, avoid } = f;
  const cols = Math.floor(W / cell);
  const rows = Math.floor(H / cell);
  for (let k = 0; k < 12; k++) {
    let c = (Math.random() * (cols + 1)) | 0;
    let r = (Math.random() * (rows + 1)) | 0;
    if (near) {
      c = Math.round(f.mx / cell) + (((Math.random() * 3) | 0) - 1);
      r = Math.round(f.my / cell) + (((Math.random() * 3) | 0) - 1);
    }
    const x = c * cell;
    const y = r * cell;
    const p = R.avoidPad;
    if (avoid && x > avoid[0] - p && x < avoid[2] + p && y > avoid[1] - p && y < avoid[3] + p) continue;
    const h = Math.random() < 0.5;
    const s = Math.random() < 0.5 ? 1 : -1;
    list.push({
      x,
      y,
      dx: h ? s : 0,
      dy: h ? 0 : s,
      sp: rand(R.speed[0], R.speed[1]),
      life: 0,
      max: rand(R.life[0], R.life[1]),
      pts: [[x, y]],
    });
    return;
  }
}

/** Walk back from the head along the corners until R.tail px; drop corners beyond it. Returns the
 * polyline tail → head. */
function trail(r: Runner) {
  const out: number[][] = [[r.x, r.y]];
  let left = R.tail;
  let hx = r.x;
  let hy = r.y;
  for (let i = r.pts.length - 1; i >= 0; i--) {
    const [px, py] = r.pts[i];
    const d = Math.abs(hx - px) + Math.abs(hy - py);
    if (d >= left) {
      const k = left / (d || 1);
      out.push([hx + (px - hx) * k, hy + (py - hy) * k]);
      r.pts.splice(0, i); // older corners are no longer part of the tail
      return out.reverse();
    }
    left -= d;
    out.push([px, py]);
    hx = px;
    hy = py;
  }
  return out.reverse();
}

/** Move one axis by v (signed); if a grid line is passed, maybe turn there. */
function step(r: Runner, cell: number, v: number) {
  const horizontal = r.dx !== 0;
  const p = horizontal ? r.x : r.y;
  const q = p + v;
  const b = v > 0 ? (Math.floor(p / cell + 1e-6) + 1) * cell : (Math.ceil(p / cell - 1e-6) - 1) * cell;
  const passed = v > 0 ? q >= b : q <= b;
  if (passed && Math.random() < R.turn) {
    if (horizontal) r.x = b;
    else r.y = b;
    r.pts.push([r.x, r.y]);
    const s = Math.random() < 0.5 ? 1 : -1;
    if (horizontal) {
      r.dx = 0;
      r.dy = s;
    } else {
      r.dy = 0;
      r.dx = s;
    }
    return;
  }
  if (horizontal) r.x = q;
  else r.y = q;
}

export const runners: BgEffect = {
  resize() {
    list = [];
  },

  draw(f: BgFrame) {
    if (f.still) return;
    const { ctx, W, H, dt, S, cell, accent } = f;
    if (dt > 0) {
      while (list.length < R.count) spawn(f, false);
      if (f.mx > -1e3 && list.length < R.max && Math.random() < dt * R.mouseRate) spawn(f, true);
    }
    ctx.lineWidth = R.width;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (dt > 0) {
        r.life += dt;
        step(r, cell, (r.dx || r.dy) * r.sp * dt);
      }
      const gone = r.x < -cell || r.y < -cell || r.x > W + cell || r.y > H + cell;
      if (r.life > r.max || gone) {
        list.splice(i, 1);
        continue;
      }
      const fade = Math.max(0, Math.min(1, r.life / R.fadeIn, (r.max - r.life) / R.fadeOut));
      const pts = trail(r);
      if (pts.length < 2 || fade <= 0) continue;
      const [ax, ay] = pts[0];
      const lg = ctx.createLinearGradient(ax, ay, r.x, r.y);
      lg.addColorStop(0, `rgba(${accent},0)`);
      lg.addColorStop(1, `rgba(${accent},${R.alpha * fade * S})`);
      ctx.beginPath();
      ctx.moveTo(ax + 0.5, ay + 0.5);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0] + 0.5, pts[k][1] + 0.5);
      ctx.strokeStyle = lg;
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  },
};
