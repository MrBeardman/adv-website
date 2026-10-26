/** What the runner hands an effect each frame (CSS px; the context is already scaled for DPR). */
export interface BgFrame {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  /** Seconds of visible running time (stops while paused). */
  T: number;
  /** Seconds since the previous drawn frame (0 on a still or resize repaint). */
  dt: number;
  /** Overall strength (HERO_BG.strength). */
  S: number;
  cell: number;
  /** The whole hairline grid as one path, rebuilt on resize. */
  grid: Path2D;
  /** "r,g,b" of the accent (Ice) and of the grid ink, from the CSS tokens. */
  accent: string;
  ink: string;
  /** Desktop mouse position, or -1e4 when there is none (touch, outside, reduced motion). */
  mx: number;
  my: number;
  /** Reduced motion: this is the one still frame. */
  still: boolean;
  /** The copy column ([data-herobg-dim]) as [x0, y0, x1, y1], or null. Effects may keep clear of it;
   * the runner also dims everything behind it after the effects have drawn. */
  avoid: number[] | null;
}

/** A hero background effect. The runner (./index.ts) owns sizing, the loop, pausing, the plain
 * base grid, the copy dim and the mouse lens; an effect only paints its own layer. */
export interface BgEffect {
  /** Called after every resize, before the next draw. */
  resize?(f: BgFrame): void;
  draw(f: BgFrame): void;
  /** Reduced motion: T of the one still frame (the first effect that sets it wins). */
  stillTime?: number;
}
