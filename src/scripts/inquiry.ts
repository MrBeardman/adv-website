/**
 * The per-service inquiry (components/inquiry/Inquiry.astro): a small state machine.
 *   pick a service → its questions one at a time → contact → POST /api/inquiry → the run log.
 * One-choice questions advance on click; many-choice and text questions use Next; optional ones can be
 * skipped. The rail on the left shows every step with a now-mark. Focus moves to each new question.
 */
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
interface Data {
  flows: Record<string, Q[]>;
  names: Record<string, string>;
  t: Record<string, any>;
  mail: string;
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initInquiry(root: HTMLElement) {
  const raw = root.querySelector<HTMLScriptElement>('[data-inq-data]');
  if (!raw) return;
  const D: Data = JSON.parse(raw.textContent || '{}');
  const t = D.t;
  const lang = root.dataset.lang === 'en' ? 'en' : 'cs';
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const pickEl = $('[data-inq-pick]');
  const qEl = $('[data-inq-question]');
  const contact = $<HTMLFormElement>('[data-inq-contact]');
  const runEl = $('[data-inq-run]');
  const log = $('[data-inq-log]');
  const rail = $('[data-inq-rail]');
  const nav = $('[data-inq-nav]');
  const back = $<HTMLButtonElement>('[data-inq-back]');
  const next = $<HTMLButtonElement>('[data-inq-next]');
  const skip = $<HTMLButtonElement>('[data-inq-skip]');
  const status = $('[data-inq-status]');

  let service = '';
  let step = -1; // -1 pick, 0..n-1 questions, n contact, n+1 run
  const answers: Record<string, string | string[]> = {};
  const flow = () => D.flows[service] ?? [];

  const fromUrl = new URLSearchParams(location.search).get('service') ?? '';
  const preset = [root.dataset.preset ?? '', fromUrl].find((s) => s && D.flows[s]);

  const answered = (q: Q) => {
    const a = answers[q.id];
    return Array.isArray(a) ? a.length > 0 : !!a && String(a).trim().length > 0;
  };

  function renderRail() {
    rail.replaceChildren();
    const items = [service ? D.names[service] : t.pick, ...flow().map((q) => q.title), t.contactStep];
    items.forEach((label, k) => {
      const li = document.createElement('li');
      li.textContent = label;
      const idx = k - 1; // rail item k ↔ step k-1
      if (idx < step || (k === 0 && service)) li.classList.add('is-done');
      if (idx === step) li.classList.add('is-now');
      if (idx === step) li.setAttribute('aria-current', 'step');
      rail.append(li);
    });
  }

  function focusQ(el: HTMLElement) {
    const q = el.querySelector<HTMLElement>('.adv-inq__q');
    if (!q) return;
    q.tabIndex = -1;
    q.focus({ preventScroll: true });
  }

  function renderQuestion(q: Q) {
    qEl.replaceChildren();
    const fs = document.createElement('fieldset');
    fs.className = 'adv-inq__step';
    fs.style.display = 'grid';
    const meta = document.createElement('p');
    meta.className = 'adv-inq__meta';
    const chosen = document.createElement('span');
    chosen.className = 'adv-inq__chosen';
    chosen.textContent = D.names[service];
    const change = document.createElement('button');
    change.type = 'button';
    change.className = 'adv-inq__change';
    change.textContent = t.change;
    change.addEventListener('click', () => go(-1));
    meta.append(chosen, change);
    if (q.optional) meta.append(Object.assign(document.createElement('span'), { textContent: t.optional }));
    if (q.kind === 'many') meta.append(Object.assign(document.createElement('span'), { textContent: t.many }));
    const legend = document.createElement('legend');
    legend.className = 'adv-inq__q';
    legend.textContent = q.title;
    fs.append(legend, meta);
    if (q.hint)
      fs.append(Object.assign(document.createElement('p'), { className: 'adv-inq__hint', textContent: q.hint }));

    if (q.kind === 'text') {
      const ta = document.createElement('textarea');
      ta.className = 'adv-input';
      ta.rows = 4;
      ta.maxLength = 3000;
      ta.setAttribute('aria-label', q.title);
      ta.value = String(answers[q.id] ?? '');
      ta.addEventListener('input', () => {
        answers[q.id] = ta.value;
        sync();
      });
      fs.append(ta);
    } else {
      const grid = document.createElement('div');
      grid.className = 'adv-inq__options';
      q.options.forEach((op) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'adv-inq__opt adv-lit';
        b.dataset.kind = q.kind;
        b.append(document.createElement('i'), op.label);
        const cur = answers[q.id];
        const on = Array.isArray(cur) ? cur.includes(op.id) : cur === op.id;
        b.setAttribute('aria-pressed', String(on));
        b.addEventListener('click', () => {
          if (q.kind === 'one') {
            answers[q.id] = op.id;
            grid.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            setTimeout(() => go(step + 1), reduceMotion ? 0 : 260);
          } else {
            const list = new Set(Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : []);
            list.has(op.id) ? list.delete(op.id) : list.add(op.id);
            answers[q.id] = [...list];
            b.setAttribute('aria-pressed', String(list.has(op.id)));
          }
          sync();
        });
        grid.append(b);
      });
      fs.append(grid);
    }
    qEl.append(fs);
  }

  function sync() {
    const n = flow().length;
    nav.hidden = step < 0 || step > n;
    back.hidden = step < 0;
    if (step >= 0 && step < n) {
      const q = flow()[step];
      next.hidden = q.kind === 'one' && !answered(q);
      next.textContent = t.next;
      next.disabled = !q.optional && !answered(q);
      skip.hidden = !q.optional || answered(q);
    } else if (step === n) {
      next.hidden = false;
      next.disabled = false;
      next.textContent = t.submit;
      skip.hidden = true;
    }
  }

  function go(to: number) {
    const n = flow().length;
    step = Math.max(-1, Math.min(to, n + 1));
    pickEl.hidden = step !== -1;
    qEl.hidden = !(step >= 0 && step < n);
    contact.hidden = step !== n;
    runEl.hidden = step !== n + 1;
    if (step >= 0 && step < n) renderQuestion(flow()[step]);
    renderRail();
    sync();
    const shown = [pickEl, qEl, contact, runEl].find((el) => !el.hidden);
    if (shown && step !== -1) focusQ(shown);
  }

  root.querySelectorAll<HTMLButtonElement>('[data-inq-service]').forEach((b) =>
    b.addEventListener('click', () => {
      if (service !== b.dataset.inqService) for (const k in answers) delete answers[k];
      service = b.dataset.inqService!;
      go(0);
    }),
  );
  back.addEventListener('click', () => go(step - 1));
  skip.addEventListener('click', () => go(step + 1));
  next.addEventListener('click', () => (step === flow().length ? send() : go(step + 1)));

  async function send() {
    const fd = new FormData(contact);
    const email = String(fd.get('email') ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      status.dataset.state = 'error';
      status.textContent = t.invalid;
      contact.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
      return;
    }
    next.disabled = true;
    next.textContent = t.sending;
    status.textContent = '';
    try {
      const res = await fetch('/api/inquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          service,
          answers,
          name: fd.get('name'),
          company: fd.get('company'),
          email,
          phone: fd.get('phone'),
          website_hp: fd.get('website_hp'),
          page: location.pathname,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.message || 'failed');
      showRun(body.classified);
    } catch {
      status.dataset.state = 'error';
      status.textContent = String(t.error).replace('{mail}', D.mail);
      next.disabled = false;
      next.textContent = t.submit;
    }
  }

  function showRun(c: { problem: string; tier: 'hot' | 'warm' | 'cold' }) {
    go(flow().length + 1);
    const problemLabel =
      flow()
        .find((q) => q.options.some((o) => o.id === c.problem))
        ?.options.find((o) => o.id === c.problem)?.label ?? '';
    const time = new Date().toLocaleTimeString(lang === 'cs' ? 'cs-CZ' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const rows: [string, string][] = [
      [t.run.received, time],
      [t.run.sorted, [D.names[service], problemLabel].filter(Boolean).join(' · ')],
      [t.run.priority, t.tier[c.tier] ?? ''],
      [t.run.routed, t.run.reply],
    ];
    log.replaceChildren();
    rows.forEach(([k, v], i) => {
      const li = document.createElement('li');
      li.append(document.createElement('i'), Object.assign(document.createElement('b'), { textContent: k }));
      li.append(Object.assign(document.createElement('span'), { textContent: v }));
      log.append(li);
      setTimeout(() => li.classList.add('is-in'), reduceMotion ? 0 : 200 + i * 450);
    });
  }

  if (preset) {
    service = preset;
    go(0);
    // a preset from the URL should not steal focus on load
    (document.activeElement as HTMLElement | null)?.blur();
  } else go(-1);
}
