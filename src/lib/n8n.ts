/**
 * Forward a stored submission to the n8n intake workflow ("ADV Website - Inquiry Intake"), which keeps it in
 * the adv_inquiries table and posts it to the team's Telegram group. Used by api/inquiry.ts (kind
 * "inquiry") and api/contact.ts (kind "contact"). Short timeout: the visitor's answer never waits on n8n.
 *
 * Environment (Hostinger Node.js app settings, names in .env.example):
 *   N8N_INQUIRY_URL  the webhook's production URL. Not set = stored only.
 *   N8N_INQUIRY_KEY  shared secret, sent as the X-ADV-Key header (n8n Header Auth credential).
 * Both are trimmed: a pasted value with a trailing space or newline would otherwise fail the key check.
 *
 * `why` says what went wrong without revealing anything secret: "no-url", "no-key", "status-403" (n8n
 * refused the key), "status-404" (wrong URL or workflow not active), "unreachable" (network, timeout).
 */
const env = (k: string): string => (process.env[k] ?? import.meta.env[k] ?? '').trim();

export async function forwardToN8n(payload: Record<string, unknown>): Promise<{ routed: boolean; why: string }> {
  const url = env('N8N_INQUIRY_URL');
  const key = env('N8N_INQUIRY_KEY');
  if (!url) return { routed: false, why: 'no-url' };
  if (!key) return { routed: false, why: 'no-key' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-ADV-Key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error('[n8n] answered', res.status);
    return { routed: res.ok, why: res.ok ? 'ok' : `status-${res.status}` };
  } catch (e) {
    console.error('[n8n] unreachable', e);
    return { routed: false, why: 'unreachable' };
  }
}
