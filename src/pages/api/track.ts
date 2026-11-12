/**
 * Measurement endpoint (scripts/consent.ts track()): a page was viewed or left, something was clicked, a
 * form was started or a step of the inquiry reached. Consent is checked here again (lib/visitor.ts):
 * without the consent cookie and the visitor id the request is answered 204 and nothing is stored. Only
 * known events and short strings get through; no IP address is stored (it lives in memory for the rate
 * limit only). form_submit is never accepted from the browser: the form endpoints record it themselves.
 */
import type { APIRoute } from 'astro';
import { visitorId, recordEvent } from '../../lib/visitor';

export const prerender = false;

const EVENTS = ['page_view', 'page_leave', 'click', 'form_start', 'form_step'] as const;
const FORMS = ['inquiry', 'contact', 'cta'];
const hits = new Map<string, number[]>();
const LIMIT = 300;
const WINDOW = 10 * 60 * 1000;
const str = (v: unknown, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
const num = (v: unknown, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
};
const nothing = () => new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const vid = visitorId(request);
  if (!vid) return nothing();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const event = EVENTS.find((e) => e === body?.event);
  if (!body || !event) return nothing();
  const isForm = event === 'form_start' || event === 'form_step';
  const form = str(body.form, 20);
  if (isForm && !FORMS.includes(form)) return nothing();

  let ip = 'unknown';
  try {
    ip = clientAddress || ip;
  } catch {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ip;
  }
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return nothing();
  recent.push(now);
  hits.set(ip, recent);

  await recordEvent({
    event,
    vid,
    page: str(body.page, 200),
    ref: str(body.ref, 200),
    lang: body.lang === 'en' ? 'en' : 'cs',
    device: body.device === 'mobile' ? 'mobile' : 'desktop',
    utm: str(body.utm, 200),
    ...(event === 'click' && { target: str(body.target, 120), href: str(body.href, 200) }),
    ...(event === 'page_leave' && { seconds: num(body.seconds, 86400), depth: num(body.depth, 100) }),
    ...(isForm && { form, service: str(body.service, 60), step: str(body.step, 60) }),
  });
  return nothing();
};
