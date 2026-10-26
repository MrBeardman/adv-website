/**
 * Homepage hero background runner. Draws the 56 px hairline grid and one effect on top of it
 * (HERO_BG.effect in ./tuning.ts), plus a soft lens around a desktop mouse.
 *
 * The runner owns everything an effect should not have to think about: DPR (capped at 2), resizing,
 * a frame cap (HERO_BG.fps), pausing while the hero is off screen, the tab is hidden or a service
 * panel covers the hero, and reduced motion (one still frame, no lens). A new effect is a file that
 * exports a BgEffect (./types.ts) and one line in EFFECTS.
 */
import { HERO_BG } from './tuning';
import { breath } from './breath';
import type { BgEffect, BgFrame } from './types';

const EFFECTS: Record<string, BgEffect> = { breath };

export function initHeroBg(cv: HTMLCanvasElement) {
  const ctx = cv.getContext('2d');
  const effect = EFFECTS[HERO_BG.effect];
  if (!ctx || !effect) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const host = cv.parentElement!;
  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const ink = css('--adv-grid-rgb') || '236,238,244';
  const accent = css('--adv-accent-rgb') || '124,200,255';
  const { cell, strength: S } = HERO_BG;

  let W = 0;
  let H = 0;
  let grid = new Path2D();
  let base: HTMLCanvasElement | null = null;
  let mx = -1e4;
  let my = -1e4;
  let T = RM ? effect.stillTime : 0;
  let onScreen = true;
  let raf = 0;
  let last = 0;
  let dimMask: HTMLCanvasElement | null = null;

  /* Feathered rectangle over [data-herobg-dim] (the copy column), alpha HERO_BG.copyDim, drawn once
   * per size. The feather is a shadow: the rectangle itself sits off the canvas and only its blurred
   * shadow lands on the column (shadowBlur works in every browser; ctx.filter does not). */
  const measureDim = () => {
    dimMask = null;
    const el = host.querySelector<HTMLElement>('[data-herobg-dim]');
    if (!el || HERO_BG.copyDim <= 0 || !cv.width) return;
    const a = el.getBoundingClientRect();
    const r = cv.getBoundingClientRect();
    if (!a.width || !a.height) return;
    const pad = 24;
    const m = document.createElement('canvas');
    m.width = cv.width;
    m.height = cv.height;
    const c = m.getContext('2d')!;
    const off = m.width + 200;
    c.shadowColor = `rgba(0,0,0,${HERO_BG.copyDim})`;
    c.shadowBlur = 56 * DPR;
    c.shadowOffsetX = off;
    c.fillStyle = '#000';
    c.fillRect(
      (a.left - r.left - pad) * DPR - off,
      (a.top - r.top - pad) * DPR,
      (a.width + 2 * pad) * DPR,
      (a.height + 2 * pad) * DPR,
    );
    dimMask = m;
  };

  const frame = (): BgFrame => ({ ctx, W, H, T, S, cell, grid, accent, ink });

  function draw() {
    ctx!.clearRect(0, 0, W, H);
    if (base) {
      // the plain grid is pre-rendered once per size
      ctx!.save();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.drawImage(base, 0, 0);
      ctx!.restore();
    }
    effect.draw(frame());
    // the copy column: punch the feathered dim mask out of everything drawn so far
    if (dimMask) {
      ctx!.save();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.globalCompositeOperation = 'destination-out';
      ctx!.drawImage(dimMask, 0, 0);
      ctx!.restore();
    }
    if (mx > -1e3) {
      const { radius, alpha } = HERO_BG.lens;
      const g = ctx!.createRadialGradient(mx, my, 0, mx, my, radius);
      g.addColorStop(0, `rgba(${accent},${alpha * S})`);
      g.addColorStop(1, `rgba(${accent},0)`);
      ctx!.strokeStyle = g;
      ctx!.stroke(grid);
    }
  }

  function size() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width;
    H = r.height;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    grid = new Path2D();
    for (let x = 0; x <= W; x += cell) {
      grid.moveTo(x + 0.5, 0);
      grid.lineTo(x + 0.5, H);
    }
    for (let y = 0; y <= H; y += cell) {
      grid.moveTo(0, y + 0.5);
      grid.lineTo(W, y + 0.5);
    }
    base = document.createElement('canvas');
    base.width = cv.width;
    base.height = cv.height;
    const b = base.getContext('2d')!;
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    b.strokeStyle = `rgba(${ink},${HERO_BG.baseGrid * S})`;
    b.lineWidth = 1;
    b.stroke(grid);
    effect.resize?.(frame());
    measureDim();
    draw(); // resizing clears the canvas: repaint at once, never a blank frame
  }

  // ---- loop: runs only while it can be seen ----
  const running = () => !RM && onScreen && !document.hidden;
  const tick = (now: number) => {
    raf = 0;
    if (!running()) return;
    raf = requestAnimationFrame(tick);
    const dt = (now - last) / 1000;
    if (dt < 1 / HERO_BG.fps - 0.004) return;
    last = now;
    if (host.hasAttribute('data-open')) return; // a service panel covers the hero
    T += Math.min(dt, 0.1);
    draw();
  };
  const wake = () => {
    if (raf || !running()) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  if (!RM) {
    host.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = cv.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    });
    host.addEventListener('pointerleave', () => {
      mx = my = -1e4;
    });
    document.addEventListener('visibilitychange', wake);
    new IntersectionObserver((es) => {
      onScreen = es[0].isIntersecting;
      wake();
    }).observe(cv);
  }

  let rz = 0;
  new ResizeObserver(() => {
    const r = cv.getBoundingClientRect();
    if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return;
    clearTimeout(rz);
    rz = window.setTimeout(size, 120);
  }).observe(cv);
  size();
  wake();
  // webfonts can change the copy's height
  document.fonts?.ready.then(() => {
    measureDim();
    if (RM) draw();
  });
}
