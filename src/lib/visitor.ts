/**
 * Measurement on the server side (the browser side is scripts/consent.ts). Nothing is recorded for a
 * visitor who has not allowed it: visitorId() returns '' unless the request carries adv_consent=granted
 * AND a well-formed adv_vid, and every caller stops on ''.
 *
 * recordEvent() keeps the event in SUBMISSIONS_DIR (events-YYYY-MM.jsonl) and forwards it to the n8n
 * intake as kind "event" (lib/n8n.ts), where it lands in the adv_form_events table, never in Telegram.
 * No IP address and no user agent are stored.
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

export interface FormEvent {
  event: 'form_start' | 'form_step' | 'form_submit';
  form: string;
  vid: string;
  service?: string;
  step?: string;
  page?: string;
  ref?: string;
  lang?: string;
  device?: string;
  utm?: string;
  /** form_submit only: the e-mail the visitor sent, so earlier events of the same id get a name */
  contact?: string;
}

export async function recordEvent(e: FormEvent): Promise<void> {
  const entry = { at: new Date().toISOString(), kind: 'event', ...e };
  const dir = env('SUBMISSIONS_DIR') || path.join(process.cwd(), 'data', 'submissions');
  try {
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, `events-${entry.at.slice(0, 7)}.jsonl`), JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('[event] store failed', err);
  }
  await forwardToN8n(entry);
}
