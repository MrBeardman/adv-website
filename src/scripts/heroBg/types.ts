/** What the runner hands an effect each frame (CSS px; the context is already scaled for DPR). */
export interface BgFrame {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  /** Seconds of visible running time (stops while paused). */
  T: number;
  /** Overall strength (HERO_BG.strength). */
  S: number;
  cell: number;
  /** The whole hairline grid as one path, rebuilt on resize. */
  grid: Path2D;
  /** "r,g,b" of the accent (Ice) and of the grid ink, from the CSS tokens. */
  accent: string;
  ink: string;
}

/** A hero background effect. The runner (./index.ts) owns sizing, the loop, pausing, the plain
 * base grid and the mouse lens; an effect only paints its own layer on top of the base grid. */
export interface BgEffect {
  /** Called after every resize, before the next draw. */
  resize?(f: BgFrame): void;
  draw(f: BgFrame): void;
  /** Reduced motion: T of the one still frame. */
  stillTime: number;
}
