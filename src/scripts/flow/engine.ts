/**
 * Homepage hero engine (components/home/HeroFlow.astro): one particle stream that enters from the left
 * turbulent and scattered (a business today), passes a ring of light (what we do), and leaves to the right
 * as smooth, ordered ribbons (a business that runs). Colour runs violet → navy → ice along the stream.
 *
 * All motion is computed in the vertex shader from per-particle constants and one time uniform; the CPU
 * writes three uniforms per frame. The pointer bends the stream a little near it (fine pointers only).
 * Pauses off screen and in a hidden tab; reduced motion renders one still frame.
 */
import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;      // in stream space, x/y
  uniform float uMouseOn;
  uniform float uPixel;
  attribute vec4 aSeed;     // lane, phase, depth, jitter
  varying float vT;         // 0 left .. 1 right
  varying float vAlpha;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float L = 16.0;
    float speed = mix(0.55, 0.9, aSeed.w);
    float x = mod(aSeed.y * L + uTime * speed, L) - L * 0.5;
    vT = clamp((x + L * 0.5) / L, 0.0, 1.0);

    // ordered side: a few smooth ribbons, gently waving
    float lane = floor(aSeed.x * 7.0);
    float laneY = (lane - 3.0) * 0.24 + (aSeed.x * 7.0 - lane - 0.5) * 0.05;
    float wave = sin(x * 0.55 + uTime * 0.35 + lane * 0.6) * 0.22;
    vec3 ordered = vec3(x, laneY + wave, (aSeed.z - 0.5) * 0.35);

    // turbulent side: scattered, swirling
    float s = aSeed.x * 91.7 + aSeed.z * 13.1;
    float r = 0.6 + 1.6 * hash(s);
    float a = hash(s + 3.0) * 6.2831 + uTime * (0.25 + hash(s + 5.0) * 0.5) + x * 0.4;
    vec3 chaos = vec3(x, sin(a) * r * 0.9, cos(a) * r);

    // the ring sits at x = 0.8; chaos before it, order after it
    float k = smoothstep(-1.2, 1.4, x);
    vec3 p = mix(chaos, ordered, k);
    // squeeze through the ring
    float ring = exp(-pow((x - 0.8) * 1.6, 2.0));
    p.yz *= 1.0 - ring * 0.55;

    // pointer bends the stream near it
    vec2 d = p.xy - uMouse;
    float m = uMouseOn * exp(-dot(d, d) * 1.6);
    p.y += m * 0.35 * sign(d.y + 0.0001);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(1.4, 2.6, hash(s + 9.0)) * (1.0 + ring * 1.2);
    gl_PointSize = size * uPixel * (11.0 / -mv.z);
    // fade at both ends of the stream
    vAlpha = smoothstep(0.0, 0.12, vT) * (1.0 - smoothstep(0.9, 1.0, vT)) * mix(0.55, 1.0, k);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vT;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    soft *= soft * 1.4;
    vec3 violet = vec3(0.43, 0.25, 0.90);
    vec3 navy = vec3(0.15, 0.36, 1.0);
    vec3 ice = vec3(0.70, 0.88, 1.0);
    vec3 col = mix(violet, navy, smoothstep(0.1, 0.5, vT));
    col = mix(col, ice, smoothstep(0.5, 0.85, vT));
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

export function startEngine(canvas: HTMLCanvasElement, opts: { still: boolean; count: number }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  const dpr = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0.6, 0.35, 7.2);
  camera.lookAt(0.9, 0, 0);

  const n = opts.count;
  const seeds = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) seeds[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
  const uniforms = {
    uTime: { value: 8 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uMouseOn: { value: 0 },
    uPixel: { value: dpr },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.rotation.set(0.18, -0.32, 0.04);
  scene.add(points);

  // the ring of light the stream passes through
  const ringGeo = new THREE.TorusGeometry(1.0, 0.006, 8, 160);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.62, 0.8, 1),
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0.8, 0, 0);
  ring.rotation.y = Math.PI / 2;
  const ring2 = ring.clone();
  ring2.scale.setScalar(1.18);
  (ring2.material as THREE.MeshBasicMaterial) = ringMat.clone();
  (ring2.material as THREE.MeshBasicMaterial).opacity = 0.18;
  points.add(ring, ring2);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the ring in the right part of wide screens, centred on narrow ones
    camera.setViewOffset(w, h, w > 900 ? -w * 0.16 : 0, 0, w, h);
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  if (opts.still) {
    renderer.render(scene, camera);
    return;
  }

  // pointer → stream space (approximate: project onto the z = 0 plane of the stream)
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
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
          points.worldToLocal(hit);
          uniforms.uMouse.value.set(hit.x, hit.y);
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
    uniforms.uMouseOn.value += (target - uniforms.uMouseOn.value) * 0.06;
    ring.rotation.x += dt * 0.15;
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
