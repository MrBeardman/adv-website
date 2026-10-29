/**
 * Homepage hero engine (components/home/HeroFlow.astro), Honza Oct 29 2026 ("like amaze-genius, in our
 * colours"): hundreds of fine lines. On the left they are tangled and scattered (a business today); they
 * pass inside the A of the ADV mark, a solid graphite letter (the organiser at work), and leave as a smooth,
 * slowly twisting ribbon of four strands that fans out (a business that runs). Pulses of light travel along every line: the data going through. Colour runs violet
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

    // fade in late on the left so the tangle stays clear of the headline
    float edge = smoothstep(0.16, 0.42, vU) * (1.0 - smoothstep(0.9, 1.0, vU));
    // shading after the gate: folds dimmer (vFace), the far side darker (vDepth), lines at uneven strength
    float shade = mix(1.0, vFace * (0.6 + 0.4 * smoothstep(-0.9, 0.9, vDepth)) * (0.45 + 0.75 * fract(vSeed * 9.1)), vOrder);
    // passing the gate: the lines flare, each in its own beat, as they are sorted
    float flare = vGate * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 2.4 + vSeed * 40.0), 6.0));
    float a = (mix(0.12, 0.2, vOrder) * shade + pulse * 0.9 + flare * 0.5) * edge;
    gl_FragColor = vec4(col + pulse * 0.6 + flare * 0.5, a);
  }
`;

// the A of the ADV symbol (data/logoPaths.ts SYMBOL_TILE) in the gate's plane, from the 256-unit logo
// grid, centred on its opening (between the legs, below the inner apex) so the lines pass inside the A
const S = 0.012;
const P = (x: number, y: number) => new THREE.Vector3((x - 128) * S * 1.25, -(y - 204) * S, 0);
const A_PTS = [[112, 56], [144, 56], [193.3, 240], [159.3, 240], [128, 123.2], [96.7, 240], [62.7, 240], [112, 56]];
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
    vec3 col = mix(vec3(0.035, 0.04, 0.06), vec3(0.1, 0.11, 0.16), smoothstep(-1.4, 1.8, vP.y));
    // the page light: cobalt and navy from below left, violet from the top right
    col += cobalt * 0.22 * exp(-dot(vP.xy - vec2(-0.9, -1.0), vP.xy - vec2(-0.9, -1.0)) * 0.9);
    col += navy * 0.35 * smoothstep(0.6, -1.2, vP.y);
    col += violet * 0.2 * exp(-dot(vP.xy - vec2(0.9, 1.6), vP.xy - vec2(0.9, 1.6)) * 0.7);
    // the data in the opening lights the letter from inside
    float data = exp(-dot(vP.xy, vP.xy) * 1.6) * (0.85 + 0.15 * sin(uTime * 2.0));
    col += ice * 0.32 * data;
    // edges and rim: pale light running ice → violet down the letter
    float side = 1.0 - abs(vObjN.z);
    vec3 rimCol = mix(violet * 1.3, edge, smoothstep(-1.4, 1.4, vP.y));
    col += rimCol * (side * 0.3 + pow(1.0 - facing, 2.5) * 0.5);
    // a slow sheen across the face
    float band = (vP.x * 0.7 + vP.y * 0.5) - (fract(uTime * 0.07) * 7.0 - 3.5);
    col += edge * 0.12 * exp(-band * band * 5.0) * (1.0 - side);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function startEngine(canvas: HTMLCanvasElement, opts: { still: boolean; count: number }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  const dpr = Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
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

  // the gate is the A of the ADV symbol as a solid graphite letter. The lines are squeezed through its
  // opening; the letter hides whatever passes behind it. The lines flare as they pass.
  const gate = new THREE.Group();
  gate.position.set(0.6, 0, 0);
  gate.rotation.y = 0.38 + 0.8; // a three-quarter view: the A reads, the lines still pass through it
  // solid and opaque: it writes depth, so the lines behind it are hidden
  const solid = new THREE.Mesh(
    gateSolid(),
    new THREE.ShaderMaterial({ vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, uniforms: { uTime: uniforms.uTime } }),
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
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

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
