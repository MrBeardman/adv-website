/**
 * Count-up: [data-count="340000"] (+ data-prefix, data-suffix, data-decimals) counts from 0.
 * The final text is in the markup, so no-JS and reduced motion read the real value.
 */
export function countUp(el: HTMLElement, delay = 0) {
  const loc = document.documentElement.lang.startsWith('cs') ? 'cs-CZ' : 'en-GB';
  const to = Number(el.dataset.count);
  const dec = Number(el.dataset.decimals || 0);
  const fmt = new Intl.NumberFormat(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const pre = el.dataset.prefix ?? '';
  const suf = el.dataset.suffix ?? '';
  const dur = 1500;
  let t0 = 0;
  const step = (now: number) => {
    if (!t0) t0 = now + delay;
    const p = Math.max(0, Math.min(1, (now - t0) / dur));
    el.textContent = pre + fmt.format(to * (1 - Math.pow(1 - p, 4))) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  el.textContent = pre + fmt.format(0) + suf;
  requestAnimationFrame(step);
}
