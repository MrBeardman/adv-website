/* Ported from PersonalPortfolio (branch adv-rebrand) src/components/ui/iconShapes.js.
 * Changes for adv-website are marked "ADV:". */

/* ─────────────────────────────────────────────────────────────────────────────
   ICON GEOMETRY

   Data, not JSX, and in its own module for two reasons:

   · Two renderers consume it. <Icon> draws SVG for the DOM; the hero's WebGL
     panels rasterise the same shapes to a CanvasTexture. A second hand-drawn
     copy for the canvas would drift from this one the first time either changed.
   · The scene is loaded lazily and must not drag React in behind it just to
     read a path string.

   Three primitives, all of which both an <svg> and a Path2D can replay:
     { d: '…' }                 SVG path data
     { circle: [cx, cy, r] }
     { rect: [x, y, w, h, rx] }

   All on a 24px grid. Stroke width, caps, joins and colour are the renderer's
   job — a glyph here cannot set them, which is what keeps the set consistent.
   ───────────────────────────────────────────────────────────────────────────── */

export const SHAPES = {
  /* ── Capability rows ─────────────────────────────────────────────────────── */

  // Brand and web presence — a globe, i.e. how you are seen from outside.
  globe: [{ circle: [12, 12, 9] }, { d: 'M3.5 12h17' }, { d: 'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z' }],

  // Custom software — a shell built around a core that is specifically yours.
  diamondCore: [{ d: 'M12 3l9 9-9 9-9-9 9-9Z' }, { rect: [9, 9, 6, 6, 1.5] }],

  // Enterprise and internal systems — racks, i.e. the machinery behind the desk.
  racks: [{ rect: [3, 4, 18, 5, 1.5] }, { rect: [3, 15, 18, 5, 1.5] }, { d: 'M7 9v6' }, { d: 'M17 9v6' }],

  // Secure data exchange — two directions past a checkpoint.
  // The mockup fills the centre dot; the icon contract forbids fill, so it is a
  // 0.9r stroked circle instead. Reads identically at 24px.
  exchange: [{ d: 'M4 9h11l-3-3' }, { d: 'M20 15H9l3 3' }, { circle: [12, 12, 0.9] }],

  // AI and automation — decisions routed away from a person.
  nodes: [
    { circle: [12, 12, 2.5] },
    { circle: [5, 6, 1.6] },
    { circle: [19, 7, 1.6] },
    { circle: [13, 20, 1.6] },
    { d: 'M6.3 7.1 10 10.2' },
    { d: 'M17.7 8.2 14.1 10.7' },
    { d: 'M12.6 17.4 12.2 14.5' },
  ],

  // Graphic design — two primitive forms, overlapping: composition.
  shapes: [{ circle: [9, 9, 5.5] }, { rect: [10.5, 10.5, 10, 10, 1.5] }],

  /* ── Navigation and action ───────────────────────────────────────────────── */

  arrowUpRight: [{ d: 'M7 17 17 7' }, { d: 'M9 7h8v8' }],
  arrowRight: [{ d: 'M4 12h15' }, { d: 'M13 6l6 6-6 6' }],

  // Hero card controls. Chevrons rather than full arrows: the pair sits at 20px
  // in the corner of a moving scene, and a shaft plus head turns to mush there.
  chevronLeft: [{ d: 'M14.5 6 8.5 12l6 6' }],
  chevronRight: [{ d: 'M9.5 6l6 6-6 6' }],
  // Price direction in the Kesia case ticker.
  trendUp: [{ d: 'M6 15l6-6 6 6' }],
  trendDown: [{ d: 'M6 9l6 6 6-6' }],
  menu: [{ d: 'M4 7h16' }, { d: 'M4 12h16' }, { d: 'M4 17h16' }],
  close: [{ d: 'M6 6l12 12' }, { d: 'M18 6 6 18' }],

  /* ── Contact and footer ──────────────────────────────────────────────────── */

  mail: [{ rect: [3, 5, 18, 14, 2] }, { d: 'm3.6 7.2 8.4 5.9 8.4-5.9' }],

  // Sisu Vision partner mark.
  target: [{ circle: [12, 12, 9] }, { circle: [12, 12, 3.2] }],

  /* ── Preview gate ────────────────────────────────────────────────────────── */

  lock: [{ rect: [4, 10.5, 16, 10, 2] }, { d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' }],
  unlock: [{ rect: [4, 10.5, 16, 10, 2] }, { d: 'M8 10.5V7.5a4 4 0 0 1 7.7-1.4' }],
};

export const iconNames = Object.keys(SHAPES);
