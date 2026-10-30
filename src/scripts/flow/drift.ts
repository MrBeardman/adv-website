/**
 * lab/frameless (Honza, Oct 30 2026): "on scroll a few of the hero's lines separate and accompany the
 * scroll in the background, in a helix around the content". A fixed canvas behind the page, slightly
 * out of focus (CSS blur, Honza: "blurred, then the lines can be stronger"): three thin
 * ribbons of lines (the hero's colours: violet, cobalt, ice, navy) wound as a helix around the page's
 * vertical axis. Scroll moves the helix up a little slower than the content (depth) and turns it, so the
 * strands sweep from the sides across behind the frosted cards and back. At the top the strands are
 * gathered small on the right, where the hero's ribbon leaves, and they fade in only once the hero
 * scrolls away; down the page they open to the full width.
 *
 * Positions are computed in the vertex shader from (line, u), the scroll and the time; the CPU writes
 * three uniforms per frame. Pauses in a hidden tab; not started with reduced motion.
 */
import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;   // page scroll in viewport heights (smoothed)
  uniform float uAspect;
  attribute vec2 aLU;      // line index (0..1), position along it (0..1)
  attribute vec3 aStrand;  // ribbon phase, offset inside the ribbon, seed
  varying float vU;
  varying float vSeed;
  varying float vDepth;
  varying float vPage;
  varying float vRib;

  void main() {
    float t = uTime;
    // screen y from just above the top to just below the bottom, and the page position it shows
    float y = 1.15 - aLU.y * 2.3;
    float page = uScroll * 0.5 + (1.0 - y) * 0.5; // the helix moves at half the content's speed: depth
    vPage = page;
    vU = aLU.y;
    vSeed = aStrand.z;
    vRib = aStrand.x;

    // the helix opens from the hero's exit (small, on the right) to the full width down the page
    float open = smoothstep(0.7, 2.0, page);
    float cx = mix(0.55, 0.0, open);
    float r = mix(0.06, 1.12, open) * (1.0 + 0.1 * sin(page * 0.8 + aStrand.x * 2.0));
    // the ribbon: lines side by side, a little fanned
    float phi = aStrand.x + aStrand.y * 0.14 + page * 1.1 + uScroll * 0.2 + t * 0.015;
    float rr = r * (1.0 + aStrand.y * 0.05) + sin(page * 4.0 + aStrand.z * 30.0 + t * 0.15) * 0.012;
    float x = cx + rr * cos(phi);
    float z = sin(phi);
    vDepth = z;
    // keep the helix from stretching on very wide screens
    x = x / max(1.0, uAspect * 0.62);
    // a little perspective: the near side larger
    float persp = 1.0 / (1.0 - z * 0.08 * open);
    gl_Position = vec4(x * persp, y, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  varying float vU;
  varying float vSeed;
  varying float vDepth;
  varying float vPage;
  varying float vRib;

  void main() {
    vec3 violet = vec3(0.46, 0.27, 0.95);
    vec3 cobalt = vec3(0.16, 0.38, 1.0);
    vec3 ice = vec3(0.62, 0.86, 1.0);
    vec3 navy = vec3(0.12, 0.2, 0.62);
    float pick = fract(vSeed * 3.7 + vRib * 0.31);
    vec3 col = pick < 0.25 ? violet : pick < 0.5 ? cobalt : pick < 0.75 ? ice : navy;

    // data pulses running down every line
    float ph = fract(vU * 1.6 - uTime * (0.03 + vSeed * 0.025) + vSeed * 7.0);
    float pulse = smoothstep(0.03, 0.0, abs(ph - 0.5));

    // the near side brighter, the far side behind the axis dim
    float depth = mix(0.35, 1.0, smoothstep(-1.0, 1.0, vDepth));
    // only once the hero scrolls away; never over the hero itself
    float show = smoothstep(0.2, 0.8, uScroll) * smoothstep(0.75, 1.35, vPage);
    float edge = smoothstep(0.0, 0.08, vU) * (1.0 - smoothstep(0.92, 1.0, vU));
    float a = (0.5 * depth * (0.55 + 0.6 * fract(vSeed * 9.1)) + pulse * 0.9 * depth) * show * edge;
    gl_FragColor = vec4(col + pulse * 0.5, a);
  }
`;

export function startDrift(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  // three ribbons, evenly around the helix; lines side by side in each
  const ribbons = 3;
  const perRibbon = innerWidth < 760 ? 4 : 7;
  const per = 260;
  const lines = ribbons * perRibbon;
  const verts = lines * (per - 1) * 2;
  const lu = new Float32Array(verts * 2);
  const strand = new Float32Array(verts * 3);
  let v = 0;
  for (let rb = 0; rb < ribbons; rb++) {
    for (let k = 0; k < perRibbon; k++) {
      const l = rb * perRibbon + k;
      const sd = Math.random();
      const off = perRibbon > 1 ? k / (perRibbon - 1) - 0.5 : 0;
      for (let i = 0; i < per - 1; i++) {
        for (const j of [i, i + 1]) {
          lu[v * 2] = l / (lines - 1);
          lu[v * 2 + 1] = j / (per - 1);
          strand[v * 3] = (rb / ribbons) * Math.PI * 2;
          strand[v * 3 + 1] = off;
          strand[v * 3 + 2] = sd;
          v++;
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
  geo.setAttribute('aLU', new THREE.BufferAttribute(lu, 2));
  geo.setAttribute('aStrand', new THREE.BufferAttribute(strand, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e3);
  const uniforms = { uTime: { value: 0 }, uScroll: { value: 0 }, uAspect: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.LineSegments(geo, mat));

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    uniforms.uAspect.value = innerWidth / innerHeight;
  };
  resize();
  addEventListener('resize', resize);

  const target = () => scrollY / innerHeight;
  uniforms.uScroll.value = target();
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += dt;
    // eased scroll: the helix follows the page with a soft lag
    uniforms.uScroll.value += (target() - uniforms.uScroll.value) * (1 - Math.exp(-dt * 2.5));
    renderer.render(scene, camera);
  };
  const start = () => {
    if (raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  start();
  canvas.classList.add('is-on');
}
