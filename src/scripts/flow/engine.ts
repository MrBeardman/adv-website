/**
 * Homepage hero engine (components/home/HeroFlow.astro), Honza Oct 29 2026 ("like amaze-genius, in our
 * colours"): hundreds of fine lines. On the left they are tangled and scattered (a business today); they
 * pass a ring of light (ADV) and leave as one smooth, slowly twisting ribbon of parallel lines (a business
 * that runs). Pulses of light travel along every line: the data going through. Colour runs violet → cobalt
 * → ice along the stream and across the ribbon; additive blending gives the silk sheen.
 *
 * Every vertex position is computed in the vertex shader from (line, u) and one time uniform; the CPU only
 * writes a few uniforms per frame. The pointer lifts the ribbon a little near it (fine pointers only).
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

  void main() {
    float L = 15.0;
    float x = (aLU.y - 0.5) * L;
    float t = uTime;
    vU = aLU.y;
    vLine = aLU.x;
    vSeed = aSeed;

    // ordered: a ribbon of parallel lines that twists slowly as it travels
    float w = 1.25;
    float across = (aLU.x - 0.5) * w;
    float twist = x * 0.32 - t * 0.12;
    float lift = sin(x * 0.42 - t * 0.35) * 0.45;
    vec3 ordered = vec3(x, lift + across * cos(twist), across * sin(twist));

    // tangled: every line wanders on its own
    float s = aSeed * 50.0;
    vec3 tangled = vec3(
      x,
      sin(x * (0.9 + aSeed * 0.8) + s + t * 0.5) * (0.8 + aSeed * 1.2) + sin(x * 2.3 + s * 1.7 + t) * 0.25,
      cos(x * (0.7 + aSeed) + s * 1.3 + t * 0.4) * (0.7 + aSeed)
    );

    // the ring sits at x = 0.6: tangled before it, ordered after it, everything squeezed through it
    float k = smoothstep(-2.4, 1.6, x);
    vOrder = k;
    vec3 p = mix(tangled, ordered, k);
    float ring = exp(-pow((x - 0.6) * 1.1, 2.0));
    p.yz = mix(p.yz, p.yz * 0.32, ring);

    // pointer lifts the ribbon near it
    vec2 d = p.xy - uMouse;
    p.y += uMouseOn * 0.3 * exp(-dot(d, d) * 1.2);

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

  void main() {
    vec3 violet = vec3(0.46, 0.27, 0.95);
    vec3 cobalt = vec3(0.16, 0.38, 1.0);
    vec3 ice = vec3(0.62, 0.86, 1.0);
    // along the stream, and a little across the ribbon so its edges read as silk
    float g = clamp(vU * 1.15 - 0.1 + (vLine - 0.5) * 0.25 * vOrder, 0.0, 1.0);
    vec3 col = mix(violet, cobalt, smoothstep(0.15, 0.55, g));
    col = mix(col, ice, smoothstep(0.52, 0.82, g));

    // data pulses: short bright dashes travelling along each line
    float ph = fract(vU * 2.2 - uTime * (0.16 + vSeed * 0.08) + vSeed * 7.0);
    float pulse = smoothstep(0.035, 0.0, abs(ph - 0.5)) * (0.4 + vOrder);

    // fade in late on the left so the tangle stays clear of the headline
    float edge = smoothstep(0.16, 0.42, vU) * (1.0 - smoothstep(0.9, 1.0, vU));
    float a = (mix(0.12, 0.26, vOrder) + pulse * 0.9) * edge;
    gl_FragColor = vec4(col + pulse * 0.6, a);
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

  // the ring: a fine bright hoop with a fainter echo
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.72, 0.86, 1),
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.007, 8, 200), ringMat);
  ring.position.set(0.6, 0, 0);
  ring.rotation.y = Math.PI / 2;
  const echoMat = ringMat.clone();
  echoMat.opacity = 0.18;
  const echo = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.005, 8, 200), echoMat);
  echo.position.copy(ring.position);
  echo.rotation.copy(ring.rotation);
  stream.add(ring, echo);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // wide screens: the ring sits right of the copy; narrow: centred above it
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
    uniforms.uMouseOn.value += (target - uniforms.uMouseOn.value) * 0.05;
    ring.rotation.x += dt * 0.12;
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
