/* Ported from PersonalPortfolio (branch adv-rebrand) src/components/redesign/scene/HeroSceneGL.js (the engine is unchanged; palette, matte material and layout offsets adapted).
 * Changes for adv-website are marked "ADV:". */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { createPanelGeometry } from './panelGeometry';
import { createPanelTexture } from './panelTexture';
import { studio, hexToInt, mix } from './colors';

/* ─────────────────────────────────────────────────────────────────────────────
   Hero scene.

   Plain class, not a React component — every value here changes at 60fps and
   routing any of it through state would re-render the page each frame.

   One card per visible service, in a fixed pool. Advancing moves a modular index over that pool;
   meshes are never created or destroyed per cycle, only reassigned to a slot.

   ── Transform ownership ────────────────────────────────────────────────────
   Each card is a holder Group with the mesh as its only child, and the two own
   strictly separate properties:

     holder.position.z   slot depth        tweened by GSAP on advance
     mesh.position.x/y   cursor fan        written per frame, lerped
     mesh.position.z     exit flight       tweened by GSAP on advance
     mesh.rotation       exit tumble       tweened by GSAP on advance

   This split is the fix for the hover judder. Previously the fan wrote
   mesh.position.x/y every frame while the advance tween wrote the whole of
   mesh.position — two owners of one property, so moving the cursor during an
   advance made the stack jump. Nothing here writes the same channel twice.

   ── Pixels per world unit is constant across viewport widths ─────────────
   Used by _clearText() to convert a pixel shortfall into a world-space
   position delta in one exact step, no iteration.

   vh (the visible height at the camera's focal plane) depends only on CAM_Z
   and the camera's fov, both fixed — so vh does not change with the viewport.
   vw = vh * (w / h) does scale with the viewport, exactly cancelling it back
   out: pixels-per-world-unit = canvasWidthPx / vw = w / (vh * w / h) = h / vh.
   Only canvas HEIGHT survives; width cancels. So a translation of the group by
   some world-space delta produces the SAME number of screen pixels of shift
   at any viewport width — which is what makes a single corrective step exact
   rather than an approximation that would need re-measuring after applying it.
   ───────────────────────────────────────────────────────────────────────────── */

/* Rim and body colours, from the brand tokens (tokens.css via brandColors.js),
 * read when the scene is built so the cards always match the page.
 *
 * Rims: lifted navy and paper-tinted navy, with Signal on one card only. The
 * old set ran blue → violet → magenta → cyan, which is the AI-palette tell and
 * has nothing to do with the brand. One amber edge in five keeps the accent a
 * highlight rather than a theme.
 *
 * Bodies: Midnight pushed toward black so the faces stay a deep navy glass
 * under the environment light rather than a flat blue slab. Five slightly
 * different depths so the stack reads as separate objects. */
function brandScenePalette() {
  // ADV: Studio palette. Graphite bodies (the matte card surface, #181b24 toward black) instead of
  // Midnight navy; rims in cool steel with Ice on one card instead of navy + Signal amber.
  const c = studio();
  const steel = mix(c.navy, c.text, 0.55);
  return {
    rims: [steel, mix(steel, c.text, 0.4), c.ice, mix(c.navy, c.text, 0.42), mix(steel, c.ice, 0.35)].map(hexToInt),
    tints: [0.34, 0.42, 0.3, 0.46, 0.38].map((t) => hexToInt(mix(c.surface, '#000000', t))),
  };
}

/* Per-card iridescence range.
 *
 * Five identical dark slabs read as bland however good the material is. Varying
 * the film thickness shifts where each card's interference colour lands, so the
 * stack has depth and range. Film strength is held at IRIDESCENCE so the
 * interference reads as a sheen on navy glass, not a rainbow. */
const FILM_RANGES = [
  [120, 420],
  [200, 560],
  [90, 340],
  [260, 640],
  [150, 470],
];
const IRIDESCENCE = 0.22; // ADV: 0.4 → 0.22, a matte sheen, not glass

/* Tightened from 0.6 so the stack can be scaled up without its rear card
   leaving the frame — depth costs horizontal room once the group is rotated. */
const PANEL_GAP = 0.5;

// Card height in scene units, as built by createPanelGeometry().
const CARD_H = 1.95;

/* Stack scale and how far right the group sits, as a fraction of the visible
   width. The group origin is the FRONT card and slots recede to the right, so
   these two trade against each other: scaling up pushes the back of the stack
   outward, and moving right does the same. */
const STACK_SCALE = 1.16;
const STACK_X = 0.125;

/* Minimum clearance, in real screen pixels, between the front card's left
 * edge and the hero text column's right edge — see _clearText(). --sp-7 in
 * tokens.css is 48px; matched here rather than picked freestanding, since it
 * is already the spacing this design system uses between major elements. */
const SAFE_GUTTER_PX = 48;

/* The scene's only light source, now that the directional key is gone. It
   carries everything: the bright band along the top edge, the general fill that
   keeps the card faces legible, and the sheen that moves as the stack tilts.
   Raised to compensate for the lamp going away. */
const ENV_INTENSITY = 0.85;

/* How long a card sits at the front. 7s, up from 4s: each card now carries a
   service someone may want to open, so it has to stay long enough for the
   caption to be read once without racing it. */
const CYCLE_MS = 7000;

/* Focus dolly — the front card coming forward to become the expanded service.
 * The camera ends FOCUS_DIST in front of the card face, which at this fov
 * overfills the viewport, so the card passes the frame edges rather than
 * stopping as a smaller rectangle. The DOM panel fades in over the last part of
 * the move and covers whatever seam is left; see Hero.jsx. */
const FOCUS_DURATION = 0.9;
const FOCUS_DIST = 0.9;

/* How long the change between cards takes. Everything about a transition is
 * derived from this one number, so it can be retuned in a single place without
 * the fade, the stagger and the caption crossfade drifting out of proportion. */
const TRANSITION = 0.375;

const BASE_ROT_X = -0.14;
const BASE_ROT_Y = -0.6;
const BASE_ROT_Z = 0.02;

const CAM_Z = 5.6;
const CAM_Z_START = 6.8;
const EXIT_Z = 3.6; // 2.0 units of clearance to the camera

const DitherVignetteShader = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 1.6 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAmount;
    varying vec2 vUv;

    float hash( vec2 p ) {
      return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
    }

    void main() {
      vec4 c = texture2D( tDiffuse, vUv );

      // Soft radial vignette — the other half of the fake depth of field.
      float v = smoothstep( 0.92, 0.28, length( vUv - 0.5 ) );
      c.rgb *= mix( 0.68, 1.0, v );

      // Dither, just under one 8-bit step so it never reads as grain. Without
      // it the bloom rings visibly on near-black.
      float n = hash( gl_FragCoord.xy ) - 0.5;
      c.rgb += n * uAmount / 255.0;

      gl_FragColor = c;
    }
  `,
};

export class HeroSceneGL {
  constructor(canvas, { onAdvance, onOpen, cards = [], narrow = false, textEl = null } = {}) {
    this.canvas = canvas;
    this.onAdvance = onAdvance ?? (() => {});
    // Clicking the front card asks the page to open that service. The scene
    // does not route; it only reports which card was chosen.
    this.onOpen = onOpen ?? null;
    this.narrow = narrow;
    this.cards = cards;
    // See _clearText() — the DOM element the stack must not encroach on.
    this.textEl = textEl;

    /* One panel per service at every width.
     *
     * A deviation from the original spec, which dropped to three below 768 when
     * the panels were decorative. They now carry the services, so
     * rendering three would silently hide two services on mobile. The saving is
     * given back through bloom and pixel ratio instead, which cost far more than
     * two thin meshes. */
    this.count = Math.max(cards.length, 1);

    this.head = 0;
    this.disposed = false;
    this.running = false;
    this.hovering = false;
    // Set by the page while the pointer or focus is in the caption block, so
    // the card being read cannot advance out from under the reader.
    this.held = false;
    // Cleared for good by the first manual step: once someone has taken the
    // controls, the carousel stops competing with them.
    this.autoplay = true;
    // 0 = carousel, 1 = front card fills the view as the expanded service.
    this.focusState = { amt: 0 };
    this.inView = true;

    this.pointer = { x: 0, y: 0, inside: false };
    // Drag / swipe state. See _bindDrag(). dragWorld is the front card's
    // sideways offset in the group's units, already rubber-banded; the frame
    // loop eases the card toward it, so following and springing back are the
    // same code path.
    this.drag = null;
    this.dragging = false;
    this.dragWorld = 0;
    this.suppressClick = false;
    this.nudge = { v: 0 };
    this.reducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.parallax = { x: BASE_ROT_X, y: BASE_ROT_Y };
    this.fan = 0;
    this.fanTarget = 0;
    this.exiting = new Set();
    this.clock = new SceneClock(); // ADV: THREE.Clock is deprecated in three 0.183
    this.tweens = [];
    this.frameSamples = [];
    this.downgraded = false;

    this._initRenderer();
    this._initScene();
    this._initPanels();
    this._initComposer();
    this._bind();
  }

  /* ── Setup ────────────────────────────────────────────────────────────── */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      // Only the poster-capture script sets this flag; no visitor pays for it.
      preserveDrawingBuffer: typeof window !== 'undefined' && !!window.__JM_CAPTURE__,
    });
    this.renderer.setClearColor(0x000000, 0);
    /* 1.6, down from 2.
     *
     * This is the single largest cost in the scene and the least visible one to
     * cut. At DPR 2 a 1440x900 hero renders 5.2 million pixels, every one of them
     * through a clearcoat-plus-iridescence shader, then again through MSAA
     * resolve and two bloom passes. At 1.6 that is 3.3 million — a third less
     * work — and on a dark scene with no fine detail the difference is close to
     * invisible. The adaptive governor drops it further if the machine is still
     * struggling. */
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.narrow ? 1.4 : 1.6));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _initScene() {
    const { clientWidth: w, clientHeight: h } = this.canvas.parentElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 0, CAM_Z_START);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.envRT = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = ENV_INTENSITY;
    room.dispose?.();
    pmrem.dispose();

    /* No directional key light.
     *
     * There was one, and every setting of it was wrong in a different way: high
     * and bright it grazed the top-right edges into the lens, low and bright it
     * became a blown hotspot in the middle of the face, and dim it still left a
     * round blob that read as a lamp pointed at the card rather than as a lit
     * surface.
     *
     * The lighting people actually liked was never the lamp. It is the
     * environment: the bright band along the top edge, the spectral rim down the
     * leading edge, and enough general fill to make the face legible. A single
     * directional source cannot produce that top band — it comes from a broad
     * area light in RoomEnvironment — so the honest fix is to delete the lamp and
     * let the environment carry the whole scene. */

    this.group = new THREE.Group();
    this.group.rotation.set(BASE_ROT_X, BASE_ROT_Y, BASE_ROT_Z);
    this.scene.add(this.group);

    this._layoutGroup(w, h);
  }

  _layoutGroup(w, h) {
    const vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const vw = vh * (w / h);

    if (w < 1024) {
      /* Below this width the stack sits ABOVE the copy, in the band Hero.module.css
       * reserves for it (grid row 1, 300px, under the header and top padding).
       *
       * It used to be placed at a fraction of the canvas height, but the canvas
       * is the whole hero, and on a phone the hero is ~1150px tall, so the stack
       * landed around y = 410px and sat on top of the headline. Placed in pixels
       * now: the stack's centre goes to the middle of the band, and it is scaled
       * to a fixed on-screen card height. pxPerUnit is height-driven only (see
       * the note at the top of this file), so both stay exact at any width. */
      const pxPerUnit = h / vh;
      const narrow = w < 768;
      // Hero top padding: calc(58px + --sp-7) on phones, calc(66px + --sp-8) above.
      // ADV: header 72px + the hero's top padding (32px phone, 48px tablet), see CardStack.astro.
      const bandTop = narrow ? 72 + 32 : 72 + 48;
      const centerPx = bandTop + 150;
      const cardPx = narrow ? 236 : 262;
      this.group.scale.setScalar(cardPx / (CARD_H * pxPerUnit));
      this.group.position.set(0, (h / 2 - centerPx) / pxPerUnit, 0);
      this.group.updateMatrixWorld(true);
      return;
    }

    this.group.position.set(vw * STACK_X, 0, 0);
    this.group.scale.setScalar(STACK_SCALE);
    this._clearText(w, h, vh);
  }

  /* Keeps the front card's left edge clear of the hero's text column.
   *
   * The fault this fixes: STACK_X places the group at a FRACTION of the
   * viewport's visible width (vw * STACK_X), which sounds like it should
   * scale correctly, but the text column's right edge is a fixed number of
   * PIXELS (--frame-margin + .copy's max-width, neither of which move with
   * viewport width) while vw shrinks as the viewport narrows. The two edges
   * were converging by construction — generous at 1920px, then closing until
   * the card's own icon sat on top of the headline's final period around
   * 1200-1366px. Reported directly: "the cards are touching the heading."
   *
   * Fixed by measuring instead of re-deriving the trigonometry. The group's
   * rotation (BASE_ROT_Y etc.) bends the relationship between a card's local
   * geometry and where it lands on screen in a way that is not worth doing by
   * hand and is exactly what Three.js's own camera projection already does
   * correctly: take the front card's real bounding-box corners, carry them
   * through its actual world matrix and the camera's actual projection, and
   * read off the leftmost screen pixel that produces. If that pixel is closer
   * to the text than SAFE_GUTTER_PX allows, push the group right by exactly
   * the shortfall — nothing is ever resized, only repositioned.
   *
   * This only ever pushes the group FURTHER right than STACK_X alone would.
   * At wide viewports STACK_X already clears the text comfortably, so this is
   * a no-op there and the stack stays exactly as large and as generously
   * placed as before — a floor under the existing placement, not a
   * replacement for it. */
  _clearText(w, h, vh) {
    const textEl = this.textEl;
    const host = this.canvas.parentElement;
    const box = this.geometry?.boundingBox;
    if (!textEl || !host || !box) return;

    this.camera.updateMatrixWorld(true);
    this.group.updateMatrixWorld(true);

    // All panels share one geometry, so which panel is currently at the
    // front does not change its local dimensions — any of them will do, and
    // this runs before _initPanels() on the very first layout call, when
    // there is nothing to measure yet.
    const front = this.panels?.[0];
    if (!front) return;
    front.mesh.updateMatrixWorld(true);

    // Every corner on the card's left face — the group's rotation means the
    // leftmost point on screen is not reliably the leftmost point locally
    // once every axis is in play.
    const corners = [
      _c0.set(box.min.x, box.min.y, box.min.z),
      _c1.set(box.min.x, box.max.y, box.min.z),
      _c2.set(box.min.x, box.min.y, box.max.z),
      _c3.set(box.min.x, box.max.y, box.max.z),
    ];

    let leftmostPx = Infinity;
    for (const c of corners) {
      c.applyMatrix4(front.mesh.matrixWorld);
      c.project(this.camera);
      const px = ((c.x + 1) / 2) * w;
      if (px < leftmostPx) leftmostPx = px;
    }

    const hostRect = host.getBoundingClientRect();
    const textRightPx = textEl.getBoundingClientRect().right - hostRect.left;
    const targetPx = textRightPx + SAFE_GUTTER_PX;

    if (leftmostPx >= targetPx) return; // already clear

    // Pixels-per-world-unit is height-driven and constant across widths (w and
    // vw both scale with aspect ratio and cancel out) — see the derivation in
    // the class doc comment at the top of this file for why a translation by
    // this amount is exact in one pass rather than needing to iterate.
    const deficitPx = targetPx - leftmostPx;
    const pxPerWorldUnit = h / vh;
    this.group.position.x += deficitPx / pxPerWorldUnit;
    this.group.updateMatrixWorld(true);
  }

  _initPanels() {
    this.geometry = createPanelGeometry();
    // Lazy otherwise — raycasting triggers computeBoundingSphere() on its own
    // but never computeBoundingBox(), and _clearText() needs the box's actual
    // corners, not an approximation of them.
    this.geometry.computeBoundingBox();
    this.panels = [];
    this.textures = [];
    const palette = brandScenePalette();

    for (let i = 0; i < this.count; i++) {
      const film = {
        range: FILM_RANGES[i % FILM_RANGES.length],
        tint: palette.tints[i % palette.tints.length],
      };
      const texture = createPanelTexture(this.cards[i] ?? {});
      this.textures.push(texture);

      const material = new THREE.MeshPhysicalMaterial({
        color: film.tint,
        roughness: 0.32, // ADV: matte (was 0.15)
        metalness: 0,
        clearcoat: 0.7, // ADV: was 1.0
        /* 0.15 rather than 0.08. At 0.08 the coat is close to a mirror, so the
           key light returned as a single small, extremely bright spot that
           bloom then smeared across half the card. Roughening it spreads the
           same energy over a wider, dimmer highlight — which is what reads as a
           sheen on glass rather than a lamp pointed at the lens. */
        clearcoatRoughness: 0.15,
        iridescence: IRIDESCENCE,
        iridescenceIOR: 1.32,
        iridescenceThicknessRange: film.range,
        transparent: true,
        opacity: 0,
        // Content is additive light on the surface, not a diffuse decal — a map
        // with transparent regions would punch the panel through wherever there
        // is no artwork. The map's own values carry the brightness, so this
        // stays neutral at 1.0 and only the depth falloff scales it.
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 1.0,
        emissiveMap: texture,
      });

      this._addRim(material, palette.rims[i % palette.rims.length]);

      const holder = new THREE.Group();
      const mesh = new THREE.Mesh(this.geometry, material);
      holder.add(mesh);
      this.group.add(holder);

      this.panels.push({ holder, mesh, material });
    }
  }

  /* Custom fresnel rim, injected into the physical material rather than added as
     a second shell mesh. The built-in iridescence alone does not reach the edge
     quality the design calls for — it needs a hard grazing-angle term on top,
     coloured from the spectral set. */
  _addRim(material, colorHex) {
    const uniforms = {
      uRimColor: { value: new THREE.Color(colorHex) },
      uRimPower: { value: 3.5 },
      uRimStrength: { value: 0 },
      uRimDir: { value: new THREE.Vector2(-1, 0) },
    };
    material.userData.rim = uniforms;

    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform vec3  uRimColor;
          uniform float uRimPower;
          uniform float uRimStrength;
          uniform vec2  uRimDir;
        `,
        )
        // emissivemap_fragment sits after normal_fragment_begin, so `normal`
        // and `vViewPosition` are both in scope.
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `
          #include <emissivemap_fragment>
          {
            vec3  V = normalize( vViewPosition );
            float ndotv = clamp( dot( normal, V ), 0.0, 1.0 );

            /* Geometric specular AA.
             *
             * panelGeometry.js deliberately leaves the bevel's normals unsmoothed
             * for edge definition, which means the front face and the side wall
             * meet as a real, hard discontinuity. At a grazing angle that
             * discontinuity's silhouette is sub-pixel wide, and this term is
             * near its brightest exactly there — precisely what MSAA can't
             * resolve, and what the bloom pass then blows up into a blocky
             * stair-step instead of a clean line (reported as "pixelation" on
             * the receding cards' edges).
             *
             * Widening the falloff in proportion to how fast the normal changes
             * between neighbouring pixels spreads that sliver over enough of
             * them to resolve, while leaving flat faces — where the normal
             * barely varies — exactly as crisp as before. */
            float normalVariance = length( fwidth( normal ) );
            float aaPower = uRimPower / ( 1.0 + normalVariance * 24.0 );
            float f = pow( 1.0 - ndotv, max( aaPower, 1.0 ) );

            float bias = 0.5 + 0.5 * dot( normalize( normal.xy + vec2( 1e-4 ) ), uRimDir );
            totalEmissiveRadiance += uRimColor * f * uRimStrength * mix( 0.45, 1.0, bias );
          }
        `,
        );
    };
  }

  _initComposer() {
    const { clientWidth: w, clientHeight: h } = this.canvas.parentElement;

    /* Multisampled render target.
     *
     * `antialias: true` on the renderer applies to the DEFAULT framebuffer only.
     * The moment an EffectComposer is in the chain, every pass renders to an
     * offscreen target instead and that setting is silently discarded — which is
     * why the card silhouettes were stair-stepping along their edges and around
     * the corner radii. The card is a hard-edged shape against near-black at a
     * shallow angle, which is the worst case for it.
     *
     * `samples` needs WebGL2, which hasWebGL() already gates on. HalfFloat gives
     * the bloom room to work above 1.0 without clipping, and keeps the dither
     * pass operating on more than 8 bits.
     */
    const dpr = this.renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {
      type: THREE.HalfFloatType,
      samples: this.narrow ? 2 : 4,
    });
    this.renderTarget = rt;

    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    if (!this.narrow) {
      /* Threshold raised from 0.85 to 0.98: with a real key light in the scene,
         0.85 caught the whole specular falloff and not just its peak, turning a
         highlight into a flood. Only genuinely blown pixels should bloom. */
      this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.6, 0.98);
      this.composer.addPass(this.bloom);
    }

    this.composer.addPass(new ShaderPass(DitherVignetteShader));
    this.composer.addPass(new OutputPass());
    this._resize();
  }

  /* ── Content ──────────────────────────────────────────────────────────── */

  /** Rebuild the card faces — called when the locale changes. */
  updateContent(cards) {
    if (this.disposed || !cards?.length) return;
    this.cards = cards;
    this.panels.forEach((panel, i) => {
      const next = createPanelTexture(cards[i] ?? {});
      const previous = this.textures[i];
      panel.material.emissiveMap = next;
      panel.material.needsUpdate = true;
      this.textures[i] = next;
      previous?.dispose();
    });
  }

  /* ── Slots ────────────────────────────────────────────────────────────── */

  _slotDepth(slot) {
    return -slot * PANEL_GAP;
  }

  /* Fake depth of field, first half: distant cards get rougher, flatter and less
     iridescent so they read as out of focus. No BokehPass — a real DOF pass on a
     scene this dark costs more than it returns, and blurring a bloomed highlight
     looks like a fault. */
  _slotMaterial(slot) {
    const t = slot / Math.max(this.count - 1, 1);
    return {
      opacity: 1 - t * 0.52,
      roughness: 0.32 + t * 0.4, // ADV: matte base
      clearcoat: 0.7 - t * 0.5,
      iridescence: IRIDESCENCE * (1 - t * 0.7),
      envMapIntensity: 1 - t * 0.55,
      /* Content is legible on the front card only.
       *
       * Cards sit offset horizontally, so each one behind shows a narrow strip
       * of its right-hand side — and because the copy is left-aligned, that
       * strip renders the tail ends of words. Four columns of half-words reads
       * as a rendering fault, not as depth. Dropping the rear cards to a faint
       * glow keeps the stack rich while leaving exactly one card to be read,
       * which is also the one the rotating block on the left is describing. */
      emissiveIntensity: slot === 0 ? 1 : 0.1,
      /* 0.8, down from 1.15. The rim is a grazing-angle term, so it is at its
         brightest exactly where the card turns away from the viewer — which is
         what made the top-right edges flare. Softer here, with the key light now
         doing more of the work on the faces themselves. */
      rimStrength: 0.8 * (1 - t * 0.72),
    };
  }

  _applySlot(panel, slot, { duration = 0.9, delay = 0, ease = 'power3.out' } = {}) {
    const mat = this._slotMaterial(slot);
    const rim = panel.material.userData.rim;

    this.tweens.push(
      gsap.to(panel.holder.position, { z: this._slotDepth(slot), duration, delay, ease }),
      gsap.to(panel.material, {
        opacity: mat.opacity,
        roughness: mat.roughness,
        clearcoat: mat.clearcoat,
        iridescence: mat.iridescence,
        envMapIntensity: mat.envMapIntensity,
        emissiveIntensity: mat.emissiveIntensity,
        duration,
        delay,
        ease,
      }),
      gsap.to(rim.uRimStrength, { value: mat.rimStrength, duration, delay, ease }),
    );
  }

  /* ── Load sequence ────────────────────────────────────────────────────── */

  /* Forces the GPU to actually compile the panel materials' programs before
   * anything is animated.
   *
   * WebGL compiles a program lazily, on its first draw call — which, without
   * this, is the first frame of the entrance timeline in start(). Five
   * distinct clearcoat + iridescence + custom-rim programs compiling on an
   * integrated GPU is tens to hundreds of milliseconds of real stall, and it
   * landed exactly on the cards' first flight in, which is what read as the
   * load "always" being stuck — reliably, because a cold shader cache is the
   * normal case for a first visit.
   *
   * HeroScene.jsx already times construction against CONVERGE_BUDGET_MS and
   * skips the assembly animation if it ran long — awaiting this here is what
   * makes that budget check actually include the compile, as the comment
   * beside it already assumed it did. */
  async warmUp() {
    if (this.disposed) return;
    // ADV: compileAsync only where the GPU can compile in parallel; elsewhere three warns and blocks anyway.
    if (this.renderer.extensions.has('KHR_parallel_shader_compile'))
      await this.renderer.compileAsync(this.scene, this.camera);
    else this.renderer.compile(this.scene, this.camera);
  }

  start({ converge = true } = {}) {
    this.running = true;
    this._tick();

    if (!converge) {
      this._settle();
      return;
    }

    const tl = gsap.timeline({ onComplete: () => this._startCarousel() });
    this.loadTl = tl;

    this.panels.forEach((panel) => {
      panel.material.opacity = 0;
      panel.material.userData.rim.uRimStrength.value = 0;
    });

    // 0.0 → 0.6  near black, one slow specular sweep.
    tl.fromTo(
      this.group.rotation,
      { y: BASE_ROT_Y - 0.55 },
      { y: BASE_ROT_Y - 0.12, duration: 0.6, ease: 'power1.inOut' },
      0,
    );

    /* 0.6 → 2.2  cards drift inward from varied depths and rotations.
     *
     * The arrival offsets ARE the effect. Five things moving on one curve is a
     * slide transition; five arriving at different moments is an assembly. */
    const arrivals = [0.0, 0.22, 0.09, 0.34, 0.17];
    const origins = [
      { x: -4.2, y: 2.6, z: -7, rx: 0.9, ry: -1.2, rz: 0.5 },
      { x: 5.1, y: -2.2, z: -9, rx: -0.7, ry: 1.4, rz: -0.4 },
      { x: -3.4, y: -3.1, z: -12, rx: 1.2, ry: 0.8, rz: 0.7 },
      { x: 4.4, y: 3.3, z: -6, rx: -1.1, ry: -0.9, rz: -0.6 },
      { x: 0.6, y: -4.4, z: -14, rx: 0.5, ry: 1.7, rz: 0.3 },
    ];

    this.panels.forEach((panel, i) => {
      const o = origins[i % origins.length];
      panel.holder.position.set(0, 0, this._slotDepth(i));
      panel.mesh.position.set(o.x, o.y, o.z);
      panel.mesh.rotation.set(o.rx, o.ry, o.rz);

      const at = 0.6 + arrivals[i % arrivals.length];
      const mat = this._slotMaterial(i);

      tl.to(panel.mesh.position, { x: 0, y: 0, z: 0, duration: 1.6, ease: 'power4.out' }, at);
      tl.to(panel.mesh.rotation, { x: 0, y: 0, z: 0, duration: 1.6, ease: 'power4.out' }, at);
      tl.to(
        panel.material,
        {
          opacity: mat.opacity,
          roughness: mat.roughness,
          clearcoat: mat.clearcoat,
          iridescence: mat.iridescence,
          envMapIntensity: mat.envMapIntensity,
          emissiveIntensity: mat.emissiveIntensity,
          duration: 1.2,
          ease: 'power2.out',
        },
        at,
      );
    });

    // 2.2 → 2.8  rim ignites along the shared edge and travels down the stack.
    this.panels.forEach((panel, i) => {
      tl.to(
        panel.material.userData.rim.uRimStrength,
        { value: this._slotMaterial(i).rimStrength, duration: 0.5, ease: 'power2.out' },
        2.2 + i * 0.09,
      );
    });

    // 2.8 → 3.2  focus pulls onto the stack.
    tl.to(this.camera.position, { z: CAM_Z, duration: 0.4, ease: 'power2.inOut' }, 2.8);
    tl.to(this.group.rotation, { y: BASE_ROT_Y, duration: 0.4, ease: 'power2.inOut' }, 2.8);
  }

  /** Jump straight to the settled stack, no assembly. */
  _settle() {
    this.panels.forEach((panel, i) => {
      const mat = this._slotMaterial(i);
      panel.holder.position.set(0, 0, this._slotDepth(i));
      panel.mesh.position.set(0, 0, 0);
      panel.mesh.rotation.set(0, 0, 0);
      panel.material.opacity = mat.opacity;
      panel.material.roughness = mat.roughness;
      panel.material.clearcoat = mat.clearcoat;
      panel.material.iridescence = mat.iridescence;
      panel.material.envMapIntensity = mat.envMapIntensity;
      panel.material.emissiveIntensity = mat.emissiveIntensity;
      panel.material.userData.rim.uRimStrength.value = mat.rimStrength;
    });
    this.camera.position.set(0, 0, CAM_Z);
    this.group.rotation.set(BASE_ROT_X, BASE_ROT_Y, BASE_ROT_Z);
    this._startCarousel();
  }

  /* ── Carousel ─────────────────────────────────────────────────────────── */

  _startCarousel() {
    clearTimeout(this.advanceTimer);
    if (!this.focused) this._hintOnce();
    if (!this.autoplay) return;
    // The first card gets a full dwell like every other card. The old 1.2s
    // kick-off made the opening card the one people had least time to read.
    this._scheduleAdvance();
  }

  _scheduleAdvance(delay = CYCLE_MS) {
    if (this.disposed || !this.autoplay) return;
    clearTimeout(this.advanceTimer);
    this.advanceTimer = setTimeout(() => {
      if (this.disposed || !this.autoplay) return;
      // Held while the caption is being read, and while a service is open.
      if (this.held || this.focused) {
        this._scheduleAdvance(400);
        return;
      }
      /* Hovering holds the cycle so a card can actually be read. Checking back
         on a short timer rather than waiting out another full cycle is what
         makes this a pause that resumes rather than a skipped turn.

         Gated on `running`, not `inView`: a hidden tab stops the render loop but
         left inView true, so the carousel kept advancing against a frozen scene
         and the DOM caption drifted out of step with the card on screen. */
      if (this.hovering || !this.running) {
        this._scheduleAdvance(400);
        return;
      }
      this._advance();
      this._scheduleAdvance();
    }, delay);
  }

  /* ── Public controls ──────────────────────────────────────────────────── */

  /** Step forward. Safe to call from a button. Stops the autoplay for good. */
  next() {
    if (this.transitioning || this.focused) return;
    this._stopAutoplay();
    this._advance();
  }

  /** Step back: the card at the rear returns to the front. Stops the autoplay. */
  prev() {
    if (this.transitioning || this.focused) return;
    this._stopAutoplay();
    this._retreat();
  }

  _stopAutoplay() {
    this.autoplay = false;
    clearTimeout(this.advanceTimer);
  }

  /** Pause the cycle while the caption is being read. Resumes on release. */
  setHeld(held) {
    this.held = !!held;
  }

  /** Index of the card currently at the front. */
  get current() {
    return this.head % this.count;
  }

  /* Put `index` at the front with no animation.
   *
   * Used when the page loads straight onto /services/:slug: the scene starts on
   * card 0, but closing the panel has to reveal the service that was open, so
   * the stack is rearranged underneath it before anyone sees it. */
  jumpTo(index) {
    if (this.disposed) return;
    const target = ((index % this.count) + this.count) % this.count;
    if (target === this.current) return;
    this.head = target;
    for (let i = 0; i < this.count; i++) {
      const panel = this.panels[(this.head + i) % this.count];
      gsap.killTweensOf([panel.holder.position, panel.material, panel.material.userData.rim.uRimStrength]);
      this.exiting.delete(panel);
      panel.mesh.position.set(0, 0, 0);
      panel.mesh.rotation.set(0, 0, 0);
      this._applySlot(panel, i, { duration: 0 });
    }
    this.onAdvance(this.current);
  }

  /* The front card comes forward and fills the view.
   *
   * Driven through one number, focusState.amt, which the frame loop reads.
   * Tweening the camera and rotation directly would fight the parallax and the
   * fan, which already write those channels every frame — this blends their
   * targets instead, so there is still one owner per property. */
  focus({ immediate = false } = {}) {
    if (this.disposed) return;
    this.focused = true;
    clearTimeout(this.advanceTimer);
    gsap.killTweensOf(this.focusState);
    if (immediate) {
      this.focusState.amt = 1;
      return;
    }
    this.tweens.push(gsap.to(this.focusState, { amt: 1, duration: FOCUS_DURATION, ease: 'power3.inOut' }));
  }

  /** Reverse of focus(). Resolves when the stack is back in place. */
  unfocus({ immediate = false } = {}) {
    if (this.disposed) return Promise.resolve();
    gsap.killTweensOf(this.focusState);
    const done = () => {
      this.focused = false;
      if (this.autoplay) this._scheduleAdvance();
    };
    if (immediate) {
      this.focusState.amt = 0;
      done();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.tweens.push(
        gsap.to(this.focusState, {
          amt: 0,
          duration: FOCUS_DURATION,
          ease: 'power3.inOut',
          onComplete: () => {
            done();
            resolve();
          },
        }),
      );
    });
  }

  _lock() {
    this.transitioning = true;
    clearTimeout(this.lockTimer);
    // Held for the length of the longest tween in a transition, so a fast
    // double-click cannot start a second one over the top of the first and
    // desynchronise the modular index from the meshes.
    this.lockTimer = setTimeout(
      () => {
        this.transitioning = false;
      },
      TRANSITION * 1600 + 120,
    );
  }

  _advance() {
    const leaving = this.panels[this.head % this.count];
    this.head = (this.head + 1) % this.count;
    this._lock();

    const rim = leaving.material.userData.rim;
    const travel = TRANSITION;

    /* Front card accelerates toward the camera along its own axis, rotating
     * further as it goes, and must dissolve before the near plane rather than
     * clip through it.
     *
     * The ease is quadratic, not cubic. The fade delay is expressed in time, and
     * under a cubic ease 60% of the time is only 22% of the distance — the card
     * crossed the remaining 78% while still largely opaque and filled the right
     * half of the screen on its way past. Quadratic puts 60% of the distance at
     * 77% of the time, which is where the delay sits. */
    const fadeAt = travel * 0.775;

    this.exiting.add(leaving);

    this.tweens.push(
      gsap.to(leaving.mesh.position, { z: EXIT_Z, duration: travel, ease: 'power1.in' }),
      gsap.to(leaving.mesh.rotation, {
        z: leaving.mesh.rotation.z + 0.42,
        y: leaving.mesh.rotation.y + 0.18,
        duration: travel,
        ease: 'power1.in',
      }),
      gsap.to(leaving.material, {
        opacity: 0,
        duration: travel - fadeAt,
        delay: fadeAt,
        ease: 'power2.in',
        onComplete: () => {
          if (this.disposed) return;
          // Invisible now — send it to the back and fade it in as it settles.
          // Same mesh, new slot. Nothing is allocated.
          const back = this.count - 1;
          leaving.mesh.position.set(0, 0, 0);
          leaving.mesh.rotation.set(0, 0, 0);
          leaving.holder.position.set(0, 0, this._slotDepth(back) - 1.2);
          this.exiting.delete(leaving);
          this._applySlot(leaving, back, { duration: TRANSITION * 2.4, ease: 'power3.out' });
        },
      }),
      gsap.to(rim.uRimStrength, { value: 0, duration: fadeAt, ease: 'power2.in' }),
    );

    /* Everyone else advances one position, staggered so the stack breathes
       rather than stepping as a block. Both scale off TRANSITION — a fixed 80ms
       stagger across four cards would outlast the transition itself once it is
       this short, and the stack would still be settling as the next one began. */
    for (let i = 1; i < this.count; i++) {
      const panel = this.panels[(this.head + i - 1) % this.count];
      if (panel === leaving) continue;
      this._applySlot(panel, i - 1, {
        duration: TRANSITION * 1.6,
        delay: (i - 1) * TRANSITION * 0.16,
      });
    }

    this.onAdvance(this.head % this.count);
  }

  /* Reverse of _advance: the rear card returns to the front.
   *
   * Mirrored rather than reused — the front card leaves toward the camera, so
   * stepping back has to bring one IN from that same space, fading up as it
   * settles into slot 0. Running the forward animation backwards would pull a
   * card out of the back of the stack, which reads as a different mechanism. */
  _retreat() {
    this.head = (this.head - 1 + this.count) % this.count;
    this._lock();

    const incoming = this.panels[this.head];
    const rim = incoming.material.userData.rim;
    const mat = this._slotMaterial(0);

    gsap.killTweensOf([
      incoming.mesh.position,
      incoming.mesh.rotation,
      incoming.material,
      incoming.holder.position,
      rim.uRimStrength,
    ]);
    this.exiting.delete(incoming);

    incoming.holder.position.set(0, 0, this._slotDepth(0));
    incoming.mesh.position.set(0, 0, EXIT_Z);
    incoming.mesh.rotation.set(0, 0, 0.42);
    incoming.material.opacity = 0;
    rim.uRimStrength.value = 0;

    this.tweens.push(
      gsap.to(incoming.mesh.position, { z: 0, duration: TRANSITION, ease: 'power1.out' }),
      gsap.to(incoming.mesh.rotation, { z: 0, y: 0, duration: TRANSITION, ease: 'power1.out' }),
      gsap.to(incoming.material, {
        opacity: mat.opacity,
        roughness: mat.roughness,
        clearcoat: mat.clearcoat,
        iridescence: mat.iridescence,
        envMapIntensity: mat.envMapIntensity,
        emissiveIntensity: mat.emissiveIntensity,
        duration: TRANSITION * 0.7,
        ease: 'power2.out',
      }),
      gsap.to(rim.uRimStrength, {
        value: mat.rimStrength,
        duration: TRANSITION,
        ease: 'power2.out',
      }),
    );

    // Everyone else drops back one position.
    for (let i = 1; i < this.count; i++) {
      const panel = this.panels[(this.head + i) % this.count];
      this._applySlot(panel, i, {
        duration: TRANSITION * 1.6,
        delay: (i - 1) * TRANSITION * 0.16,
      });
    }

    this.onAdvance(this.head);
  }

  /* ── Frame loop ───────────────────────────────────────────────────────── */

  /* ── Adaptive quality ─────────────────────────────────────────────────────
   * Watches real frame times and steps the scene down once if the machine is not
   * keeping up. Measured rather than guessed from a device string: the same
   * laptop is fast on mains and slow on battery, and integrated GPUs vary by an
   * order of magnitude.
   *
   * The order is deliberate — least visible cost first. Pixel ratio goes before
   * bloom, bloom before multisampling, and the material never changes, because
   * clearcoat and iridescence ARE the look. A scene that keeps its materials at
   * 1.0 device pixels still looks like the design; one that keeps its pixels and
   * drops its materials does not.
   *
   * Only ever downgrades. Oscillating between quality levels is far more
   * noticeable than sitting at the lower one. */
  _watchPerformance(dt) {
    if (this.downgraded || !this.frameSamples) return;

    // Ignore the first second: shader compiles and texture uploads land there
    // and would trip the check on hardware that is actually fine.
    if (this.clock.getElapsedTime() < 1.5) return;

    this.frameSamples.push(dt);
    if (this.frameSamples.length < 90) return;

    const mean = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
    this.frameSamples.length = 0;

    // ~24ms is a sustained 42fps. Below that the carousel visibly stutters.
    if (mean < 0.024) return;

    this.downgraded = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    if (this.bloom) {
      this.composer.removePass(this.bloom);
      this.bloom.dispose?.();
      this.bloom = null;
    }
    this._resize();
  }

  _tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this._tick);
    if (!this.running) return;

    const dt = this.clock.getDelta();
    const t = this.clock.getElapsedTime();
    this._watchPerformance(dt);

    // Stack parallax, capped at 6 degrees each axis, lerped at 0.06 so it lags
    // the cursor rather than tracking it rigidly.
    const maxTilt = THREE.MathUtils.degToRad(6);
    let targetX;
    let targetY;

    if (this.pointer.inside) {
      targetY = BASE_ROT_Y + this.pointer.x * maxTilt;
      targetX = BASE_ROT_X + this.pointer.y * maxTilt;
    } else {
      /* Ambient drift, widened from 2 to 3.5 degrees. It is what keeps the
         specular alive when nobody is touching anything — a completely still
         stack reads as a flat image however good the material is. */
      const amb = THREE.MathUtils.degToRad(3.5);
      targetY = BASE_ROT_Y + Math.sin(t * 0.25) * amb;
      targetX = BASE_ROT_X + Math.cos(t * 0.19) * amb * 0.6;
    }

    this.parallax.x += (targetX - this.parallax.x) * 0.06;
    this.parallax.y += (targetY - this.parallax.y) * 0.06;

    /* Focus blends every target toward "front card square to the camera". At
       f = 0 this is exactly the old behaviour; z is only written while focus is
       in play so the load sequence's own rotation is left alone. */
    const f = this.focusState.amt;
    const loading = this.loadTl && this.loadTl.isActive();

    if (!loading) {
      this.group.rotation.x = this.parallax.x * (1 - f);
      this.group.rotation.y = this.parallax.y * (1 - f);
      if (f > 0 || this._wasFocused) this.group.rotation.z = BASE_ROT_Z * (1 - f);
    }

    if (!loading && (f > 0 || this._wasFocused)) {
      const g = this.group.position;
      this.camera.position.set(g.x * f, g.y * f, CAM_Z + (g.z + FOCUS_DIST - CAM_Z) * f);

      // The front face's copy would be blown up to a few letters across the
      // screen; it fades as the card arrives, and returns as it leaves.
      const front = this.panels[this.current];
      front.material.emissiveIntensity = this._slotMaterial(0).emissiveIntensity * (1 - f);

      this._wasFocused = f > 0;
    }

    /* Fan. Cards spread as the cursor approaches and close on leave, never far
     * enough to stop reading as one stack.
     *
     * Lerped toward the target on x/y rather than tweened, so a slot change
     * mid-advance is absorbed smoothly instead of snapping. This writes only x
     * and y; the exit flight owns z, so the two never contend. */
    // Closed while focused, so no rear card pokes out from behind the front one.
    this.fan += (this.fanTarget * (1 - f) - this.fan) * 0.07;

    /* Drag follow. The front card takes the drag offset (and the one-time
       hint nudge) on top of its fan position, plus a slight turn so it reads as
       being pushed through 3D rather than slid across a flat screen. Tighter
       lerp while a finger or the mouse is on it, so it tracks; looser after
       release, so springing back has some weight. Skipped mid-transition: the
       advance and retreat tweens own the front card then. */
    const push = this.dragWorld + this.nudge.v;
    const followRate = this.dragging ? 0.32 : 0.12;

    for (let i = 0; i < this.count; i++) {
      const panel = this.panels[(this.head + i) % this.count];
      if (this.exiting.has(panel)) continue;
      const front = i === 0;
      const targetFanX = this.fan * i * 0.17 + (front ? push : push * 0.12 * (1 / (i + 1)));
      const targetFanY = -this.fan * i * 0.05;
      const rate = front ? followRate : 0.1;
      panel.mesh.position.x += (targetFanX - panel.mesh.position.x) * rate;
      panel.mesh.position.y += (targetFanY - panel.mesh.position.y) * 0.1;
      if (front && !this.transitioning && !loading) {
        const rot = panel.mesh.rotation;
        rot.y += (push * 0.32 - rot.y) * followRate;
        rot.z += (-push * 0.06 - rot.z) * followRate;
      }
    }

    /* Rim highlight tracks the cursor, but biased toward the left.
     *
     * Following the cursor outright meant that pointing at the bottom-right lit
     * the rim on the near edge — the one closest to the viewer — which is the
     * geometry that produced the flare. Blending the cursor with a fixed
     * left-hand direction keeps the rim responsive without ever letting it sit
     * fully on the edge aimed at the camera. */
    if (this.pointer.inside) {
      _dir.set(this.pointer.x * 0.55 - 0.45, this.pointer.y * 0.55).normalize();
    } else {
      _dir.set(-1, 0);
    }
    this.panels.forEach((panel) => {
      panel.material.userData.rim.uRimDir.value.lerp(_dir, 0.08);
    });

    /* Fully focused, the card face fills the view and the page's backdrop
       covers it. Rendering that frame sixty times a second is a full-screen
       clearcoat-and-iridescence pass nobody can see, so the loop draws it once
       and then idles until focus starts to release. */
    if (f >= 1) {
      if (this._focusFrameDrawn) return;
      this._focusFrameDrawn = true;
    } else {
      this._focusFrameDrawn = false;
    }

    this.composer.render();
  };

  /* ── Input and lifecycle ──────────────────────────────────────────────── */

  _bind() {
    const host = this.canvas.parentElement;

    this._onPointerMove = (e) => {
      const r = host.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      this.pointer.inside = true;
      this.fanTarget = 1;
      this.hovering = true;
    };

    this._onPointerLeave = () => {
      this.pointer.inside = false;
      this.hovering = false;
      this.fanTarget = 0;
      host.style.cursor = '';
    };

    /* Click a card to open its service.
     *
     * Raycast rather than treating the whole canvas as a button: the canvas is
     * full-bleed, so a bare click handler would open a service when someone
     * clicked empty space next to the headline. The cursor only becomes a
     * pointer over an actual card, so the affordance matches the hit area.
     *
     * Opens whichever card is at the FRONT, wherever the stack was hit — a rear
     * card is mostly hidden, and opening something other than the card being
     * read would be a surprise. Without an onOpen handler it steps forward, as
     * it did before. */
    this._onClick = (e) => {
      // The click a browser fires at the end of a drag is not a click.
      if (this.suppressClick) return;
      if (this.focused || !this._hitTest(e)) return;
      if (this.onOpen) this.onOpen(this.current);
      else this.next();
    };

    // grab over a card: it can be dragged (and still clicked to open).
    this._onHoverTest = (e) => {
      if (this.dragging) return;
      host.style.cursor = !this.focused && this._hitTest(e) ? 'grab' : '';
    };

    this._onResize = () => this._resize();

    this._onVisibility = () => {
      this.running = document.visibilityState === 'visible' && this.inView;
      if (this.running) this.clock.getDelta();
    };

    // The carousel runs continuously, so a loop left running behind a hidden tab
    // or below the fold is a real battery cost, not a theoretical one.
    this._io = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        this.running = this.inView && document.visibilityState === 'visible';
      },
      { threshold: 0.01 },
    );
    this._io.observe(host);

    host.addEventListener('pointermove', this._onPointerMove, { passive: true });
    host.addEventListener('pointermove', this._onHoverTest, { passive: true });
    host.addEventListener('pointerleave', this._onPointerLeave);
    host.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize);
    document.addEventListener('visibilitychange', this._onVisibility);
    this._bindDrag(host);
  }

  /* ── Drag and swipe ───────────────────────────────────────────────────────
   *
   * Pointer events, so mouse, pen and touch share one path.
   *
   *   · Direction is decided once, on the first 8px of movement. Mostly
   *     vertical: the gesture is the page's (the host has touch-action: pan-y,
   *     so the browser scrolls natively and we let go). Mostly horizontal: it
   *     is ours, the pointer is captured and the front card follows.
   *   · Release commits past a distance (56px or 8% of the width) or a flick
   *     (0.45 px/ms over at least 16px); anything less springs back.
   *     Left = next, right = previous, through next()/prev(), so wrap-around,
   *     the transition lock and stopping the autoplay all match the arrows.
   *   · A plain tap or click never sets the axis, so card clicks still open the
   *     service. Only a real drag swallows the click that follows it.
   *   · Reduced motion: no follow, the release still snaps. (The scene is not
   *     mounted under reduced motion today; this keeps the rule true anyway.) */
  _bindDrag(host) {
    host.style.touchAction = 'pan-y';

    const DECIDE_PX = 8;

    this._onDragDown = (e) => {
      if (this.focused || this.disposed || !this.running) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.drag = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        dx: 0,
        axis: null,
        samples: [{ x: e.clientX, t: e.timeStamp }],
      };
      // No text selection or native image drag starting under a mouse drag.
      if (e.pointerType === 'mouse') e.preventDefault();
    };

    this._onDragMove = (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;

      if (!d.axis) {
        if (Math.hypot(dx, dy) < DECIDE_PX) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (d.axis === 'y') {
          this.drag = null;
          return;
        }
        try {
          host.setPointerCapture(e.pointerId);
        } catch {
          /* capture is an optimisation; the drag still works without it */
        }
        this.dragging = true;
        this._stopAutoplay();
        gsap.killTweensOf(this.nudge);
        this.nudge.v = 0;
        host.style.cursor = 'grabbing';
      }

      d.dx = dx;
      d.samples.push({ x: e.clientX, t: e.timeStamp });
      if (d.samples.length > 6) d.samples.shift();
      this.dragWorld = this.reducedMotion ? 0 : this._rubberBand(dx);
    };

    this._onDragEnd = (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      if (d.axis !== 'x') return;

      this.dragging = false;
      this.dragWorld = 0;
      host.style.cursor = '';
      try {
        host.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }

      // Swallow the click that follows this pointerup, and only that one.
      this.suppressClick = true;
      setTimeout(() => {
        this.suppressClick = false;
      }, 0);

      if (e.type === 'pointercancel') return;

      // Release velocity over the last ~100ms only, so a slow drag that ends
      // with a twitch is not mistaken for a flick, and vice versa.
      const last = d.samples[d.samples.length - 1];
      const first = d.samples.find((s) => last.t - s.t <= 100) ?? d.samples[0];
      const v = (last.x - first.x) / Math.max(last.t - first.t, 8);
      const far = Math.abs(d.dx) > Math.max(56, host.clientWidth * 0.08);
      const flick = Math.abs(v) > 0.5 && Math.abs(d.dx) > 32;
      if (!far && !flick) return; // springs back: dragWorld is already 0

      if (d.dx < 0) this.next();
      else this.prev();
    };

    host.addEventListener('pointerdown', this._onDragDown);
    host.addEventListener('pointermove', this._onDragMove);
    host.addEventListener('pointerup', this._onDragEnd);
    host.addEventListener('pointercancel', this._onDragEnd);
  }

  /* Pixels to the group's own units at the front card's depth, with resistance:
     linear for a short drag, then easing toward a ceiling so the card never
     leaves the stack however far the pointer goes. */
  _rubberBand(dx) {
    const host = this.canvas.parentElement;
    const h = host?.clientHeight || 1;
    const vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const pxPerUnit = (h / vh) * (this.group.scale.x || 1);
    const units = dx / pxPerUnit;
    const max = 0.85;
    return Math.sign(units) * max * (1 - Math.exp(-Math.abs(units) / max));
  }

  /* One small sideways nudge of the front card after the stack first settles,
     so the stack reads as something you can push. Once per browser, never
     looped, skipped under reduced motion or once someone has taken over. */
  _hintOnce() {
    if (this.reducedMotion || this._hinted) return;
    this._hinted = true;
    let seen = false;
    try {
      seen = localStorage.getItem('adv_stack_drag_hint') === '1';
      localStorage.setItem('adv_stack_drag_hint', '1');
    } catch {
      /* storage blocked: show it, once per page */
    }
    if (seen) return;
    this.tweens.push(
      gsap
        .timeline({ delay: 1.1 })
        .to(this.nudge, { v: -0.22, duration: 0.45, ease: 'power2.out' })
        .to(this.nudge, { v: 0, duration: 0.7, ease: 'power3.out' }),
    );
  }

  /** True when the pointer is over a visible card. */
  _hitTest(e) {
    const host = this.canvas.parentElement;
    if (!host) return false;
    const r = host.getBoundingClientRect();
    _ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    this.raycaster ??= new THREE.Raycaster();
    this.raycaster.setFromCamera(_ndc, this.camera);
    const meshes = this.panels
      // A card mid-exit is transparent and on its way past the camera; catching
      // a click on it would advance twice for one gesture.
      .filter((p) => !this.exiting.has(p) && p.material.opacity > 0.35)
      .map((p) => p.mesh);
    return this.raycaster.intersectObjects(meshes, false).length > 0;
  }

  _resize() {
    const host = this.canvas.parentElement;
    if (!host) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom?.setSize(w, h);
    this._layoutGroup(w, h);
  }

  dispose() {
    this.disposed = true;
    this.running = false;

    cancelAnimationFrame(this.raf);
    clearTimeout(this.advanceTimer);
    clearTimeout(this.lockTimer);
    this.loadTl?.kill();
    this.tweens.forEach((t) => t.kill());
    this.tweens = [];

    const host = this.canvas.parentElement;
    host?.removeEventListener('pointermove', this._onPointerMove);
    host?.removeEventListener('pointermove', this._onHoverTest);
    host?.removeEventListener('pointerleave', this._onPointerLeave);
    host?.removeEventListener('click', this._onClick);
    host?.removeEventListener('pointerdown', this._onDragDown);
    host?.removeEventListener('pointermove', this._onDragMove);
    host?.removeEventListener('pointerup', this._onDragEnd);
    host?.removeEventListener('pointercancel', this._onDragEnd);
    if (host) host.style.cursor = '';
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._io?.disconnect();

    this.panels.forEach((panel) => {
      panel.material.dispose();
      panel.holder.remove(panel.mesh);
      this.group.remove(panel.holder);
    });
    this.textures.forEach((t) => t.dispose());
    this.geometry.dispose();
    this.envRT?.dispose();
    this.renderTarget?.dispose();
    this.composer?.dispose?.();
    this.renderer.dispose();
  }
}

/* ADV: minimal stand-in for the deprecated THREE.Clock (getDelta / getElapsedTime only). */
class SceneClock {
  constructor() {
    this.last = performance.now();
    this.elapsed = 0;
  }
  getDelta() {
    const now = performance.now();
    const d = (now - this.last) / 1000;
    this.last = now;
    this.elapsed += d;
    return d;
  }
  getElapsedTime() {
    this.getDelta();
    return this.elapsed;
  }
}

// Scratch vectors, so the frame loop and hit tests allocate nothing.
const _dir = new THREE.Vector2();
const _ndc = new THREE.Vector2();
const _c0 = new THREE.Vector3();
const _c1 = new THREE.Vector3();
const _c2 = new THREE.Vector3();
const _c3 = new THREE.Vector3();

/** Cheap WebGL2 probe. Failure here keeps the poster on screen. */
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}
