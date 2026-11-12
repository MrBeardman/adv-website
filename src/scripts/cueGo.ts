/**
 * A scroll cue is also a control: pressing it brings the next section up under the header.
 * `from`: anything inside the hero; the target is whatever follows the hero's <header> or <section>.
 */
export function goNext(from: Element) {
  // the next thing that actually takes up room (scripts and styles sit between sections too)
  let next = from.closest('header, section')?.nextElementSibling as HTMLElement | null;
  while (next && !next.offsetHeight) next = next.nextElementSibling as HTMLElement | null;
  if (!next) return;
  const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--adv-header-h')) || 72;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollTo({ top: next.getBoundingClientRect().top + scrollY - head - 8, behavior: still ? 'auto' : 'smooth' });
}
