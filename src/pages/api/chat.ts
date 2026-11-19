/**
 * The inquiry chat's endpoint (components/chat/Chat.astro, data/chat.ts). One route, four actions:
 *
 *   lead   the scripted answers + contact. Stored and forwarded to n8n as an ordinary inquiry right away
 *          (kind "inquiry", source "chat"), so a visitor who leaves later is still a lead.
 *   ask    the next AI follow-up question (lib/chatAgent.ts). The server keeps the session and counts the
 *          turns; `done: true` means the AI part is over.
 *   slots  free meeting slots (lib/slots.ts).
 *   book   a meeting request for one slot. Stored as pending and forwarded (kind "booking") with the AI brief
 *          and the follow-up answers; the team confirms it. If the visitor never books, the brief and
 *          answers are forwarded on their own (kind "chat") a while after the AI part ends.
 *
 * Same rules as api/inquiry.ts: honeypot, per-IP rate limits, strict validation, store before forward.
 * Sessions live in memory (a restart only costs the AI part; booking still works from the stored lead).
 */
import type { APIRoute } from 'astro';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { classify } from '../../data/inquiry';
import { CHAT_FLOWS, AI_TURNS, SLOTS } from '../../data/chat';
import { ENABLED_SERVICES } from '../../data/capabilities';
import { loc } from '../../i18n';
import { forwardToN8n } from '../../lib/n8n';
import { visitorId, recordEvent } from '../../lib/visitor';
import { askAgent, aiEnabled, type Turn } from '../../lib/chatAgent';
import { freeSlots, isFree, saveBooking, slotEnd } from '../../lib/slots';

export const prerender = false;

type Lang = 'cs' | 'en';
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const str = (v: unknown, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const phoneOk = (v: string) => {
  if (!v) return true;
  if (!/^\+?[\d][\d\s()./-]*$/.test(v)) return false;
  const d = v.replace(/\D/g, '').length;
  return d >= 9 && d <= 15;
};

// ---- rate limits per IP and action -------------------------------------------------------------------
const LIMITS: Record<string, number> = { lead: 5, ask: 15, slots: 40, book: 5 };
const WINDOW = 10 * 60 * 1000;
const hits = new Map<string, number[]>();
function limited(ip: string, action: string) {
  const key = `${action}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= (LIMITS[action] ?? 10)) return true;
  recent.push(now);
  hits.set(key, recent);
  return false;
}

// ---- sessions ----------------------------------------------------------------------------------------
interface Session {
  sid: string;
  created: number;
  lang: Lang;
  service: string;
  readable: Record<string, string>;
  classified: ReturnType<typeof classify>;
  contact: { name: string; company: string; email: string; phone: string };
  page: string;
  turns: Turn[];
  offTopic: number;
  done: boolean;
  brief: string;
  booked: boolean;
  reported: boolean;
}
const sessions = new Map<string, Session>();
const TTL = 3 * 60 * 60 * 1000;
function sweep() {
  const now = Date.now();
  for (const [k, s] of sessions) if (now - s.created > TTL) sessions.delete(k);
  while (sessions.size > 3000) sessions.delete(sessions.keys().next().value!);
}

const dir = () => env('SUBMISSIONS_DIR') || path.join(process.cwd(), 'data', 'submissions');
async function store(file: string, entry: unknown) {
  await mkdir(dir(), { recursive: true });
  await appendFile(path.join(dir(), file), JSON.stringify(entry) + '\n');
}
const month = () => new Date().toISOString().slice(0, 7);
const followUps = (s: Session) =>
  s.turns.filter((t) => t.answer !== undefined).map((t) => ({ type: t.type, q: t.question, a: t.answer! }));
const pragueTime = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(lang === 'cs' ? 'cs-CZ' : 'en-GB', {
    timeZone: SLOTS.zone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

/** The AI brief and answers for a visitor who did not book (sent once, a while after the AI part). */
async function report(s: Session) {
  if (s.reported || s.booked) return;
  s.reported = true;
  const entry = {
    kind: 'chat',
    at: new Date().toISOString(),
    sid: s.sid,
    lang: s.lang,
    service: s.service,
    name: s.contact.name,
    company: s.contact.company,
    email: s.contact.email,
    phone: s.contact.phone,
    brief: s.brief,
    followUps: followUps(s),
    booked: false,
  };
  await store(`chats-${month()}.jsonl`, entry).catch((e) => console.error('[chat] store failed', e));
  await forwardToN8n(entry);
}
function finish(s: Session, brief?: string) {
  s.done = true;
  if (brief) s.brief = brief;
  const t = setTimeout(() => void report(s), 15 * 60 * 1000);
  t.unref?.();
}

// ---- actions -----------------------------------------------------------------------------------------
async function lead(body: Record<string, unknown>, lang: Lang, request: Request) {
  const service = str(body.service, 60);
  const flow = CHAT_FLOWS[service];
  if (!flow || !ENABLED_SERVICES.some((s) => s.slug === service)) return json({ ok: false }, 422);
  const email = str(body.email, 200);
  const phone = str(body.phone, 40);
  const name = str(body.name, 120);
  if (!emailOk(email) || !phoneOk(phone) || !name) return json({ ok: false }, 422);

  // keep only known questions and option ids; a free-text reply to a choice question is kept as text
  const inAnswers = (typeof body.answers === 'object' && body.answers) || {};
  const answers: Record<string, string | string[]> = {};
  const readable: Record<string, string> = {};
  for (const q of flow) {
    const a = (inAnswers as Record<string, unknown>)[q.id];
    const ids = new Set((q.options ?? []).map((o) => o.id));
    const label = (id: string) => loc(q.options?.find((o) => o.id === id)?.label, 'cs');
    const title = loc(q.title, 'cs');
    if (typeof a === 'string' && q.kind === 'one' && ids.has(a)) {
      answers[q.id] = a;
      readable[title] = label(a);
    } else if (Array.isArray(a) && q.kind === 'many') {
      const v = a.filter((x): x is string => typeof x === 'string' && ids.has(x)).slice(0, 20);
      if (v.length) {
        answers[q.id] = v;
        readable[title] = v.map(label).join(', ');
      }
    } else if (typeof a === 'string' && a.trim()) {
      answers[q.id] = str(a, 3000);
      readable[title] = answers[q.id] as string;
    }
  }
  const classified = classify(service, answers);
  const sid = randomUUID();
  const entry = {
    at: new Date().toISOString(),
    lang,
    kind: 'inquiry',
    source: 'chat',
    sid,
    service,
    classified,
    answers,
    readable,
    name,
    company: str(body.company, 160),
    email,
    phone,
    page: str(body.page, 200),
  };
  const file = `inquiries-${entry.at.slice(0, 7)}.jsonl`;
  try {
    await store(file, entry);
  } catch (e) {
    console.error('[chat] store failed', e);
    return json({ ok: false }, 500);
  }
  const { routed, why } = await forwardToN8n(entry);
  await store(file, { at: entry.at, n8n: why }).catch(() => {});

  sweep();
  sessions.set(sid, {
    sid,
    created: Date.now(),
    lang,
    service,
    readable,
    classified,
    contact: { name, company: entry.company, email, phone },
    page: entry.page,
    turns: [],
    offTopic: 0,
    done: !aiEnabled(),
    brief: '',
    booked: false,
    reported: !aiEnabled(),
  });
  const vid = visitorId(request);
  if (vid)
    void recordEvent({ event: 'form_submit', form: 'chat', vid, service, page: entry.page, lang, contact: email });
  return json({ ok: true, sid, ai: aiEnabled(), routed });
}

async function ask(body: Record<string, unknown>) {
  const s = sessions.get(str(body.sid, 60));
  if (!s || s.done) return json({ ok: true, done: true });
  const open = s.turns.find((t) => t.answer === undefined);
  if (open) {
    const answer = str(body.answer, 1000);
    if (!answer) return json({ ok: false }, 422);
    open.answer = answer;
  }
  const answered = s.turns.filter((t) => t.answer !== undefined).length;
  const final = answered >= AI_TURNS;
  const out = await askAgent({
    lang: s.lang,
    service: s.service,
    answers: s.readable,
    company: s.contact.company,
    turns: s.turns,
    final,
  });
  if (!out) {
    finish(s);
    return json({ ok: true, done: true });
  }
  if (open) {
    open.onTopic = out.onTopic;
    if (!out.onTopic) s.offTopic++;
  }
  if (final || out.enough || s.offTopic >= 2) {
    finish(s, out.brief);
    return json({ ok: true, done: true, offTopic: s.offTopic >= 2 });
  }
  s.brief = out.brief;
  s.turns.push({ type: out.type, question: out.question });
  return json({
    ok: true,
    done: false,
    question: out.question,
    suggestions: out.suggestions,
    turn: s.turns.length,
    of: AI_TURNS,
    offTopic: !out.onTopic,
  });
}

async function book(body: Record<string, unknown>, lang: Lang) {
  const start = str(body.start, 40);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(start)) return json({ ok: false }, 422);
  const s = sessions.get(str(body.sid, 60));
  // after a restart the session is gone: the visitor's contact comes with the request
  const contact = s?.contact ?? {
    name: str(body.name, 120),
    company: str(body.company, 160),
    email: str(body.email, 200),
    phone: str(body.phone, 40),
  };
  if (!emailOk(contact.email)) return json({ ok: false }, 422);
  if (s?.booked) return json({ ok: false, reason: 'booked' }, 409);
  if (!(await isFree(start))) return json({ ok: false, reason: 'taken' }, 409);

  const booking = {
    id: randomUUID(),
    sid: s?.sid ?? str(body.sid, 60),
    at: new Date().toISOString(),
    start,
    end: slotEnd(start),
    status: 'pending' as const,
    name: contact.name,
    email: contact.email,
  };
  try {
    await saveBooking(booking);
  } catch (e) {
    console.error('[chat] booking store failed', e);
    return json({ ok: false }, 500);
  }
  if (s) {
    s.booked = true;
    if (!s.done) finish(s);
  }
  const entry = {
    kind: 'booking',
    at: booking.at,
    bookingId: booking.id,
    sid: booking.sid,
    lang: s?.lang ?? lang,
    start,
    end: booking.end,
    when: pragueTime(start, 'cs'),
    meeting: 'video',
    name: contact.name,
    company: contact.company,
    email: contact.email,
    phone: contact.phone,
    service: s?.service ?? '',
    tier: s?.classified.tier ?? '',
    brief: s?.brief ?? '',
    followUps: s ? followUps(s) : [],
    readable: s?.readable ?? {},
  };
  await store(`chats-${month()}.jsonl`, entry).catch(() => {});
  const { routed } = await forwardToN8n(entry);
  return json({ ok: true, start, when: pragueTime(start, s?.lang ?? lang), routed });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false }, 400);
  const lang: Lang = body.lang === 'en' ? 'en' : 'cs';
  const action = str(body.action, 10);
  if (str(body.website_hp, 200) !== '') return json({ ok: true, sid: '', ai: false });

  let ip = 'unknown';
  try {
    ip = clientAddress || ip;
  } catch {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ip;
  }
  if (!(action in LIMITS)) return json({ ok: false }, 400);
  if (limited(ip, action)) return json({ ok: false, reason: 'limit' }, 429);

  if (action === 'lead') return lead(body, lang, request);
  if (action === 'ask') return ask(body);
  if (action === 'slots') return json({ ok: true, zone: SLOTS.zone, length: SLOTS.length, days: await freeSlots() });
  return book(body, lang);
};
