/**
 * Consent and measurement (Honza, Nov 12 2026: "a cookie panel that actually works and is not tracking
 * before the user agrees").
 *
 * Two first-party cookies, both 180 days, SameSite=Lax:
 *   adv_consent  "granted" | "denied": the visitor's answer. Strictly necessary (it only stops the panel
 *                from asking again), so it needs no consent itself.
 *   adv_vid      a random id, written ONLY after "granted", deleted on "denied".
 *
 * track() is the only way anything is measured. It does nothing unless adv_consent is "granted", and the
 * server checks the same cookie again (lib/visitor.ts), so a bug on one side cannot measure anyone.
 * No third parties: events go to /api/track/ on this site.
 *
 * The panel (ui/Consent.astro) appears a moment after load when there is no answer yet; any
 * [data-consent-open] (the footer's "Cookie settings") opens it again to change the answer.
 */
const DAYS = 180;
const VID = /^[0-9a-f-]{36}$/i;

const read = (name: string) =>
  document.cookie
    .split('; ')
    .find((c) => c.startsWith(name + '='))
    ?.slice(name.length + 1) ?? '';
const write = (name: string, value: string, days: number) => {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${secure}`;
};
const uuid = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const h = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export const consent = () => read('adv_consent') as '' | 'granted' | 'denied';

export function grant() {
  write('adv_consent', 'granted', DAYS);
  if (!VID.test(read('adv_vid'))) write('adv_vid', uuid(), DAYS);
}
export function deny() {
  write('adv_consent', 'denied', DAYS);
  write('adv_vid', '', 0);
}

/** Record one event. A no-op without consent. */
export function track(event: 'form_start' | 'form_step', data: { form: string; service?: string; step?: string }) {
  if (consent() !== 'granted') return;
  const q = new URLSearchParams(location.search);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign']
    .map((k) => q.get(k) ?? '')
    .filter(Boolean)
    .join(' / ');
  let ref = '';
  try {
    // where the visitor came from, without the query string; nothing for moves inside this site
    const r = new URL(document.referrer);
    if (r.host !== location.host) ref = (r.hostname + r.pathname).slice(0, 200);
  } catch {
    /* no referrer */
  }
  const body = JSON.stringify({
    event,
    ...data,
    page: location.pathname,
    ref,
    lang: document.documentElement.lang,
    device: innerWidth < 760 ? 'mobile' : 'desktop',
    utm,
  });
  const sent = navigator.sendBeacon?.('/api/track/', new Blob([body], { type: 'application/json' }));
  if (!sent)
    fetch('/api/track/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
}

export function initConsent(panel: HTMLElement) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = panel.querySelector<HTMLElement>('[data-consent-now]');
  const gate = panel.querySelector<HTMLElement>('[data-consent-gate]');
  let closing = 0;
  const open = () => {
    clearTimeout(closing);
    const state = consent();
    panel.dataset.state = state;
    gate?.setAttribute('aria-checked', String(state === 'granted'));
    if (now) {
      now.hidden = !state;
      now.textContent = state === 'granted' ? (now.dataset.granted ?? '') : (now.dataset.denied ?? '');
    }
    panel.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
  };
  // the little wire answers first (the gate closes or the line is cut), then the panel leaves
  const close = (state: 'granted' | 'denied') => {
    panel.dataset.state = state;
    gate?.setAttribute('aria-checked', String(state === 'granted'));
    if (now) now.hidden = true;
    closing = window.setTimeout(
      () => {
        panel.classList.remove('is-open');
        closing = window.setTimeout(() => (panel.hidden = true), still ? 0 : 450);
      },
      still ? 0 : 950,
    );
  };
  panel.querySelector('[data-consent-grant]')?.addEventListener('click', () => {
    grant();
    close('granted');
  });
  panel.querySelector('[data-consent-deny]')?.addEventListener('click', () => {
    deny();
    close('denied');
  });
  // the switch in the wire does the same as the buttons: on = allow, off = decline
  gate?.addEventListener('click', () => {
    if (consent() === 'granted') {
      deny();
      close('denied');
    } else {
      grant();
      close('granted');
    }
  });
  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((b) =>
    b.addEventListener('click', () => {
      open();
      panel.querySelector<HTMLElement>('[data-consent-deny]')?.focus({ preventScroll: true });
    }),
  );
  if (consent()) return;
  // On a phone the card would sit on the hero's buttons: wait for the first scroll (or a while) there.
  if (innerWidth > 520) setTimeout(open, 1400);
  else {
    const first = () => {
      removeEventListener('scroll', first);
      clearTimeout(late);
      if (!consent()) open();
    };
    const late = window.setTimeout(first, 9000);
    addEventListener('scroll', first, { passive: true });
  }
}
