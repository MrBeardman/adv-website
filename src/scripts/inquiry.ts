/**
 * The per-service inquiry (components/inquiry/Inquiry.astro): a small state machine.
 *   pick a service → its questions one at a time → contact → POST /api/inquiry → the run log.
 * One-choice questions advance on click; many-choice and text questions use Next; optional ones can be
 * skipped. The rail on the left builds up as the visitor goes: each answered step with its answer, then the
 * current one (nothing ahead of it). Focus moves to each new question.
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

  // the rail: what has been answered so far (with the answer) and the step now; new rows rise in
  function renderRail() {
    const before = rail.children.length;
    const qs = flow();
    const n = qs.length;
    const rows: { label: string; note?: string; now?: boolean }[] = [];
    if (step < 0) rows.push({ label: t.pick, now: true });
    else {
      rows.push({ label: D.names[service] });
      qs.slice(0, Math.min(step, n)).forEach((q) => rows.push({ label: q.title, note: summary(q) }));
      if (step < n) rows.push({ label: qs[step].title, now: true });
      else rows.push({ label: t.contactStep, now: step === n });
    }
    rail.replaceChildren(
      ...rows.map((r, k) => {
        const li = document.createElement('li');
        li.append(Object.assign(document.createElement('span'), { textContent: r.label }));
        if (r.note) li.append(Object.assign(document.createElement('small'), { textContent: r.note }));
        li.classList.add(r.now ? 'is-now' : 'is-done');
        if (r.now) li.setAttribute('aria-current', 'step');
        if (k >= before && !reduceMotion) li.classList.add('is-new');
        return li;
      }),
    );
    // keep the newest row in view; the line runs the length of the rows
    const last = rail.lastElementChild as HTMLElement | null;
    rail.style.setProperty('--rail-h', last ? `${last.offsetTop + last.offsetHeight}px` : '0px');
    rail.classList.toggle('is-full', rail.scrollHeight > rail.clientHeight + 1);
    rail.scrollTo({ top: rail.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function summary(q: Q) {
    const a = answers[q.id];
    if (!a || (Array.isArray(a) && !a.length)) return t.skipped ?? '—';
    if (q.kind === 'text') return String(a).trim().slice(0, 48) + (String(a).trim().length > 48 ? '…' : '');
    const ids = Array.isArray(a) ? a : [a];
    return ids.map((id) => q.options.find((o) => o.id === id)?.label ?? id).join(', ');
  }

  function focusQ(el: HTMLElement) {
    const q = el.querySelector<HTMLElement>('.adv-inq__q');
    if (!q) return;
    q.tabIndex = -1;
    q.focus({ preventScroll: true });
  }

  function renderQuestion(q: Q) {
    qEl.replaceChildren(buildQuestion(q, service));
  }

  function buildQuestion(q: Q, svc: string) {
    const fs = document.createElement('fieldset');
    fs.className = 'adv-inq__step';
    fs.style.display = 'grid';
    const meta = document.createElement('p');
    meta.className = 'adv-inq__meta';
    const chosen = document.createElement('span');
    chosen.className = 'adv-inq__chosen';
    chosen.textContent = D.names[svc];
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
      grid.dataset.kind = q.kind;
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
    return fs;
  }

  // ---- no jumping: the panel is as tall as the tallest step of any service, measured off screen at the
  // current width, again whenever the width changes. The rail grows beside it, never past it.
  const panel = $('[data-inq-panel]');
  function measure() {
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;inset:0 0 auto 0;visibility:hidden;pointer-events:none';
    panel.append(probe);
    const tallest = (els: HTMLElement[]) =>
      els.reduce((m, el) => {
        probe.replaceChildren(el);
        return Math.max(m, el.offsetHeight);
      }, 0);
    const copies = [pickEl, contact, runEl].map((el) => {
      const c = el.cloneNode(true) as HTMLElement;
      c.hidden = false;
      c.removeAttribute('data-inq-pick');
      c.removeAttribute('data-inq-contact');
      c.removeAttribute('data-inq-run');
      c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      return c;
    });
    // the run with its four rows
    const runCopy = copies[2];
    const ol = runCopy.querySelector('ol');
    if (ol)
      for (let i = 0; i < 4; i++)
        ol.append(Object.assign(document.createElement('li'), { innerHTML: '<i></i><b>—</b><span>—</span>' }));
    const questions = Object.keys(D.flows).flatMap((svc) => D.flows[svc].map((q) => buildQuestion(q, svc)));
    const h = tallest([...copies, ...questions]);
    probe.remove();
    panel.style.setProperty('--inq-h', `${Math.ceil(h)}px`);

  }
  let lastW = 0;
  new ResizeObserver(() => {
    if (panel.clientWidth === lastW) return;
    lastW = panel.clientWidth;
    measure();
  }).observe(panel);
  document.fonts?.ready.then(measure);

  function sync() {
    const n = flow().length;
    nav.classList.toggle('is-off', step < 0 || step > n);
    back.style.visibility = step < 0 ? 'hidden' : '';
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

  // cross-fade: the current step fades out (with a slight lift), the next one fades in (with a slight
  // rise); the panel keeps its height throughout, so nothing around it moves.
  let busy: Promise<void> = Promise.resolve();
  function go(to: number) {
    busy = busy.then(() => swap(to));
  }
  async function swap(to: number) {
    const cur = [pickEl, qEl, contact, runEl].find((el) => !el.hidden);
    if (cur && !reduceMotion) {
      await cur.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-6px)' },
        ],
        { duration: 160, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      ).finished;
      cur.getAnimations().forEach((a) => a.cancel());
    }
    show(to);
    const next = [pickEl, qEl, contact, runEl].find((el) => !el.hidden);
    if (next && !reduceMotion)
      next.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
  }
  function show(to: number) {
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
    show(0);
    // a preset from the URL should not steal focus on load
    (document.activeElement as HTMLElement | null)?.blur();
  } else show(-1);
}
