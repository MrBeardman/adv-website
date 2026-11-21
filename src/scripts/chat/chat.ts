/**
 * The inquiry chat's conversation (components/chat/Chat.astro, data/chat.ts). Loaded on first open.
 *
 *   greeting → service → the service's questions (buttons or own words) → contact (the lead is saved)
 *   → up to 3 AI follow-up questions (api/chat ask) → a meeting slot (api/chat slots / book) → done.
 *
 * The script is one async run; every step awaits the visitor's input from the dock under the messages.
 * "Start over" begins a new run; the old one notices it is stale and stops at its next step.
 */
import { track } from '../consent';

interface Opt {
  id: string;
  label: string;
}
interface Q {
  id: string;
  kind: 'one' | 'many' | 'text';
  optional: boolean;
  title: string;
  hint: string;
  options: Opt[];
}
interface Svc {
  slug: string;
  title: string;
  covers: string;
}
interface Data {
  lang: 'cs' | 'en';
  flows: Record<string, Q[]>;
  services: Svc[];
  t: Record<string, string>;
  persona: string;
  mail: string;
}
interface Day {
  date: string;
  slots: string[];
}

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ZONE = 'Europe/Prague';
class Stale extends Error {}

let chat: Chat | null = null;

export function openChat(root: HTMLElement, service: string, opener: HTMLElement | null) {
  chat ??= new Chat(root);
  chat.open(service, opener);
}

class Chat {
  root: HTMLElement;
  D: Data;
  t: Record<string, string>;
  panel: HTMLElement;
  scrim: HTMLElement;
  log: HTMLOListElement;
  dock: HTMLElement;
  opener: HTMLElement | null = null;
  run = 0;
  started = false;
  service = '';
  answers: Record<string, string | string[]> = {};
  sid = '';
  contact = { name: '', email: '', phone: '', company: '' };
  lastWho: 'ai' | 'me' | '' = '';
  /** the log follows the newest message until the visitor scrolls up to read */
  pinned = true;

  constructor(root: HTMLElement) {
    this.root = root;
    this.D = JSON.parse(root.querySelector('[data-chat-data]')!.textContent || '{}');
    this.t = this.D.t;
    this.panel = root.querySelector('[data-chat-panel]')!;
    this.scrim = root.querySelector('[data-chat-scrim]')!;
    this.log = root.querySelector('[data-chat-log]')!;
    this.dock = root.querySelector('[data-chat-dock]')!;
    root.querySelector('[data-chat-close]')!.addEventListener('click', () => this.close());
    root.querySelector('[data-chat-restart]')!.addEventListener('click', () => this.restart());
    this.scrim.addEventListener('click', () => this.close());
    this.panel.addEventListener('keydown', (e) => this.keys(e));
    const unpin = () =>
      requestAnimationFrame(() => {
        this.pinned = this.log.scrollHeight - this.log.scrollTop - this.log.clientHeight < 48;
      });
    this.log.addEventListener('wheel', unpin, { passive: true });
    this.log.addEventListener('touchmove', unpin, { passive: true });
    // the dock easing to a new height shrinks the log every frame: keep its bottom in view meanwhile
    new ResizeObserver(() => {
      if (this.pinned) this.log.scrollTop = this.log.scrollHeight;
    }).observe(this.log);
  }

  // ---- window ----------------------------------------------------------------------------------------
  open(service: string, opener: HTMLElement | null) {
    this.opener = opener;
    const valid = service && this.D.flows[service] ? service : '';
    const wasOpen = !this.panel.hidden;
    if (!wasOpen) {
      this.panel.hidden = false;
      this.scrim.hidden = false;
      this.root.classList.add('is-open');
      document.documentElement.classList.add('adv-chat-lock');
      if (!RM) {
        this.panel.animate(
          [
            { opacity: 0, transform: 'translateY(24px) scale(0.94)', filter: 'blur(8px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0)' },
          ],
          { duration: 560, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
        this.scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });
      }
    }
    // a service button for a different service before the visitor has answered anything: start over on it
    if (!this.started || (valid && valid !== this.service && !Object.keys(this.answers).length && !this.sid)) {
      this.start(valid);
    }
    requestAnimationFrame(() => this.focusDock());
  }

  async close() {
    if (this.panel.hidden) return;
    this.root.classList.remove('is-open', 'is-thinking');
    document.documentElement.classList.remove('adv-chat-lock');
    if (!RM) {
      const a = this.panel.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(16px) scale(0.96)' },
        ],
        { duration: 220, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
      );
      this.scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 });
      await a.finished.catch(() => {});
    }
    this.panel.hidden = true;
    this.scrim.hidden = true;
    (this.opener?.isConnected ? this.opener : this.root.querySelector<HTMLElement>('[data-chat-launcher]'))?.focus();
  }

  keys(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const f = [...this.panel.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select')].filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  focusDock() {
    const el = this.dock.querySelector<HTMLElement>('textarea, input, button');
    (el ?? this.panel.querySelector<HTMLElement>('[data-chat-close]'))?.focus({ preventScroll: true });
  }

  restart() {
    this.service = '';
    this.start('');
  }

  start(service: string) {
    this.run++;
    this.started = true;
    this.service = service;
    this.answers = {};
    this.sid = '';
    this.lastWho = '';
    this.log.replaceChildren();
    this.dock.replaceChildren();
    this.root.classList.remove('is-thinking');
    track('form_start', { form: 'chat', service, step: 'open' });
    this.flow(this.run).catch((e) => {
      if (!(e instanceof Stale)) console.error('[chat]', e);
    });
  }

  // ---- messages --------------------------------------------------------------------------------------
  alive(run: number) {
    if (run !== this.run) throw new Stale();
  }
  wait(ms: number) {
    return new Promise((r) => setTimeout(r, RM ? 0 : ms));
  }
  scroll() {
    this.pinned = true;
    this.log.scrollTo({ top: this.log.scrollHeight, behavior: RM ? 'auto' : 'smooth' });
  }
  fill(s: string, v: Record<string, string> = {}) {
    return s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? (k === 'name' ? this.D.persona : k === 'mail' ? this.D.mail : ''));
  }

  row(who: 'ai' | 'me') {
    const li = document.createElement('li');
    li.className = `adv-chat__msg adv-chat__msg--${who}`;
    if (who === 'ai') {
      if (this.lastWho === 'ai') li.classList.add('is-cont');
      li.append(Object.assign(document.createElement('span'), { className: 'adv-chat__orb adv-chat__orb--sm' }));
      li.firstElementChild!.setAttribute('aria-hidden', 'true');
    }
    this.lastWho = who;
    return li;
  }

  typing() {
    const li = this.row('ai');
    const b = document.createElement('div');
    b.className = 'adv-chat__bubble adv-chat__typing';
    b.setAttribute('aria-label', this.fill(this.t.typing));
    b.append(...[0, 1, 2].map(() => document.createElement('i')));
    li.append(b);
    this.log.append(li);
    this.scroll();
    return () => {
      li.remove();
      this.lastWho = this.log.lastElementChild?.classList.contains('adv-chat__msg--me')
        ? 'me'
        : this.log.lastElementChild
          ? 'ai'
          : '';
    };
  }

  /** The assistant says something: dots for a beat, then the words fade in. */
  async say(run: number, text: string, hint = '', pause?: number) {
    this.alive(run);
    const done = this.typing();
    await this.wait(pause ?? Math.min(1000, 380 + text.length * 7));
    this.alive(run);
    done();
    const li = this.row('ai');
    const b = document.createElement('div');
    b.className = 'adv-chat__bubble';
    const words = text.split(/(\s+)/);
    let i = 0;
    for (const w of words) {
      if (/^\s+$/.test(w) || RM) b.append(w);
      else {
        const s = document.createElement('span');
        s.className = 'adv-chat__w';
        s.style.setProperty('--i', String(Math.min(i++, 40)));
        s.textContent = w;
        b.append(s);
      }
    }
    if (hint) b.append(Object.assign(document.createElement('small'), { textContent: hint }));
    li.append(b);
    this.log.append(li);
    this.scroll();
    await this.wait(Math.min(i, 40) * 26 + 160);
    this.alive(run);
  }

  me(text: string) {
    const li = this.row('me');
    li.append(Object.assign(document.createElement('div'), { className: 'adv-chat__bubble', textContent: text }));
    this.log.append(li);
    this.scroll();
  }

  status(text: string, ok = false) {
    const li = document.createElement('li');
    li.className = `adv-chat__status${ok ? ' adv-chat__status--ok' : ''}`;
    li.textContent = text;
    this.log.append(li);
    this.lastWho = '';
    this.scroll();
  }

  /** Swap what the visitor can do; the dock eases to its new height. */
  setDock(run: number, ...nodes: Node[]) {
    this.alive(run);
    const h0 = this.dock.offsetHeight;
    this.dock.replaceChildren(...nodes);
    const h1 = this.dock.offsetHeight;
    if (!RM && h0 !== h1)
      this.dock.animate([{ height: `${h0}px` }, { height: `${h1}px` }], {
        duration: 420,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      });
    this.scroll();
    if (!this.panel.hidden) requestAnimationFrame(() => this.focusDock());
  }

  thinking(on: boolean) {
    this.root.classList.toggle('is-thinking', on);
  }

  async post(body: Record<string, unknown>) {
    const res = await fetch('/api/chat/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: this.D.lang, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json as Record<string, any> };
  }

  // ---- inputs ----------------------------------------------------------------------------------------
  chip(label: string, i: number, extra = '') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `adv-chat__chip ${extra}`.trim();
    b.style.setProperty('--i', String(i));
    b.textContent = label;
    return b;
  }

  /**
   * a text box with a send button; resolves with the text. With `picked` (the pills chosen above it) the
   * answer is those pills plus anything typed, and send works as soon as one pill is chosen.
   */
  compose(placeholder: string, onSend: (text: string) => void, rows = 1, picked?: () => string[]) {
    const wrap = document.createElement('div');
    wrap.className = 'adv-chat__compose';
    const ta = document.createElement('textarea');
    ta.rows = rows;
    ta.maxLength = 1000;
    ta.placeholder = placeholder;
    ta.setAttribute('aria-label', placeholder);
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'adv-chat__send';
    send.setAttribute('aria-label', this.t.send);
    send.disabled = true;
    send.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const fit = () => {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 132)}px`;
      send.disabled = !ta.value.trim() && !picked?.().length;
    };
    const go = () => {
      const v = [...(picked?.() ?? []), ta.value.trim()].filter(Boolean).join(', ');
      if (v) onSend(v);
    };
    (wrap as HTMLElement & { refresh?: () => void }).refresh = fit;
    ta.addEventListener('input', fit);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        go();
      }
    });
    send.addEventListener('click', go);
    wrap.append(ta, send);
    return wrap;
  }

  pickService(run: number): Promise<Svc> {
    return new Promise((resolve) => {
      const box = document.createElement('div');
      box.className = 'adv-chat__chips';
      this.D.services.forEach((s, i) => {
        const b = this.chip('', i, 'adv-chat__chip--svc');
        b.append(Object.assign(document.createElement('span'), { textContent: s.title }));
        b.append(Object.assign(document.createElement('small'), { textContent: s.covers }));
        b.addEventListener('click', () => resolve(s));
        box.append(b);
      });
      this.setDock(run, box);
    });
  }

  /** a scripted question: buttons and/or own words; resolves with the stored value and what to show */
  answer(run: number, q: Q): Promise<{ value: string | string[] | null; text: string }> {
    return new Promise((resolve) => {
      const nodes: Node[] = [];
      const own = (text: string) => resolve({ value: text, text });
      if (q.kind === 'text') {
        nodes.push(this.compose(this.t.ownLong, own, 3));
      } else {
        const box = document.createElement('div');
        box.className = 'adv-chat__chips';
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', q.title);
        const chosen = new Set<string>();
        const doneBtn = document.createElement('button');
        q.options.forEach((op, i) => {
          const b = this.chip(op.label, i);
          if (q.kind === 'many') b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', () => {
            if (q.kind === 'one') {
              b.setAttribute('aria-pressed', 'true');
              resolve({ value: op.id, text: op.label });
              return;
            }
            chosen.has(op.id) ? chosen.delete(op.id) : chosen.add(op.id);
            b.setAttribute('aria-pressed', String(chosen.has(op.id)));
            doneBtn.disabled = !chosen.size;
          });
          box.append(b);
        });
        nodes.push(box);
        if (q.kind === 'many') {
          doneBtn.type = 'button';
          doneBtn.className = 'adv-btn adv-btn--primary adv-btn--sm';
          doneBtn.textContent = this.t.done;
          doneBtn.disabled = true;
          doneBtn.addEventListener('click', () => {
            const ids = q.options.filter((o) => chosen.has(o.id));
            resolve({ value: ids.map((o) => o.id), text: ids.map((o) => o.label).join(', ') });
          });
        }
        nodes.push(this.compose(this.t.own, own));
        const row = document.createElement('div');
        row.className = 'adv-chat__row';
        if (q.optional) {
          const skip = document.createElement('button');
          skip.type = 'button';
          skip.className = 'adv-chat__link';
          skip.textContent = this.t.skip;
          skip.addEventListener('click', () => resolve({ value: null, text: this.t.skipped }));
          row.append(skip);
        } else row.append(document.createElement('span'));
        if (q.kind === 'many') row.append(doneBtn);
        if (row.childElementCount > 1 || q.optional) nodes.push(row);
      }
      if (q.kind === 'text' && q.optional) {
        const row = document.createElement('div');
        row.className = 'adv-chat__row';
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'adv-chat__link';
        skip.textContent = this.t.skip;
        skip.addEventListener('click', () => resolve({ value: null, text: this.t.skipped }));
        row.append(skip);
        nodes.push(row);
      }
      this.setDock(run, ...nodes);
    });
  }

  /**
   * One contact detail as a chat answer: a single-line box with the right keyboard and autofill, an
   * optional Skip, and a check before it is sent. Resolves with the value ("" when skipped).
   */
  field(
    run: number,
    o: {
      name: string;
      type: string;
      auto: string;
      mode?: string;
      ph: string;
      optional?: boolean;
      check?: (v: string) => boolean;
    },
  ): Promise<string> {
    return new Promise((resolve) => {
      const f = document.createElement('form');
      f.className = 'adv-chat__compose';
      f.noValidate = true;
      const i = document.createElement('input');
      i.name = o.name;
      i.type = o.type;
      i.autocomplete = o.auto as AutoFill;
      if (o.mode) i.inputMode = o.mode;
      i.maxLength = o.name === 'phone' ? 40 : 200;
      i.placeholder = o.ph;
      i.setAttribute('aria-label', o.ph);
      i.value = (this.contact as Record<string, string>)[o.name] ?? '';
      const send = document.createElement('button');
      send.type = 'submit';
      send.className = 'adv-chat__send';
      send.setAttribute('aria-label', this.t.send);
      send.disabled = !i.value.trim();
      send.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      f.append(i, send);
      const nodes: Node[] = [f];
      if (o.name === 'name') {
        // bots fill every field; people never see this one
        const hp = document.createElement('input');
        hp.type = 'text';
        hp.name = 'website_hp';
        hp.tabIndex = -1;
        hp.autocomplete = 'off';
        hp.setAttribute('aria-hidden', 'true');
        hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
        hp.addEventListener('input', () => ((this as any).hp = hp.value));
        f.append(hp);
      }
      const err = document.createElement('p');
      err.className = 'adv-chat__err';
      err.setAttribute('role', 'alert');
      nodes.push(err);
      i.addEventListener('input', () => {
        send.disabled = !i.value.trim();
        err.textContent = '';
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = i.value.trim();
        if (!v) return;
        if (o.check && !o.check(v)) {
          err.textContent = this.t.invalid;
          i.focus();
          return;
        }
        resolve(v);
      });
      if (o.optional) {
        const row = document.createElement('div');
        row.className = 'adv-chat__row';
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'adv-chat__link';
        skip.textContent = this.t.skip;
        skip.addEventListener('click', () => resolve(''));
        row.append(skip);
        nodes.push(row);
      }
      this.setDock(run, ...nodes);
    });
  }

  /** the day pills and the times of the chosen day; resolves with the start or null (get in touch) */
  pickSlot(run: number, days: Day[]): Promise<string | null> {
    return new Promise((resolve) => {
      const locale = this.D.lang === 'cs' ? 'cs-CZ' : 'en-GB';
      const dayFmt = (date: string, o: Intl.DateTimeFormatOptions) =>
        new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', ...o });
      const timeFmt = (iso: string) =>
        new Date(iso).toLocaleTimeString(locale, { timeZone: ZONE, hour: '2-digit', minute: '2-digit' });

      const wrap = document.createElement('div');
      const dayRow = document.createElement('div');
      dayRow.className = 'adv-chat__days';
      dayRow.setAttribute('role', 'group');
      const times = document.createElement('div');
      times.className = 'adv-chat__times';
      times.setAttribute('role', 'group');
      const row = document.createElement('div');
      row.className = 'adv-chat__row';
      const none = document.createElement('button');
      none.type = 'button';
      none.className = 'adv-chat__link';
      none.textContent = this.t.calNone;
      none.addEventListener('click', () => resolve(null));
      const book = document.createElement('button');
      book.type = 'button';
      book.className = 'adv-btn adv-btn--primary adv-btn--sm';
      book.hidden = true;
      row.append(none, book);
      const zone = Object.assign(document.createElement('p'), {
        className: 'adv-chat__zone',
        textContent: this.t.calZone,
      });

      let pickedDay = '';
      let picked = '';
      const showTimes = (d: Day, animate: boolean) => {
        pickedDay = d.date;
        dayRow
          .querySelectorAll('button')
          .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.date === d.date)));
        times.setAttribute('aria-label', dayFmt(d.date, { weekday: 'long', day: 'numeric', month: 'long' }));
        const h0 = this.dock.offsetHeight;
        times.replaceChildren(
          ...d.slots.map((iso, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'adv-chat__time';
            b.style.setProperty('--i', String(i));
            b.textContent = timeFmt(iso);
            b.setAttribute('aria-pressed', String(iso === picked));
            b.addEventListener('click', () => {
              picked = iso;
              times.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
              const when = `${dayFmt(d.date, { weekday: 'short', day: 'numeric', month: 'numeric' })} ${timeFmt(iso)}`;
              book.textContent = this.fill(this.t.calBook, { when });
              book.hidden = false;
            });
            return b;
          }),
        );
        if (!d.slots.includes(picked)) book.hidden = true;
        const h1 = this.dock.offsetHeight;
        if (animate && !RM && h0 !== h1)
          this.dock.animate([{ height: `${h0}px` }, { height: `${h1}px` }], {
            duration: 360,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          });
      };
      days.forEach((d, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'adv-chat__day';
        b.dataset.date = d.date;
        b.style.setProperty('--i', String(i));
        b.setAttribute('aria-label', dayFmt(d.date, { weekday: 'long', day: 'numeric', month: 'long' }));
        b.append(
          Object.assign(document.createElement('small'), { textContent: dayFmt(d.date, { weekday: 'short' }) }),
          dayFmt(d.date, { day: 'numeric', month: 'numeric' }),
        );
        b.addEventListener('click', () => pickedDay !== d.date && showTimes(d, true));
        dayRow.append(b);
      });
      book.addEventListener('click', () => picked && resolve(picked));
      wrap.append(dayRow, times, zone, row);
      this.setDock(run, wrap);
      showTimes(days[0], false);
    });
  }

  finishDock(run: number) {
    const row = document.createElement('div');
    row.className = 'adv-chat__row';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adv-btn adv-btn--primary adv-btn--sm';
    btn.textContent = this.t.finish;
    btn.addEventListener('click', () => this.close());
    row.append(document.createElement('span'), btn);
    this.setDock(run, row);
  }

  // ---- the conversation ------------------------------------------------------------------------------
  async flow(run: number) {
    const t = this.t;
    await this.say(run, this.fill(t.greeting), '', 700);
    if (!this.service) {
      await this.say(run, t.pick);
      const s = await this.pickService(run);
      this.alive(run);
      this.service = s.slug;
      this.me(s.title);
      this.setDock(run);
    } else {
      this.me(this.D.services.find((s) => s.slug === this.service)?.title ?? '');
    }

    for (const q of this.D.flows[this.service] ?? []) {
      const hint = [q.hint, q.kind === 'many' ? t.many : ''].filter(Boolean).join(' ');
      await this.say(run, q.title, hint);
      const a = await this.answer(run, q);
      this.alive(run);
      if (a.value !== null) this.answers[q.id] = a.value;
      this.me(a.text);
      this.setDock(run);
      track('form_step', { form: 'chat', service: this.service, step: q.id });
    }

    // contact, asked one detail at a time like the rest of the chat → the lead is saved
    const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const ask = async (text: string, o: Parameters<typeof this.field>[1]) => {
      await this.say(run, text);
      const v = await this.field(run, o);
      this.alive(run);
      this.setDock(run);
      this.me(v || t.skipped);
      return v;
    };
    let ai = false;
    this.contact.name = await ask(t.contactName, { name: 'name', type: 'text', auto: 'name', ph: t.namePh });
    this.contact.company = await ask(t.contactCompany, {
      name: 'company',
      type: 'text',
      auto: 'organization',
      ph: t.companyPh,
      optional: true,
    });
    for (;;) {
      this.contact.email = await ask(t.contactEmail, {
        name: 'email',
        type: 'email',
        auto: 'email',
        mode: 'email',
        ph: t.emailPh,
        check: emailOk,
      });
      if (!this.contact.phone)
        this.contact.phone = await ask(t.contactPhone, {
          name: 'phone',
          type: 'tel',
          auto: 'tel',
          mode: 'tel',
          ph: t.phonePh,
          optional: true,
        });
      const stop = this.typing();
      const res = await this.post({
        action: 'lead',
        service: this.service,
        answers: this.answers,
        ...this.contact,
        website_hp: (this as any).hp ?? '',
        page: location.pathname,
      }).catch(() => ({ status: 0, body: {} as Record<string, any> }));
      stop();
      this.alive(run);
      if (res.body.ok) {
        this.sid = res.body.sid;
        ai = !!res.body.ai;
        break;
      }
      await this.say(run, res.status === 422 ? t.invalid : this.fill(t.error), '', 300);
    }
    track('form_step', { form: 'chat', service: this.service, step: 'contact' });
    this.status(t.leadSaved, true);

    // AI follow-ups
    if (ai && this.sid) {
      await this.say(run, t.aiIntro);
      let answer: string | undefined;
      for (let guard = 0; guard < 6; guard++) {
        this.thinking(true);
        const stop = this.typing();
        const started = performance.now();
        const res = await this.post({ action: 'ask', sid: this.sid, answer }).catch(() => ({
          status: 0,
          body: { ok: true, done: true } as Record<string, any>,
        }));
        // a reply that comes too fast reads as canned; keep the dots up for a moment
        await this.wait(Math.max(0, 700 - (performance.now() - started)));
        stop();
        this.thinking(false);
        this.alive(run);
        if (!res.body.ok || res.body.done) {
          await this.say(run, res.body.offTopic ? t.aiOffTopic : t.aiDone, '', 300);
          break;
        }
        const many = Array.isArray(res.body.suggestions) && res.body.suggestions.length > 1;
        await this.say(run, String(res.body.question), many ? t.many : '', 200);
        answer = await new Promise<string>((resolve) => {
          const nodes: Node[] = [];
          const sug: string[] = Array.isArray(res.body.suggestions) ? res.body.suggestions : [];
          const chosen = new Set<string>();
          if (sug.length) {
            const box = document.createElement('div');
            box.className = 'adv-chat__chips';
            box.setAttribute('role', 'group');
            sug.forEach((s, i) => {
              const b = this.chip(s, i);
              b.setAttribute('aria-pressed', 'false');
              // pills only select; the visitor can pick several, add own words and then send
              b.addEventListener('click', () => {
                chosen.has(s) ? chosen.delete(s) : chosen.add(s);
                b.setAttribute('aria-pressed', String(chosen.has(s)));
                box.nextElementSibling &&
                  (box.nextElementSibling as HTMLElement & { refresh?: () => void }).refresh?.();
              });
              box.append(b);
            });
            nodes.push(box);
          }
          nodes.push(
            this.compose(sug.length ? t.ownAdd : t.ownLong, resolve, sug.length ? 1 : 2, () =>
              sug.filter((s) => chosen.has(s)),
            ),
          );
          this.setDock(run, ...nodes);
        });
        this.alive(run);
        this.me(answer);
        this.setDock(run);
        track('form_step', { form: 'chat', service: this.service, step: `ai-${res.body.turn}` });
      }
    }

    // a meeting
    const stop = this.typing();
    const slots = await this.post({ action: 'slots' }).catch(() => ({ status: 0, body: {} as Record<string, any> }));
    stop();
    this.alive(run);
    let days: Day[] = Array.isArray(slots.body.days) ? slots.body.days : [];
    if (!days.length) {
      await this.say(run, t.calEmpty);
      await this.say(run, this.fill(t.bye), '', 400);
      this.finishDock(run);
      return;
    }
    await this.say(run, t.calTitle);
    for (;;) {
      const start = await this.pickSlot(run, days);
      this.alive(run);
      if (!start) {
        this.setDock(run);
        this.me(t.calNone);
        await this.say(run, t.calNoneReply);
        break;
      }
      this.setDock(run);
      const stopB = this.typing();
      const res = await this.post({ action: 'book', sid: this.sid, start, ...this.contact }).catch(() => ({
        status: 0,
        body: {} as Record<string, any>,
      }));
      stopB();
      this.alive(run);
      if (res.body.ok) {
        this.me(String(res.body.when));
        track('form_submit', { form: 'chat', service: this.service, step: 'booked' });
        await this.say(run, this.fill(t.booked, { when: String(res.body.when), email: this.contact.email }));
        break;
      }
      if (res.status === 409 && res.body.reason === 'taken') {
        await this.say(run, t.calTaken, '', 300);
        const again = await this.post({ action: 'slots' }).catch(() => ({
          status: 0,
          body: {} as Record<string, any>,
        }));
        days = Array.isArray(again.body.days) && again.body.days.length ? again.body.days : days;
        continue;
      }
      await this.say(run, this.fill(t.error), '', 300);
    }
    await this.say(run, this.fill(t.bye), '', 400);
    this.finishDock(run);
  }
}
