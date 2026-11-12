/**
 * What a visitor does on a page, measured only with consent (scripts/consent.ts track() refuses without
 * it, and so does the server). Started on every page; when the answer is still open it waits for "Allow".
 *
 *   page_view    once per page load
 *   page_leave   once, when the page is hidden or left: seconds it was actually visible, deepest scroll in %
 *   click        a link or button: its label and where it leads
 *
 * Not measured: anything inside a form or the inquiry (what people choose and type there is theirs until
 * they send it; the forms report only "started" and "step reached" themselves), the consent panel, mouse
 * movement, keystrokes.
 */
import { consent, track } from './consent';

const MAX_CLICKS = 60; // per page load

export function initMeasure() {
  let on = false;
  const start = () => {
    if (on || consent() !== 'granted') return;
    on = true;
    track('page_view', {});

    // time the page was really in front of the visitor, and how far down they got
    let visibleSince = document.hidden ? 0 : performance.now();
    let shown = 0;
    let depth = 0;
    const measureDepth = () => {
      const full = document.documentElement.scrollHeight;
      if (full > 0) depth = Math.max(depth, Math.min(100, Math.round(((scrollY + innerHeight) / full) * 100)));
    };
    measureDepth();
    addEventListener('scroll', measureDepth, { passive: true });
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      if (visibleSince) shown += performance.now() - visibleSince;
      track('page_leave', { seconds: Math.round(shown / 1000), depth });
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (visibleSince) shown += performance.now() - visibleSince;
        visibleSince = 0;
        // phones often never fire pagehide: a page hidden for good is reported here
        if (innerWidth < 760) leave();
      } else if (!left) visibleSince = performance.now();
    });
    addEventListener('pagehide', leave);

    let clicks = 0;
    document.addEventListener(
      'click',
      (e) => {
        const el = (e.target as HTMLElement).closest?.<HTMLElement>('a, button, [data-track]');
        if (!el || clicks >= MAX_CLICKS || el.closest('form, [data-inq], [data-consent]')) return;
        const label = (el.dataset.track || el.getAttribute('aria-label') || el.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);
        if (!label) return;
        let href = '';
        if (el instanceof HTMLAnchorElement && el.href) {
          try {
            const u = new URL(el.href);
            href = u.host === location.host ? u.pathname + u.hash : u.protocol === 'mailto:' ? 'mailto' : u.hostname;
          } catch {
            /* not a URL */
          }
        }
        clicks++;
        track('click', { target: label, href: href.slice(0, 200) });
      },
      true,
    );
  };
  start();
  // "Allow" was just pressed on this page
  document.addEventListener('adv:consent', start);
}
