/**
 * Measurement on the server side (the browser side is scripts/consent.ts and scripts/measure.ts). Nothing
 * is recorded for a visitor who has not allowed it: visitorId() returns '' unless the request carries
 * adv_consent=granted AND a well-formed adv_vid, and every caller stops on ''.
 *
 * recordEvent() keeps the event in SUBMISSIONS_DIR (events-YYYY-MM.jsonl) and queues it. The queue is sent
 * to the n8n intake in batches (kind "events", every 20 s or 50 events, lib/n8n.ts), which hands them to
 * the ADV dashboard (POST /api/v1/hooks/website-events) where they are stored and shown. Batching keeps
 * page views from starting one n8n run each. A batch that cannot be delivered is tried again with the next
 * one; the file on disk is the backstop. No IP address and no user agent are stored.
 */
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { forwardToN8n } from './n8n';

const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];

export function visitorId(request: Request): string {
  const jar: Record<string, string> = {};
  for (const part of (request.headers.get('cookie') ?? '').split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0) jar[part.slice(0, i)] = part.slice(i + 1);
  }
  return jar.adv_consent === 'granted' && /^[0-9a-f-]{36}$/i.test(jar.adv_vid ?? '') ? jar.adv_vid : '';
}

export const EVENTS = ['page_view', 'page_leave', 'click', 'form_start', 'form_step', 'form_submit'] as const;

export interface SiteEvent {
  event: (typeof EVENTS)[number];
  vid: string;
  page?: string;
  ref?: string;
  lang?: string;
  device?: string;
  utm?: string;
  /** click: the label of the link or button, and where it leads */
  target?: string;
  href?: string;
  /** page_leave: seconds the page was visible, deepest scroll in percent */
  seconds?: number;
  depth?: number;
  /** form_*: which form, service and step */
  form?: string;
  service?: string;
  step?: string;
  /** form_submit only: the e-mail the visitor sent, so their earlier events get a name */
  contact?: string;
}

const BATCH = 50;
const EVERY = 20_000;
const MAX_QUEUE = 2000;
let queue: (SiteEvent & { at: string })[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let sending = false;

async function flush(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  if (sending || !queue.length) return;
  sending = true;
  const batch = queue.splice(0, 200);
  const { routed, why } = await forwardToN8n({ kind: 'events', events: batch });
  // not configured (local preview): the file is all there is. Otherwise keep the batch for the next try.
  if (!routed && why !== 'no-url' && why !== 'no-key') queue = [...batch, ...queue].slice(0, MAX_QUEUE);
  sending = false;
  if (queue.length && routed) schedule(0);
  else if (queue.length) schedule(EVERY * 3);
}
function schedule(ms: number) {
  if (timer) return;
  timer = setTimeout(() => void flush(), ms);
  timer.unref?.(); // never keeps the server alive on its own
}

export async function recordEvent(e: SiteEvent): Promise<void> {
  // The dashboard rejects a whole batch for one over-long or odd value, so every event is cut to its
  // limits here, whoever called. `page` is always a path (the contact form passes its full referer).
  const cut = (v: string | undefined, max: number) => (v ?? '').trim().slice(0, max);
  let page = cut(e.page, 2000);
  try {
    if (/^https?:/i.test(page)) page = new URL(page).pathname;
  } catch {
    page = '';
  }
  const entry = {
    at: new Date().toISOString(),
    ...e,
    page: page.slice(0, 200),
    ref: cut(e.ref, 200),
    utm: cut(e.utm, 200),
    lang: e.lang === 'en' ? 'en' : 'cs',
    device: e.device === 'mobile' ? 'mobile' : 'desktop',
    ...(e.target !== undefined && { target: cut(e.target, 120) }),
    ...(e.href !== undefined && { href: cut(e.href, 200) }),
    ...(e.form !== undefined && { form: ['inquiry', 'contact', 'cta'].includes(e.form) ? e.form : 'contact' }),
    ...(e.service !== undefined && { service: cut(e.service, 60) }),
    ...(e.step !== undefined && { step: cut(e.step, 60) }),
    ...(e.contact !== undefined && { contact: cut(e.contact, 200) }),
  };
  const dir = env('SUBMISSIONS_DIR') || path.join(process.cwd(), 'data', 'submissions');
  try {
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, `events-${entry.at.slice(0, 7)}.jsonl`), JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('[event] store failed', err);
  }
  queue.push(entry);
  if (queue.length >= BATCH) void flush();
  else schedule(EVERY);
}
