/**
 * Homepage hero engine (components/home/HeroFlow.astro), Honza Oct 29 2026 ("like amaze-genius, in our
 * colours"), Nov 3 2026 ("we take your scattered data and make it coherent"). On the left there are no lines:
 * a loose cloud of points and bits of data (digits, symbols, records) floats around at random, and one by one
 * they get pulled, swirling, into the A of the ADV mark, a solid graphite letter that floats a little and
 * catches a drifting gloss (the organiser at work). Only there do the lines begin: they leave as a smooth,
 * slowly twisting ribbon of four strands that fans out (a business that runs). Pulses of light travel along
 * every line: the data going through. Colour runs violet
 * → cobalt → ice along the stream; after the gate each line keeps a colour of its own and the ribbon is
 * shaded (folds and the far side dimmer, lines at uneven strength); additive blending gives the silk sheen.
 *
 * Every vertex position is computed in the vertex shader from (line, u) and one time uniform; the CPU only
 * writes a few uniforms per frame. A moving pointer draws nearby lines gently towards it, like a weak
 * magnet; when it rests or leaves, they ease back into shape (fine pointers only).
 * Pauses off screen and in a hidden tab; reduced motion renders one still frame.
 */
import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  attribute vec2 aLU;       // line (0..1), position along it (0..1)
  attribute float aSeed;    // per line
  varying float vU;
  varying float vLine;
  varying float vSeed;
  varying float vOrder;
  varying float vFace;
  varying float vBand;
  varying float vDepth;
  varying float vGate;

  void main() {
    float L = 15.0;
    float x = (aLU.y - 0.5) * L;
    float t = uTime;
    vU = aLU.y;
    vLine = aLU.x;
    vSeed = aSeed;

    // ordered: a ribbon of near-parallel lines that twists slowly as it travels. It is made of four
    // strands, each with its own twist and lift, and fans out downstream with every line drifting a
    // little on its own, so it reads as many threads with folds and depth, not one cable.
    float down = smoothstep(0.8, 7.0, x);
    float band = floor(aLU.x * 3.999);
    float inBand = fract(aLU.x * 3.999) - 0.5;
    float bandC = (band + 0.5) / 4.0 - 0.5;
    float w = 1.25 * (1.0 + down * 0.7);
    float across = (bandC + inBand * 0.25 * (1.0 + down * 1.6)) * w;
    across += sin(x * 1.1 + aSeed * 40.0 + t * 0.3) * 0.07 * down;
    float twist = x * 0.32 - t * 0.12 + band * 0.55 * down;
    float lift = sin(x * 0.42 - t * 0.35 + band * 0.8 * down) * 0.45;
    vec3 ordered = vec3(x, lift + across * cos(twist), across * sin(twist));
    // facing: a ribbon seen edge-on stacks its lines; dim those folds so the sheet gets shading
    vFace = mix(0.35, 1.0, abs(cos(twist)));
    vBand = band;

    // tangled: every line wanders on its own
    float s = aSeed * 50.0;
    vec3 tangled = vec3(
      x,
      sin(x * (0.9 + aSeed * 0.8) + s + t * 0.5) * (0.8 + aSeed * 1.2) + sin(x * 2.3 + s * 1.7 + t) * 0.25,
      cos(x * (0.7 + aSeed) + s * 1.3 + t * 0.4) * (0.7 + aSeed)
    );

    tangled.yz *= 0.55; // the wisps just before the gate stay inside the tunnel

    // the gate sits at x = 0.6: tangled before it, ordered after it, everything squeezed through it
    float k = smoothstep(-2.4, 1.6, x);
    vOrder = k;
    vec3 p = mix(tangled, ordered, k);
    float squeeze = exp(-pow((x - 0.6) * 0.85, 2.0));
    vGate = exp(-pow((x - 0.6) * 3.0, 2.0));
    // through the A's opening: narrow across (z, the A's width), taller up and down (y)
    p.y = mix(p.y, p.y * 0.12, squeeze);
    p.z = mix(p.z, p.z * 0.05, squeeze);
    vDepth = p.z;

    // a weak magnet: lines near the pointer lean a little towards it
    vec2 d = uMouse - p.xy;
    p.xy += d * (uMouseOn * 0.18 * exp(-dot(d, d) * 1.4));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  const float LINES_FROM = 0.425; // along the stream (0..1); the gate is at 0.54
  uniform float uTime;
  varying float vU;
  varying float vLine;
  varying float vSeed;
  varying float vOrder;
  varying float vFace;
  varying float vBand;
  varying float vDepth;
  varying float vGate;

  void main() {
    vec3 violet = vec3(0.46, 0.27, 0.95);
    vec3 cobalt = vec3(0.16, 0.38, 1.0);
    vec3 ice = vec3(0.62, 0.86, 1.0);
    // along the stream, and a little across the ribbon so its edges read as silk
    float g = clamp(vU * 1.15 - 0.1 + (vLine - 0.5) * 0.25 * vOrder, 0.0, 1.0);
    vec3 col = mix(violet, cobalt, smoothstep(0.15, 0.55, g));
    col = mix(col, ice, smoothstep(0.52, 0.82, g));
    // after the gate every line keeps a colour of its own (violet, cobalt, ice, deep navy), mixed by strand
    // and by line, so the ribbon stays as varied as the tangle
    vec3 navy = vec3(0.12, 0.2, 0.62);
    float pick = fract(vSeed * 3.7 + vBand * 0.27);
    vec3 own = pick < 0.25 ? violet : pick < 0.5 ? cobalt : pick < 0.75 ? ice : navy;
    col = mix(col, own, 0.6 * vOrder);

    // data pulses: short bright dashes travelling along each line
    float ph = fract(vU * 2.2 - uTime * (0.16 + vSeed * 0.08) + vSeed * 7.0);
    float pulse = smoothstep(0.035, 0.0, abs(ph - 0.5)) * (0.4 + vOrder);

    // the lines only exist from just before the gate: left of it there are only the loose points (DATA_VERT)
    float edge = smoothstep(LINES_FROM, LINES_FROM + 0.09, vU) * (1.0 - smoothstep(0.9, 1.0, vU));
    // shading after the gate: folds dimmer (vFace), the far side darker (vDepth), lines at uneven strength
    float shade = mix(1.0, vFace * (0.6 + 0.4 * smoothstep(-0.9, 0.9, vDepth)) * (0.45 + 0.75 * fract(vSeed * 9.1)), vOrder);
    // passing the gate: the lines flare, each in its own beat, as they are sorted
    float flare = vGate * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 2.4 + vSeed * 40.0), 6.0));
    float a = (mix(0.12, 0.2, vOrder) * shade + pulse * 0.9 + flare * 0.5) * edge;
    gl_FragColor = vec4(col + pulse * 0.6 + flare * 0.5, a);
  }
`;

// The scattered data, left of the gate: each point floats around on its own for most of its life, then gets
// pulled in (swirling, faster and faster, brighter) to the gate, where the lines take over, and starts again
// somewhere else. Computed from one time uniform like the lines. All knobs here:
const DATA = {
  perPoint: 7, // opts.count / perPoint = number of points
  glyphs: 0.32, // share of points drawn as a digit, symbol or record instead of a dot
  streaks: 0.45, // share of points that draw a streak behind them while being pulled in
};
const DATA_COMMON = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  uniform float uWide;     // 1: the copy sits left of the gate; 0: below it
  attribute vec4 aS;       // four random numbers per point
  varying float vAlpha;
  varying float vPull;
  varying float vTone;

  const float FLOAT_SHARE = 0.5;                 // of its life a point just floats
  const vec3 GATE = vec3(0.6, 0.0, 0.0);
  // the points float in a tunnel along the stream that opens slightly away from the gate (Honza, Nov 4 2026)
  const vec2 TUNNEL_X = vec2(-6.2, -0.4);        // far end, gate end
  const float TUNNEL_FAR = 1.0;                  // radius at the far end
  const float TUNNEL_NEAR = 0.45;                // radius at the gate end
  const float STRAY = 0.1;                       // share of points floating a little outside the tunnel
  const float STRAY_R = 1.6;                     // how far outside, as a multiple of the radius
  const float WANDER_R = 0.4;                    // sideways wander, as a share of the lengthwise wander

  float lifeAt(float t) {
    return t * mix(0.042, 0.08, aS.w) + aS.x * 17.0 + aS.y * 5.0;
  }
  float pullAt(float t) {
    return smoothstep(FLOAT_SHARE, 1.0, fract(lifeAt(t)));
  }
  vec3 dataPos(float t) {
    float l = lifeAt(t);
    // a new home for every life, so the cloud never repeats a pattern; more of them close to the gate
    vec3 r = fract(aS.xyz * 43.7 + floor(l) * vec3(0.137, 0.271, 0.413));
    float hx = mix(TUNNEL_X.x, TUNNEL_X.y, pow(r.x, 0.6));
    float radius = mix(TUNNEL_NEAR, TUNNEL_FAR, smoothstep(TUNNEL_X.y, TUNNEL_X.x, hx));
    if (fract(aS.w * 91.0) < STRAY) radius *= STRAY_R;
    float around = r.y * 6.2832;
    float rad = radius * sqrt(r.z);
    vec3 home = vec3(hx, cos(around) * rad, sin(around) * rad);
    // no common motion at all: every point wanders at its own speeds in its own directions
    vec3 f = 0.09 + aS.wzy * 0.22;
    vec3 ph = aS.yzx * 40.0;
    home += vec3(
      sin(t * f.x + ph.x) * 0.7 + sin(t * f.y * 2.3 + ph.z) * 0.28,
      (sin(t * f.y + ph.y) * 0.6 + cos(t * f.z * 2.1 + ph.x) * 0.26) * WANDER_R,
      cos(t * f.z + ph.z) * 0.6 * WANDER_R
    );
    float pull = smoothstep(FLOAT_SHARE, 1.0, fract(l));
    float k = pull * pull * pull;
    vec3 p = mix(home, GATE + vec3(-0.25, (aS.y - 0.5) * 0.16, (aS.z - 0.5) * 0.08), k);
    // the swirl on the way in, each point its own way round, tightening towards the opening
    float a = pull * pull * (aS.x < 0.5 ? -1.0 : 1.0) * (1.2 + aS.z * 2.4);
    float ca = cos(a);
    float sa = sin(a);
    p.yz = mat2(ca, -sa, sa, ca) * p.yz;
    // the same weak magnet as the lines, stronger here: the pointer stirs the loose points
    vec2 d = uMouse - p.xy;
    p.xy += d * (uMouseOn * 0.3 * exp(-dot(d, d) * 0.9)) * (1.0 - k);
    return p;
  }
  // born softly, gone at the gate, and only a few stray over the copy so it stays clean
  float dataAlpha(float t, vec4 clip) {
    float life = fract(lifeAt(t));
    vec2 n = clip.xy / clip.w;
    float clear = uWide > 0.5 ? smoothstep(-0.3, 0.02, n.x) : smoothstep(0.1, 0.32, n.y);
    return smoothstep(0.0, 0.06, life) * (1.0 - smoothstep(0.975, 1.0, life)) * mix(0.03, 1.0, clear);
  }
`;
const DATA_VERT = /* glsl */ `
  ${DATA_COMMON}
  uniform float uPx;
  attribute float aGlyph;  // atlas cell, -1 for a plain dot
  varying float vGlyph;

  void main() {
    float t = uTime;
    float pull = pullAt(t);
    vec4 mv = modelViewMatrix * vec4(dataPos(t), 1.0);
    gl_Position = projectionMatrix * mv;
    bool glyph = aGlyph >= 0.0;
    float size = glyph ? mix(13.0, 23.0, aS.z) : mix(2.0, 5.5, aS.y * aS.y);
    gl_PointSize = size * uPx * (8.0 / -mv.z) * mix(1.0, 0.65, pull * pull);
    float twinkle = 0.7 + 0.3 * sin(t * (0.7 + aS.w * 1.6) + aS.x * 60.0);
    vAlpha = dataAlpha(t, gl_Position) * twinkle * mix(mix(0.55, 1.0, aS.w), 1.0, pull) * (glyph ? 1.0 : 0.9);
    vPull = pull;
    vGlyph = aGlyph;
    vTone = aS.z;
  }
`;
// a streak behind a point being pulled in: the same point a moment ago, so it needs no state. Grows with the pull.
const DATA_TAIL_VERT = /* glsl */ `
  ${DATA_COMMON}
  attribute float aEnd;    // 0 at the point, 1 at the far end of the streak
  varying float vEnd;

  void main() {
    float pull = pullAt(uTime);
    float t = uTime - aEnd * pull * mix(0.14, 0.34, aS.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(dataPos(t), 1.0);
    vAlpha = dataAlpha(uTime, gl_Position) * smoothstep(0.1, 0.6, pull) * 0.42;
    vPull = pull;
    vTone = aS.z;
    vEnd = aEnd;
  }
`;
const DATA_PALETTE = /* glsl */ `
  // scattered: violet to cobalt, as random as the rest; pulled in: towards the ice of the stream
  vec3 dataColour(float tone, float pull) {
    vec3 violet = vec3(0.56, 0.38, 1.0);
    vec3 cobalt = vec3(0.3, 0.52, 1.0);
    vec3 ice = vec3(0.76, 0.92, 1.0);
    return mix(mix(violet, cobalt, tone), ice, smoothstep(0.1, 0.9, pull));
  }
`;
const DATA_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uAtlas;
  uniform float uCells;
  varying float vAlpha;
  varying float vPull;
  varying float vGlyph;
  varying float vTone;
  ${DATA_PALETTE}

  void main() {
    float m;
    if (vGlyph < 0.0) {
      m = smoothstep(0.5, 0.2, length(gl_PointCoord - 0.5));
    } else {
      vec2 cell = vec2(mod(vGlyph, uCells), floor(vGlyph / uCells));
      m = texture2D(uAtlas, (cell + gl_PointCoord) / uCells).r;
    }
    gl_FragColor = vec4(dataColour(vTone, vPull), m * vAlpha);
  }
`;
const DATA_TAIL_FRAG = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  varying float vPull;
  varying float vTone;
  varying float vEnd;
  ${DATA_PALETTE}

  void main() {
    gl_FragColor = vec4(dataColour(vTone, vPull), vAlpha * (1.0 - vEnd));
  }
`;
// the bits of data: a small atlas of digits and symbols drawn once on a canvas, plus a few "records"
const DATA_CHARS = ['0', '1', '0', '1', '#', '{', '}', '/', '%', '@', '=', '<', '>'];
const DATA_RECORDS = 3;
function dataAtlas() {
  const cells = 4;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = cells * size;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `500 ${size * 0.72}px ui-monospace, Consolas, Menlo, monospace`;
  const at = (i: number) => [(i % cells) * size, Math.floor(i / cells) * size];
  DATA_CHARS.forEach((ch, i) => {
    const [x, y] = at(i);
    g.fillText(ch, x + size / 2, y + size / 2);
  });
  // records: two or three short rows, like a line of a table
  for (let i = 0; i < DATA_RECORDS; i++) {
    const [x, y] = at(DATA_CHARS.length + i);
    for (let row = 0; row < 2 + (i % 2); row++) {
      const w = size * (0.8 - ((row + i) % 3) * 0.2);
      g.fillRect(x + size * 0.1, y + size * (0.26 + row * 0.22), w, size * 0.09);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false; // gl_PointCoord runs top to bottom, like the canvas
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return { tex, cells };
}

// the A of the ADV symbol (data/logoPaths.ts SYMBOL_TILE) in the gate's plane, from the 256-unit logo
// grid, centred on its opening (between the legs, below the inner apex) so the lines pass inside the A
const S = 0.012;
const P = (x: number, y: number) => new THREE.Vector3((x - 128) * S * 1.25, -(y - 204) * S, 0);
const A_PTS = [
  [112, 56],
  [144, 56],
  [193.3, 240],
  [159.3, 240],
  [128, 123.2],
  [96.7, 240],
  [62.7, 240],
  [112, 56],
];
const A_DEPTH = 0.1;
// the solid letter: the A extruded, with a small bevel
function gateSolid() {
  const shape = new THREE.Shape(A_PTS.slice(0, -1).map(([x, y]) => new THREE.Vector2(P(x, y).x, P(x, y).y)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: A_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  geo.translate(0, 0, -A_DEPTH / 2);
  return geo;
}

// the A's surface: the graphite of the cards, lit by the page. Near-black with a cool gradient; a cobalt
// wash from below and a violet one from above (the page light); the data passing through its opening lights
// the inner legs ice-blue; edges and rim catch a pale light that runs ice → violet; a slow sheen crosses it.
const SOLID_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vObjN;
  varying vec3 vP;
  varying vec3 vView;
  void main() {
    vObjN = normal;
    vN = normalize(normalMatrix * normal);
    vP = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
const SOLID_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vObjN;
  varying vec3 vP;
  varying vec3 vView;

  // ---- surface texture (Honza, Nov 1 2026: "the A looks flat"): brushed graphite streaks, fine grain and a
  // soft studio reflection sliding across the face. Procedural, and each layer fades out by pixel size
  // (fwidth) so a small A (phones) stays calm, not shimmery. Faceted planes and an etched grid were tried
  // and dropped (facets are the alternative to the brush; they do not combine well).
  const float BRUSH = 0.55;   // streak contrast and how much the highlight stretches along them
  const float GRAIN = 0.022;  // fine noise, like the page grain
  const float REFL = 1.0;     // softbox reflection strength
  float h11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float h21(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  // 1D value noise across the brush direction, slowly wandering along it so streaks are not ruler-straight
  float streak(vec2 p) {
    float x = p.x + sin(p.y * 1.3 + p.x * 0.2) * 0.22;
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(h11(i), h11(i + 1.0), f);
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vView);
    float facing = abs(dot(N, V));
    vec3 navy = vec3(9.0, 46.0, 131.0) / 255.0;
    vec3 cobalt = vec3(38.0, 92.0, 255.0) / 255.0;
    vec3 violet = vec3(110.0, 64.0, 230.0) / 255.0;
    vec3 ice = vec3(124.0, 200.0, 255.0) / 255.0;
    vec3 edge = vec3(0.77, 0.84, 1.0);

    // graphite base, a touch lighter towards the top
    vec3 col = mix(vec3(0.02, 0.024, 0.04), vec3(0.06, 0.068, 0.1), smoothstep(-1.4, 1.8, vP.y));
    // the page light: cobalt and navy from below left, violet from the top right
    col += cobalt * 0.12 * exp(-dot(vP.xy - vec2(-0.9, -1.0), vP.xy - vec2(-0.9, -1.0)) * 0.9);
    col += navy * 0.2 * smoothstep(0.6, -1.2, vP.y);
    col += violet * 0.11 * exp(-dot(vP.xy - vec2(0.9, 1.6), vP.xy - vec2(0.9, 1.6)) * 0.7);
    // the data in the opening lights the letter from inside
    float data = exp(-dot(vP.xy, vP.xy) * 1.6) * (0.85 + 0.15 * sin(uTime * 2.0));
    col += ice * 0.22 * data;
    // edges and rim: pale light running ice → violet down the letter
    float side = 1.0 - abs(vObjN.z);
    vec3 rimCol = mix(violet * 1.3, edge, smoothstep(-1.4, 1.4, vP.y));
    col += rimCol * (side * 0.2 + pow(1.0 - facing, 2.5) * 0.4);
    // a slow sheen across the face
    float band = (vP.x * 0.7 + vP.y * 0.5) - (fract(uTime * 0.07) * 7.0 - 3.5);
    col += edge * 0.08 * exp(-band * band * 5.0) * (1.0 - side);
    // texture, on the faces only (the bevels keep their clean rim light)
    float faceMask = 1.0 - side;

    // brushed: fine straight streaks along the letter (vertical), two scales; the highlight stretches along them
    vec2 bp = vec2(vP.x * 115.0, vP.y * 2.2);
    float bFade = 1.0 - smoothstep(0.75, 1.6, fwidth(bp.x));
    float st = streak(bp) * 0.7 + streak(bp * vec2(2.1, 1.3) + 7.0) * 0.3;
    float brush = (st - 0.5) * BRUSH * bFade * faceMask;
    col *= 1.0 + brush * 0.5;
    col += vec3(0.018, 0.022, 0.035) * brush;

    // gloss, like the cards' lit edge: a key light that drifts slowly, so as the letter floats its
    // highlight slides across the face and the bevels (a broad sheen plus a tight specular point)
    vec3 L = normalize(vec3(sin(uTime * 0.31) * 0.7, 0.55 + 0.25 * cos(uTime * 0.23), 0.75));

    vec3 H = normalize(L + V);
    float nh = max(dot(N, H), 0.0);
    vec3 glossCol = mix(ice, edge, 0.6);
    // anisotropic feel: the tight specular breaks up along the streaks instead of one clean blob
    float spec = pow(nh, 60.0) * 0.45 * (1.0 + brush * 1.6);
    col += glossCol * (pow(nh, 7.0) * 0.07 * (1.0 + brush * 0.8) + spec);

    // studio reflection: soft vertical lights that slide across the face (a fake environment: the reflection
    // vector plus a little position parallax), so the flat face reads as glossy depth
    vec3 R = reflect(-V, N);
    float ru = R.x * 1.6 + vP.x * 0.45 + vP.y * 0.25 - uTime * 0.04;
    float softbox = exp(-pow((fract(ru) - 0.5) * 5.0, 2.0));
    float rFall = smoothstep(-1.6, 1.4, vP.y);
    col += mix(ice, edge, 0.7) * 0.1 * softbox * rFall * REFL * faceMask;

    // grain: static, screen-space, a hair of noise over the whole letter (also breaks gradient banding)
    col += (h21(gl_FragCoord.xy) - 0.5) * GRAIN;
    col = max(col, 0.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// give the browser a turn between the heavy set-up steps, so none of them is one long task
const yieldMain = () => new Promise<void>((r) => setTimeout(r, 0));

export async function startEngine(canvas: HTMLCanvasElement, opts: { still: boolean; count: number }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  const dpr = Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  await yieldMain();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0.4, 0.5, 8.2);
  camera.lookAt(0.8, 0, 0);

  // lines × points per line, as line segments
  const lines = Math.max(60, Math.round(opts.count / 100));
  const per = 200;
  const verts = lines * (per - 1) * 2;
  const lu = new Float32Array(verts * 2);
  const seed = new Float32Array(verts);
  let v = 0;
  for (let l = 0; l < lines; l++) {
    const ln = l / (lines - 1);
    const sd = Math.random();
    for (let i = 0; i < per - 1; i++) {
      for (const j of [i, i + 1]) {
        lu[v * 2] = ln;
        lu[v * 2 + 1] = j / (per - 1);
        seed[v] = sd;
        v++;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
  geo.setAttribute('aLU', new THREE.BufferAttribute(lu, 2));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  const uniforms = {
    uTime: { value: 6 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uMouseOn: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stream = new THREE.LineSegments(geo, mat);
  stream.rotation.set(0.12, -0.38, 0.06);
  scene.add(stream);

  // the scattered data, in the stream's space so it enters the gate where the lines begin
  await yieldMain();
  const points = Math.round(opts.count / DATA.perPoint);
  const pS = new Float32Array(points * 4);
  const pGlyph = new Float32Array(points);
  const glyphKinds = DATA_CHARS.length + DATA_RECORDS;
  for (let i = 0; i < points; i++) {
    for (let j = 0; j < 4; j++) pS[i * 4 + j] = Math.random();
    pGlyph[i] = Math.random() < DATA.glyphs ? Math.floor(Math.random() * glyphKinds) : -1;
  }
  const dataGeo = new THREE.BufferGeometry();
  dataGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points * 3), 3));
  dataGeo.setAttribute('aS', new THREE.BufferAttribute(pS, 4));
  dataGeo.setAttribute('aGlyph', new THREE.BufferAttribute(pGlyph, 1));
  const atlas = dataAtlas();
  const dataUniforms = {
    uTime: uniforms.uTime,
    uMouse: uniforms.uMouse,
    uMouseOn: uniforms.uMouseOn,
    uWide: { value: 1 },
    uPx: { value: dpr },
    uAtlas: { value: atlas.tex },
    uCells: { value: atlas.cells },
  };
  const dataMat = (vertexShader: string, fragmentShader: string) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: dataUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  const data = new THREE.Points(dataGeo, dataMat(DATA_VERT, DATA_FRAG));
  data.frustumCulled = false;
  // the streaks: a pair of vertices (point, far end) for some of the same points
  const tails = Math.round(points * DATA.streaks);
  const tS = new Float32Array(tails * 8);
  const tEnd = new Float32Array(tails * 2);
  for (let i = 0; i < tails; i++) {
    tS.set(pS.subarray(i * 4, i * 4 + 4), i * 8);
    tS.set(pS.subarray(i * 4, i * 4 + 4), i * 8 + 4);
    tEnd[i * 2 + 1] = 1;
  }
  const tailGeo = new THREE.BufferGeometry();
  tailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tails * 6), 3));
  tailGeo.setAttribute('aS', new THREE.BufferAttribute(tS, 4));
  tailGeo.setAttribute('aEnd', new THREE.BufferAttribute(tEnd, 1));
  const dataTails = new THREE.LineSegments(tailGeo, dataMat(DATA_TAIL_VERT, DATA_TAIL_FRAG));
  dataTails.frustumCulled = false;
  stream.add(dataTails);
  stream.add(data);

  // the gate is the A of the ADV symbol as a solid graphite letter. The lines are squeezed through its
  // opening; the letter hides whatever passes behind it. The lines flare as they pass.
  await yieldMain();
  const gate = new THREE.Group();
  gate.position.set(0.6, 0, 0);
  const GATE_RY = 0.38 + 0.8; // a three-quarter view: the A reads, the lines still pass through it
  gate.rotation.y = GATE_RY;
  // solid and opaque: it writes depth, so the lines behind it are hidden
  const solid = new THREE.Mesh(
    gateSolid(),
    new THREE.ShaderMaterial({
      vertexShader: SOLID_VERT,
      fragmentShader: SOLID_FRAG,
      uniforms: { uTime: uniforms.uTime },
    }),
  );
  gate.add(solid);
  stream.add(gate);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // wide screens: the gate sits right of the copy; narrow: centred above it
    camera.setViewOffset(w, h, w > 900 ? -w * 0.17 : 0, 0, w, h);
    dataUniforms.uWide.value = w > 900 ? 1 : 0;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // compile and link the shaders off the main thread (parallel shader compile), then draw
  await yieldMain();
  await renderer.compileAsync(scene, camera);

  if (opts.still) {
    renderer.render(scene, camera);
    return;
  }

  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  // the magnet follows the pointer with lag and fades while the pointer rests, so the lines return
  const aim = new THREE.Vector2(99, 99);
  let target = 0;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener(
      'pointermove',
      (e) => {
        const r = canvas.getBoundingClientRect();
        if (e.clientY > r.bottom) return void (target = 0);
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectPlane(plane, hit)) {
          stream.worldToLocal(hit);
          aim.set(hit.x, hit.y);
          target = 1;
        }
      },
      { passive: true },
    );
    document.addEventListener('pointerleave', () => (target = 0));
  }

  let raf = 0;
  let visible = true;
  let last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += dt;
    // the A floats with the lines: a slow bob and sway, small enough that the lines stay in its opening
    const ft = uniforms.uTime.value;
    gate.position.y = Math.sin(ft * 0.55) * 0.04;
    gate.rotation.set(Math.sin(ft * 0.33) * 0.035, GATE_RY + Math.sin(ft * 0.41) * 0.07, Math.sin(ft * 0.47) * 0.025);
    const m = uniforms.uMouse.value;
    if (m.x > 50) m.copy(aim);
    else m.lerp(aim, 1 - Math.exp(-dt * 4));
    target *= Math.exp(-dt * 0.9);
    uniforms.uMouseOn.value += (target - uniforms.uMouseOn.value) * (1 - Math.exp(-dt * 3));
    renderer.render(scene, camera);
  };
  const start = () => {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    visible ? start() : stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}
