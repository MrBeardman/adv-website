/**
 * Can this browser run the page's WebGL scenes on real graphics hardware?
 *
 * `failIfMajorPerformanceCaveat` makes the browser refuse a context that would run in software (SwiftShader,
 * llvmpipe, a blocklisted GPU). On those machines the hero scene and the drifting lines would run at a few
 * frames per second and block the main thread while the shaders link, so we skip them and the page shows its
 * own light instead (the same fallback as no WebGL). PageSpeed / Lighthouse run Chrome without a GPU, so
 * they take this path too.
 *
 * Set REQUIRE_HARDWARE_GL to false to run the scenes everywhere (the lab score then drops, see
 * docs/STATUS.md "Performance").
 */
export const REQUIRE_HARDWARE_GL = true;

export function canRunWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: REQUIRE_HARDWARE_GL });
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
