/**
 * Consent and measurement (Honza, Nov 12 2026: "a cookie panel that actually works and is not tracking
 * before the user agrees").
 *
 * Two first-party cookies, both 180 days, SameSite=Lax:
 *   adv_consent  "granted" | "denied": the visitor's answer. Strictly necessary (it only stops the panel
 *                from asking again), so it needs no consent itself.
 *   adv_vid      a random id, written ONLY after "granted", deleted on "denied".
 *
 * What is measured: page views, time and scroll depth, clicks on links and buttons (scripts/measure.ts),
 * and form starts and steps (scripts/form.ts, scripts/inquiry.ts).
 * track() is the only way anything is measured. It does nothing unless adv_consent is "granted", and the
 * server checks the same cookie again (lib/visitor.ts), so a bug on one side cannot measure anyone.
 * No third parties: events go to /api/track/ on this site.
 *
 * The panel (ui/Consent.astro) appears a moment after load when there is no answer yet. Its switch only
 * previews; "Allow" or "Decline" decides. Then the card folds into a small tab bottom left, which (like
 * the footer's "Cookie settings", [data-consent-open]) opens it again to change the answer.
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
  // scripts/measure.ts starts counting this page from now
  document.dispatchEvent(new Event('adv:consent'));
}
export function deny() {
  write('adv_consent', 'denied', DAYS);
  write('adv_vid', '', 0);
}

/** Record one event. A no-op without consent. */
export function track(
  event: 'page_view' | 'page_leave' | 'click' | 'form_start' | 'form_step',
  data: {
    form?: string;
    service?: string;
    step?: string;
    target?: string;
    href?: string;
    seconds?: number;
    depth?: number;
  },
) {
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
  const tab = document.querySelector<HTMLElement>('[data-consent-tab]');
  let closing = 0;
  // what the card shows: the stored answer, or what the switch is set to before a button confirms it
  const show = (state: '' | 'granted' | 'denied') => {
    panel.dataset.state = state;
    gate?.setAttribute('aria-checked', String(state === 'granted'));
  };
  // the small tab bottom left: there once an answer exists, away while the card is open
  const showTab = (on: boolean) => {
    if (!tab) return;
    tab.dataset.state = consent();
    if (on) {
      tab.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => tab.classList.add('is-in')));
    } else {
      tab.classList.remove('is-in');
      tab.hidden = true;
    }
  };
  const open = () => {
    clearTimeout(closing);
    showTab(false);
    const state = consent();
    show(state);
    if (now) {
      now.hidden = !state;
      now.textContent = state === 'granted' ? (now.dataset.granted ?? '') : (now.dataset.denied ?? '');
    }
    panel.classList.remove('is-folding');
    panel.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
  };
  // the wire answers first (the gate closes or the line is cut), then the card folds down into the tab
  const close = (state: 'granted' | 'denied') => {
    show(state);
    if (now) now.hidden = true;
    closing = window.setTimeout(
      () => {
        panel.classList.add('is-folding');
        panel.classList.remove('is-open');
        closing = window.setTimeout(
          () => {
            panel.hidden = true;
            panel.classList.remove('is-folding');
            showTab(true);
          },
          still ? 0 : 520,
        );
      },
      still ? 0 : 800,
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
  // The switch only sets what the card proposes (and which button lights up). Nothing is stored and
  // nothing is measured until that button is pressed: consent has to be an explicit yes.
  gate?.addEventListener('click', () => {
    if (panel.dataset.state === 'granted') show(consent() ? 'denied' : '');
    else show('granted');
    if (now) now.hidden = true;
  });
  const reopen = () => {
    open();
    panel.querySelector<HTMLElement>('[data-consent-gate]')?.focus({ preventScroll: true });
  };
  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((b) => b.addEventListener('click', reopen));
  tab?.addEventListener('click', reopen);
  if (consent()) {
    showTab(true);
    return;
  }
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
