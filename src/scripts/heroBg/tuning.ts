/**
 * Homepage hero background: every knob in one place.
 *
 * `effects` lists the effects drawn on the hero grid, bottom to top, in one canvas and one loop (see
 * ./index.ts for the registry): 'breath' (the breathing floor) and 'runners' (thin light trails),
 * Honza's picks, Oct 2026. Remove a name to switch that effect off.
 */
export const HERO_BG = {
  effects: ['breath', 'runners'],
  /** Overall strength, the prototype's slider (adv-hero-bg.html). 1 = the approved look. */
  strength: 1,
  /** Grid cell in CSS px (the same 56 px grid as the rest of the site). */
  cell: 56,
  /** Alpha of the plain hairline grid under the effect. */
  baseGrid: 0.05,
  /** Frames drawn per second. The band alone looks the same at 30; the thin runners step visibly
   * at 30 (7-9 px per frame), so 60. Measured with fps_bg.py: the card stack keeps 60 fps. */
  fps: 60,
  /** Soft lens of light around a desktop mouse (radius px, alpha). Never on touch. */
  lens: { radius: 200, alpha: 0.12 },
  /** Share of the background removed behind the copy column ([data-herobg-dim]), feathered, so the
   * headline and sub read cleanly while the band passes. */
  copyDim: 0.75,
};

/** Breathing floor: a wide band of Ice light that crosses the grid from the bottom-left corner to
 * the top-right corner, then starts again. */
export const BREATH = {
  /** Seconds per pass. */
  period: 9,
  /** Grid-line alpha at the centre of the band. */
  peak: 0.32,
  /** Alpha at the shoulder (±half the falloff). */
  shoulder: 0.1,
  /** Half-width of the band, as a share of the diagonal (0..1). */
  falloff: 0.3,
  /** Fill of the cells inside the band, as a share of the line gradient. */
  fill: 0.28,
  /** Crossing sparkle: peak alpha and width (share of the diagonal). */
  sparkle: 0.5,
  sparkleWidth: 0.06,
  /** Reduced motion: the single still frame shows the band at this point of its pass (0..1). */
  still: 0.5,
};

/** Light runners: thin Ice trails running along the grid lines, turning at crossings now and then.
 * Pure lines: no glowing heads, no glowing crossings. */
export const RUNNERS = {
  /** Runners kept alive at once (random spawns top up to this). */
  count: 6,
  /** Extra runners spawned near a desktop mouse, per second, and the hard ceiling with them. */
  mouseRate: 1,
  max: 9,
  /** Line width (px) and alpha at the head; the tail fades to 0. */
  width: 1.2,
  alpha: 0.7,
  /** Speed range, px per second. */
  speed: [140, 260],
  /** Tail length, px. */
  tail: 150,
  /** Chance to turn at each crossing passed. */
  turn: 0.22,
  /** Lifetime range (s), fade in and fade out (s). */
  life: [2.5, 5],
  fadeIn: 0.4,
  fadeOut: 0.6,
  /** Keep spawns this far (px) from the copy column. */
  avoidPad: 56,
};
