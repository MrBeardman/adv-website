/**
 * Breathing floor (option B of ADV\inspo\adv-hero-bg.html, drawBreath()).
 *
 * A wide, slow band of Ice light crosses the grid diagonally, bottom-left corner to top-right
 * corner, then starts again. Inside the band the grid lines brighten (a linear gradient stroke along
 * the diagonal), the cells get a very faint fill, and the crossings sparkle where the band peaks.
 * Every number lives in ./tuning.ts (BREATH).
 */
import { BREATH as B } from './tuning';
import type { BgEffect, BgFrame } from './types';

// grid crossings as [x, y, d] triples; d = position along the diagonal (0 bottom-left, 1 top-right)
let crossings = new Float32Array(0);

export const breath: BgEffect = {
  stillTime: B.still * B.period,

  resize({ W, H, cell }: BgFrame) {
    const pts: number[] = [];
    for (let x = 0; x <= W; x += cell) for (let y = 0; y <= H; y += cell) pts.push(x, y, (x / W + (1 - y / H)) / 2);
    crossings = Float32Array.from(pts);
  },

  draw({ ctx, W, H, T, S, grid, accent }: BgFrame) {
    // the band runs past both corners, so it enters and leaves the frame softly
    const p = ((T / B.period) % 1) * (1 + 2 * B.falloff) - B.falloff;
    const lg = ctx.createLinearGradient(0, H, W, 0);
    const stop = (o: number, a: number) => {
      const k = p + o;
      if (k > 0 && k < 1) lg.addColorStop(k, `rgba(${accent},${a * S})`);
    };
    lg.addColorStop(0, `rgba(${accent},0)`);
    stop(-B.falloff, 0);
    stop(-B.falloff / 2, B.shoulder);
    stop(0, B.peak);
    stop(B.falloff / 2, B.shoulder);
    stop(B.falloff, 0);
    lg.addColorStop(1, `rgba(${accent},0)`);

    // brighter grid lines inside the band
    ctx.lineWidth = 1;
    ctx.strokeStyle = lg;
    ctx.stroke(grid);
    // a very faint fill of the cells, like a lit floor
    ctx.globalAlpha = B.fill;
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);
    // crossings sparkle where the band is brightest
    ctx.fillStyle = `rgb(${accent})`;
    for (let i = 0; i < crossings.length; i += 3) {
      const q = (crossings[i + 2] - p) / B.sparkleWidth;
      const k = Math.exp(-q * q);
      if (k <= 0.05) continue;
      ctx.globalAlpha = B.sparkle * k * S;
      ctx.fillRect(crossings[i] - 1, crossings[i + 1] - 1, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  },
};
