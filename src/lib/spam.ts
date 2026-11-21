/**
 * Spam check for the contact form and the inquiry guide (api/contact.ts, api/inquiry.ts), behind the honeypot.
 * No CAPTCHA and nothing is thrown away: a message that scores as spam is still stored (data/submissions and
 * the n8n table, tier "spam"), it just does not reach Telegram or the ADV dashboard. If a real one is ever
 * caught, it is in the adv_inquiries table.
 *
 * Signals (Nov 21 2026, after a bot sent "Gfihudwgfyehjwowjifwhu fuehiqokew… advinnovations.com"):
 *   gibberish   keyboard mash: a run of 22+ ASCII letters, or 12+ with a q not followed by u or three w's
 *               ("internationalization" is 20; Czech words break at diacritics); URLs and emails excluded      3
 *   too fast    sent less than 3 s after the page loaded (`_t`, set by the page script)                      3
 *   no script   `_t` missing: posted without the page (bots post straight to the endpoint; a person with
 *               JavaScript off is rare, so this alone is not enough)                                          1
 *   own domain  the message names advinnovations.com (probing bots paste the site's address)                    1
 *   digit mail  the email's local part ends in 6+ digits (alan-baker424245242@…)                                1
 * Spam at 3 points.
 */
const mash = (w: string) => {
  const l = w.toLowerCase();
  return l.length >= 22 || (l.length >= 12 && (/q(?!u)/.test(l) || (l.match(/w/g) ?? []).length >= 3));
};

export interface SpamInput {
  /** free text the visitor typed (message, task, own-words answers, name, company) */
  texts: string[];
  email: string;
  /** seconds from page load to send, as the page script reported it; undefined = not sent */
  t?: string | null;
}

export function spamCheck(i: SpamInput): { spam: boolean; score: number; why: string[] } {
  const why: string[] = [];
  let score = 0;
  const add = (pts: number, reason: string) => {
    score += pts;
    why.push(reason);
  };
  const text = i.texts.join(' ');
  const words = text
    .replace(/https?:\/\/\S+|www\.\S+|\S+@\S+/gi, ' ')
    .split(/[^A-Za-z]+/)
    .filter(Boolean);
  if (words.some(mash)) add(3, 'gibberish');
  const t = i.t == null || i.t === '' ? NaN : Number(i.t);
  if (Number.isNaN(t)) add(1, 'no-script');
  else if (t < 3) add(3, 'too-fast');
  if (/advinnovations\.(com|cz)/i.test(text)) add(1, 'own-domain');
  if (/\d{6,}@/.test(i.email)) add(1, 'digit-mail');
  return { spam: score >= 3, score, why };
}
