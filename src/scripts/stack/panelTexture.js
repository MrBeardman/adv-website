/* Ported from PersonalPortfolio (branch adv-rebrand) src/components/redesign/scene/panelTexture.js.
 * Changes for adv-website are marked "ADV:". */

import * as THREE from 'three';
import { SHAPES } from './iconShapes';
import { studio, mix, rgb } from './colors';

/* Bakes one card face: icon, service name, hairline, and the work types it
 * covers.
 *
 * ── This is an emissive map, and that dictates how it is drawn ─────────────
 * The texture drives `emissiveMap`, which samples RGB and IGNORES ALPHA. So the
 * canvas is opaque black and everything is drawn in the brightness it should
 * emit: black emits nothing and lets the panel's own iridescent surface through,
 * brighter pixels glow.
 *
 * Drawing with alpha instead — a 10% white wash for a sheen, say — puts full
 * white in the RGB channels with an alpha nobody reads, and the whole card face
 * lights up like frosted glass. Values here are deliberately low; they are light
 * output, not ink.
 *
 * ── On putting words in a texture ──────────────────────────────────────────
 * Normally the wrong call — untranslatable, invisible to screen readers and
 * crawlers, soft on a tilted surface. Viable here only because all three are
 * answered: the textures are rebuilt on locale change, every string also exists
 * in the DOM twice (the hero's rotating block and the capabilities section), and
 * the texture is drawn well above its on-screen size and sampled with
 * anisotropy. Drop any one and the words go back to the DOM.
 */

// Portrait, matching the card's 1.4 x 1.95 aspect. Drawn above on-screen size so
// the type survives the tilt.
const W = 760;
const H = 1058;
const PAD = 74;

/** Replays one SHAPES entry into a Path2D on the 24px grid. */
function toPath(shape) {
  if (shape.d) return new Path2D(shape.d);
  const p = new Path2D();
  if (shape.circle) {
    const [cx, cy, r] = shape.circle;
    p.arc(cx, cy, r, 0, Math.PI * 2);
    return p;
  }
  const [x, y, w, h, rx] = shape.rect;
  if (typeof p.roundRect === 'function') p.roundRect(x, y, w, h, rx);
  else p.rect(x, y, w, h);
  return p;
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * @param {object}   card
 * @param {string}   card.icon    key from SHAPES
 * @param {string}   card.title   service name
 * @param {string[]} card.covers  work types, rendered as mono lines
 */
export function createPanelTexture({ icon, title = '', covers = [] }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Light output, in brand colours. Values stay low: this is an emissive map.
  // ADV: Studio ink. A faint graphite-navy sheen (the matte card's top light), the icon in Ice,
  // titles in text white, covers in a cool muted grey. Values stay low: this is an emissive map.
  const b = studio();
  const ink = {
    sheenTop: rgb(mix('#000000', mix(b.surface, b.navy, 0.35), 0.62)),
    sheenMid: rgb(mix('#000000', b.surface, 0.3)),
    iconWall: rgb(mix(b.ice, '#000000', 0.42)),
    icon: rgb(b.ice),
    title: rgb(b.text),
    rule: rgb(mix(b.surface, b.ice, 0.32)),
    covers: rgb(mix(b.surface, b.text, 0.6)),
  };

  // Opaque black: emits nothing, so the panel's own surface reads through.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  /* Faint navy sheen down the face: a hint of light on a surface rather than
     a lit panel, and a narrow enough range that it cannot band across 1058px. */
  const sheen = ctx.createLinearGradient(0, 0, W * 0.8, H);
  sheen.addColorStop(0, ink.sheenTop);
  sheen.addColorStop(0.5, ink.sheenMid);
  sheen.addColorStop(1, 'rgb(0, 0, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  /* ── Icon, engraved ────────────────────────────────────────────────────────
     Three passes of the same paths, offset along Y in grid units.
     Engraving is read entirely from which edge of a groove is lit. With a light
     source above, the upper wall of a cut is in shadow and the lower wall
     catches it — so the dark pass sits ABOVE the stroke and the bright pass
     BELOW it. Reverse the two and the same drawing reads as embossed instead.

     On an emissive map "shadow" means emitting less than the surrounding face,
     which is only possible because the sheen underneath is not pure black. That
     is why the dark pass is drawn at 0 rather than at some grey: it is the
     absence of light in the groove, and it is what gives the bright pass an edge
     to sit against instead of a glow floating on a flat surface. */
  const shapes = SHAPES[icon];
  if (shapes) {
    const span = 132;
    const scale = span / 24;
    ctx.save();
    ctx.translate(PAD, PAD);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pass = (dy, width, style) => {
      ctx.save();
      ctx.translate(0, dy);
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      shapes.forEach((shape) => ctx.stroke(toPath(shape)));
      ctx.restore();
    };

    // Shadow above, then the lit lower wall, then the stroke itself on top.
    pass(-0.36, 1.15, 'rgb(0, 0, 0)');
    pass(0.4, 1.05, ink.iconWall);
    pass(0, 0.9, ink.icon);

    ctx.restore();
  }

  /* ── Service name ──────────────────────────────────────────────────────── */
  const titleSize = 68;
  ctx.font = `700 ${titleSize}px Urbanist, sans-serif`; // ADV: static Urbanist
  ctx.textBaseline = 'top';

  /* Same engraving, one pass fewer — type carries its own edges, so a shadow
     above and the face itself is enough. Lifted from rgb(196,204,226): the
     panel is dark, tilted and seen through bloom, all three of which cost
     contrast before it reaches the eye. */
  let y = PAD + 214;
  for (const line of wrap(ctx, title, W - PAD * 2)) {
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillText(line, PAD, y - 2);
    ctx.fillStyle = ink.title;
    ctx.fillText(line, PAD, y);
    y += titleSize * 1.14;
  }

  /* ── Hairline ──────────────────────────────────────────────────────────── */
  y += 46;
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(PAD, y - 2, W - PAD * 2, 2);
  ctx.fillStyle = ink.rule;
  ctx.fillRect(PAD, y, W - PAD * 2, 2);

  /* ── Covers ────────────────────────────────────────────────────────────── */
  y += 54;
  ctx.font = '600 30px Manrope, sans-serif'; // ADV: static Manrope
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2.4px';
  for (const item of covers) {
    const text = item.toUpperCase();
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillText(text, PAD, y - 2);
    ctx.fillStyle = ink.covers;
    ctx.fillText(text, PAD, y);
    y += 52;
  }

  /* Dither the whole face. The sheen spans a handful of 8-bit steps over a
     thousand pixels, which is exactly the width at which gradients band — and
     because this is an emissive map, any banding is amplified by the material
     rather than hidden by it. */
  const noise = ctx.getImageData(0, 0, W, H);
  const d = noise.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 3;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(noise, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/* Canvas2D does not wait for webfonts. Calling this before the first bake is the
 * difference between Urbanist and whatever the system substitutes — and because the
 * result is baked, a late font never corrects itself. */
export function waitForFonts() {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  // Request the exact faces the bake uses: fonts.ready alone only covers faces
  // something on the page has already asked for.
  return Promise.all([document.fonts.load('700 68px Urbanist', 'AÁČ'), document.fonts.load('600 30px Manrope', 'AÁČ')])
    .catch(() => {})
    .then(() => document.fonts.ready);
}
