/* Studio colours for code that cannot read CSS directly (three.js materials, Canvas2D card faces).
 * Read from the tokens in site.css at runtime, so the scene and the page never disagree.
 * Replaces PersonalPortfolio's brandColors.js (navy / midnight / Signal amber). */

const FALLBACK = {
  bg: '#090a0e',
  surface: '#181b24',
  text: '#f1f2f5',
  muted: '#9298a8',
  ice: '#7cc8ff',
  // the navy light the page uses behind key areas (--adv-glow is rgba(32,64,170,.3))
  navy: '#2040aa',
};

function read(name, token) {
  if (typeof document === 'undefined') return FALLBACK[name];
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v : FALLBACK[name];
}

export function studio() {
  return {
    bg: read('bg', '--adv-bg'),
    surface: read('surface', '--adv-surface-1'),
    text: read('text', '--adv-text'),
    muted: read('muted', '--adv-muted'),
    ice: read('ice', '--adv-accent'),
    navy: FALLBACK.navy,
  };
}

/** '#rrggbb' → 0xrrggbb, for THREE.Color. */
export const hexToInt = (hex) => parseInt(hex.replace('#', ''), 16);

/** Mix two '#rrggbb' colours; t = 0 → a, t = 1 → b. */
export function mix(a, b, t) {
  const pa = hexToInt(a);
  const pb = hexToInt(b);
  const ch = (p, s) => (p >> s) & 255;
  const c = (s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${[16, 8, 0].map((s) => c(s).toString(16).padStart(2, '0')).join('')}`;
}

/** 'rgb(r, g, b)' for Canvas2D. */
export function rgb(hex) {
  const p = hexToInt(hex);
  return `rgb(${(p >> 16) & 255}, ${(p >> 8) & 255}, ${p & 255})`;
}
