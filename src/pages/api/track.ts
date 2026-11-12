/**
 * Measurement endpoint (scripts/consent.ts track()): a visitor started a form, or reached a step of the
 * inquiry. Consent is checked here again (lib/visitor.ts): without the consent cookie and the visitor id
 * the request is answered 204 and nothing is stored. Only known events, forms and short strings get
 * through; no IP address is stored (it lives in memory for the rate limit only).
 */
import type { APIRoute } from 'astro';
import { visitorId, recordEvent } from '../../lib/visitor';

export const prerender = false;

const EVENTS = ['form_start', 'form_step'] as const;
const FORMS = ['inquiry', 'contact', 'cta'];
const hits = new Map<string, number[]>();
const LIMIT = 60;
const WINDOW = 10 * 60 * 1000;
const str = (v: unknown, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
const nothing = () => new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const vid = visitorId(request);
  if (!vid) return nothing();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const event = EVENTS.find((e) => e === body?.event);
  const form = str(body?.form, 20);
  if (!body || !event || !FORMS.includes(form)) return nothing();

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
    form,
    vid,
    service: str(body.service, 60),
    step: str(body.step, 60),
    page: str(body.page, 200),
    ref: str(body.ref, 200),
    lang: body.lang === 'en' ? 'en' : 'cs',
    device: body.device === 'mobile' ? 'mobile' : 'desktop',
    utm: str(body.utm, 200),
  });
  return nothing();
};
