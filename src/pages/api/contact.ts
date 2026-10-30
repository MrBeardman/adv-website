/**
 * Contact endpoint (the only server route; every page is static). Pattern from jenomics-website:
 * no CAPTCHA, honeypot + in-memory rate limit + strict validation, and the enquiry is stored BEFORE any
 * mail is attempted, so a failed mail never loses a lead.
 *
 * Two forms post here: the short CTA panel (task + email, source=cta) and the contact page
 * (name, company, email, phone, service, message; source=contact).
 *
 * Environment (Hostinger Node.js app settings; names in .env.example, never commit values):
 *   SMTP_HOST        SMTP server. Not set = "SMTP-less mode": enquiries are stored, no mail is sent.
 *   SMTP_PORT        465 (implicit TLS, default) or 587 (STARTTLS)
 *   SMTP_USER/PASS   optional
 *   MAIL_FROM        sender address (default SMTP_USER)
 *   MAIL_FROM_NAME   sender name
 *   MAIL_TO          recipients, comma separated. TODO (Honza): the recipient address is still open.
 *   SUBMISSIONS_DIR  default ./data/submissions (outside the public folder, git-ignored)
 *   N8N_INQUIRY_URL / N8N_INQUIRY_KEY  the n8n intake (lib/n8n.ts): every stored message also goes there
 *                    (kind "contact"), which posts it to the team's Telegram group.
 */
import type { APIRoute } from 'astro';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import messages from '../../i18n/form.json';
import { ENABLED_SERVICES } from '../../data/capabilities';
import { forwardToN8n } from '../../lib/n8n';

export const prerender = false;

type Lang = 'cs' | 'en';
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
const hits = new Map<string, number[]>();
const LIMIT = 5; // per IP
const WINDOW = 10 * 60 * 1000; // 10 minutes

const msg = (key: keyof typeof messages, lang: Lang) => messages[key][lang] ?? messages[key].cs;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const field = (form: FormData, k: string, max: number) =>
  String(form.get(k) ?? '')
    .trim()
    .slice(0, max);

// Same rule as the browser (scripts/form.ts): loose shape, strict digit count, optional.
const phoneOk = (v: string) => {
  if (!v) return true;
  if (!/^\+?[\d][\d\s()./-]*$/.test(v)) return false;
  const d = v.replace(/\D/g, '').length;
  return d >= 9 && d <= 15;
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const form = await request.formData().catch(() => null);
  const lang: Lang = String(form?.get('lang')) === 'en' ? 'en' : 'cs';
  if (!form) return json({ ok: false, message: msg('form_invalid', lang) }, 400);

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (field(form, 'website_hp', 200) !== '') return json({ ok: true, message: msg('form_ok', lang) });

  let ip = 'unknown';
  try {
    ip = clientAddress || ip;
  } catch {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ip;
  }
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return json({ ok: false, message: msg('form_busy', lang) }, 429);
  recent.push(now);
  hits.set(ip, recent);

  const source = field(form, 'source', 20) === 'cta' ? 'cta' : 'contact';
  const email = field(form, 'email', 200);
  const name = field(form, 'name', 120);
  const company = field(form, 'company', 160);
  const phone = field(form, 'phone', 40);
  const serviceRaw = field(form, 'service', 60);
  const service = ENABLED_SERVICES.some((s) => s.slug === serviceRaw) ? serviceRaw : '';
  const message = field(form, 'message', 5000);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  // The CTA form is "task + email": the task is required there. The contact page needs only an email.
  if (!emailOk || !phoneOk(phone) || (source === 'cta' && message.length < 3)) {
    return json({ ok: false, message: msg('form_invalid', lang) }, 422);
  }

  const entry = {
    at: new Date().toISOString(),
    lang,
    source,
    name,
    company,
    email,
    phone,
    service,
    message,
    page: request.headers.get('referer') ?? '',
    // IP and user agent are deliberately not stored (data minimisation); the IP lives in memory for the rate limit only.
    mail: 'pending',
  };
  const dir = env('SUBMISSIONS_DIR') || path.join(process.cwd(), 'data', 'submissions');
  const file = path.join(dir, `${entry.at.slice(0, 7)}.jsonl`);
  try {
    await mkdir(dir, { recursive: true });
    await appendFile(file, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('[contact] store failed', e);
    return json({ ok: false, message: msg('form_error', lang) }, 500);
  }
  const note = (extra: Record<string, string>) =>
    appendFile(file, JSON.stringify({ at: entry.at, ...extra }) + '\n').catch(() => {});

  // to n8n → Telegram, before any mail (lib/n8n.ts, short timeout)
  const { why } = await forwardToN8n({ ...entry, kind: 'contact' });
  await note({ n8n: why });

  const host = env('SMTP_HOST');
  if (!host) {
    // SMTP-less mode (local, or before the mailbox exists): the enquiry is stored and that is all.
    console.log('[contact] stored, SMTP_HOST not set: no mail sent');
    await note({ mail: 'skipped (no SMTP_HOST)' });
    return json({ ok: true, message: msg('form_ok', lang) });
  }

  // Send in the background: the visitor gets the answer at once (the enquiry is already stored), so a slow
  // SMTP server never leaves the form hanging. Short timeouts; the result goes to the log and the file.
  const port = Number(env('SMTP_PORT') || 465);
  const user = env('SMTP_USER');
  const fromAddr = env('MAIL_FROM') || user || '';
  const to = env('MAIL_TO') || fromAddr; // TODO (Honza): set MAIL_TO to the enquiries inbox
  const started = Date.now();
  const lines = [
    `Formulář: ${source === 'cta' ? 'krátký (úkol + e-mail)' : 'kontaktní stránka'}`,
    `Jméno: ${name || '-'}`,
    `Firma: ${company || '-'}`,
    `E-mail: ${email}`,
    `Telefon: ${phone || '-'}`,
    `Služba: ${service || '-'}`,
    `Jazyk: ${lang}`,
    `Stránka: ${entry.page}`,
    '',
    message || '(bez zprávy)',
  ];
  nodemailer
    .createTransport({
      host,
      port,
      secure: port === 465,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      ...(user ? { auth: { user, pass: env('SMTP_PASS') } } : {}),
    })
    .sendMail({
      from: env('MAIL_FROM_NAME') ? { name: env('MAIL_FROM_NAME')!, address: fromAddr } : fromAddr,
      to,
      replyTo: email,
      subject: `Nová poptávka z webu ADV (${lang.toUpperCase()}, ${source})`,
      text: lines.join('\n') + '\n',
    })
    .then((info) => {
      console.log(`[contact] mail sent via ${host}:${port} in ${Date.now() - started} ms`, info.response);
      return note({ mail: 'sent' });
    })
    .catch((e) => {
      console.error(`[contact] mail failed via ${host}:${port} after ${Date.now() - started} ms:`, e?.code, e?.message);
      return note({ mail: 'failed', error: `${e?.code ?? ''} ${e?.message ?? ''}`.trim() });
    });

  return json({ ok: true, message: msg('form_ok', lang) });
};
