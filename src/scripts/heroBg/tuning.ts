/**
 * Homepage hero background: every knob in one place.
 *
 * EFFECT picks the effect drawn on the hero grid (see ./index.ts for the registry). Only 'breath'
 * (the breathing floor, Honza's pick, Oct 2026) exists today; 'runners' (light runners, his second
 * favourite) would be a new file next to breath.ts plus one line in the registry.
 */
export const HERO_BG = {
  effect: 'breath' as const,
  /** Overall strength, the prototype's slider (adv-hero-bg.html). 1 = the approved look. */
  strength: 1,
  /** Grid cell in CSS px (the same 56 px grid as the rest of the site). */
  cell: 56,
  /** Alpha of the plain hairline grid under the effect. */
  baseGrid: 0.05,
  /** Frames drawn per second. The band is slow and soft, so 30 is indistinguishable from 60 and
   * leaves the main thread to the card stack. */
  fps: 30,
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
