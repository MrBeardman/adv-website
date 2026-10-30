/**
 * Inquiry endpoint for the per-service flows (components/inquiry/Inquiry.astro). Same rules as
 * api/contact.ts: honeypot, in-memory rate limit, strict validation, and the inquiry is stored BEFORE it
 * is forwarded anywhere, so nothing is lost if n8n is down.
 *
 * The answers are sorted here (data/inquiry.ts classify(): problem, size, urgency, budget, priority, tier)
 * and the result goes back to the visitor's "run" and, with the raw answers and their labels, to the n8n
 * workflow that stores and routes it.
 *
 * Environment (Hostinger Node.js app settings; names in .env.example):
 *   N8N_INQUIRY_URL  the n8n webhook (production URL). Not set = stored only.
 *   N8N_INQUIRY_KEY  shared secret, sent as the X-ADV-Key header (n8n Header Auth credential).
 *   SUBMISSIONS_DIR  default ./data/submissions (git-ignored)
 */
import type { APIRoute } from 'astro';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { FLOWS, classify } from '../../data/inquiry';
import { ENABLED_SERVICES } from '../../data/capabilities';
import { loc } from '../../i18n';
import { forwardToN8n } from '../../lib/n8n';

export const prerender = false;

type Lang = 'cs' | 'en';
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
const hits = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW = 10 * 60 * 1000;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const str = (v: unknown, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
const phoneOk = (v: string) => {
  if (!v) return true;
  if (!/^\+?[\d][\d\s()./-]*$/.test(v)) return false;
  const d = v.replace(/\D/g, '').length;
  return d >= 9 && d <= 15;
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const lang: Lang = body?.lang === 'en' ? 'en' : 'cs';
  if (!body) return json({ ok: false }, 400);
  if (str(body.website_hp, 200) !== '') return json({ ok: true, classified: classify('', {}) });

  let ip = 'unknown';
  try {
    ip = clientAddress || ip;
  } catch {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ip;
  }
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return json({ ok: false }, 429);
  recent.push(now);
  hits.set(ip, recent);

  const service = str(body.service, 60);
  const flow = FLOWS[service];
  if (!flow || !ENABLED_SERVICES.some((s) => s.slug === service)) return json({ ok: false }, 422);
  const email = str(body.email, 200);
  const phone = str(body.phone, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !phoneOk(phone)) return json({ ok: false }, 422);

  // keep only known questions and option ids
  const inAnswers = (typeof body.answers === 'object' && body.answers) || {};
  const answers: Record<string, string | string[]> = {};
  const readable: Record<string, string> = {};
  for (const q of flow) {
    const a = (inAnswers as Record<string, unknown>)[q.id];
    const ids = new Set((q.options ?? []).map((o) => o.id));
    const label = (id: string) => loc(q.options?.find((o) => o.id === id)?.label, 'cs');
    if (q.kind === 'text' && typeof a === 'string' && a.trim()) {
      answers[q.id] = str(a, 3000);
      readable[loc(q.title, 'cs')] = answers[q.id] as string;
    } else if (q.kind === 'one' && typeof a === 'string' && ids.has(a)) {
      answers[q.id] = a;
      readable[loc(q.title, 'cs')] = label(a);
    } else if (q.kind === 'many' && Array.isArray(a)) {
      const v = a.filter((x): x is string => typeof x === 'string' && ids.has(x)).slice(0, 20);
      if (v.length) {
        answers[q.id] = v;
        readable[loc(q.title, 'cs')] = v.map(label).join(', ');
      }
    }
  }
  const classified = classify(service, answers);

  const entry = {
    at: new Date().toISOString(),
    lang,
    kind: 'inquiry',
    service,
    classified,
    answers,
    readable,
    name: str(body.name, 120),
    company: str(body.company, 160),
    email,
    phone,
    page: str(body.page, 200),
  };
  const dir = env('SUBMISSIONS_DIR') || path.join(process.cwd(), 'data', 'submissions');
  const file = path.join(dir, `inquiries-${entry.at.slice(0, 7)}.jsonl`);
  try {
    await mkdir(dir, { recursive: true });
    await appendFile(file, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('[inquiry] store failed', e);
    return json({ ok: false }, 500);
  }

  // forward to n8n (lib/n8n.ts: short timeout, the visitor's answer never waits on a slow workflow)
  const { routed, why } = await forwardToN8n(entry);
  await appendFile(file, JSON.stringify({ at: entry.at, n8n: why }) + '\n').catch(() => {});
  return json({ ok: true, classified, routed, why });
};
