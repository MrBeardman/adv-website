/** Languages of the site. ADV is a Czech company: Czech is the default and lives at the root, English under /en/. */
export const LANGS = [
  { code: 'cs', locale: 'cs-CZ', og: 'cs_CZ', name: 'Čeština', short: 'CS' },
  { code: 'en', locale: 'en-US', og: 'en_US', name: 'English', short: 'EN' },
] as const;

export type Lang = (typeof LANGS)[number]['code'];
export type Localized = { cs?: string; en: string } | { cs: string; en?: string };

export function langInfo(lang: Lang) {
  return LANGS.find((l) => l.code === lang)!;
}

/**
 * The texts of one dictionary file ({ cs: {...}, en: {...} }) for one language.
 * Missing top-level keys fall back to Czech, so a new text shows in Czech until it is translated.
 */
export function pick<T>(data: Record<string, T>, lang: Lang): T {
  return { ...(data.cs as object), ...((data[lang] as object) ?? {}) } as T;
}

/** A { cs, en } field in data files (case studies, numbers): the language, else English, else Czech. */
export function loc(field: Localized | string | null | undefined, lang: Lang): string {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  const f = field as Record<string, string | undefined>;
  return f[lang] ?? f.en ?? f.cs ?? '';
}

/** Replaces {{name}} placeholders (the portfolio copy uses i18next syntax). */
export function fill(text: string, values: Record<string, string | number> = {}) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(values[k] ?? ''));
}

/** Number formatting per language: 340 000 in Czech, 340,000 in English. */
export function num(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB').format(n);
}
