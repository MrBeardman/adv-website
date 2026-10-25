/* Every URL on the site, per language. Czech at the root, English under /en/. Trailing slash always.
 *
 * Old URLs of the React site (for 301s at the domain switch, see docs/STATUS.md):
 *   /                      → /            (and /en/)
 *   /services/<slug>       → /sluzby/<cs-path>/   (EN: /en/services/<en-path>/)
 *                            e.g. /services/ai-automation → /sluzby/automatizace/ (EN /en/services/automation/)
 *   /work                  → /realizace/          (EN: /en/work/)
 *   /work/<slug>           → /realizace/<slug>/   (EN: /en/work/<slug>/)
 *   /v1, /projekt/<id>     → not carried over (legacy freelance site) */
import type { Lang } from '../i18n';
import { serviceBySlug } from './capabilities';

const base = (lang: Lang) => (lang === 'cs' ? '/' : '/en/');

export const routes = {
  home: (lang: Lang) => base(lang),
  services: (lang: Lang) => (lang === 'cs' ? '/sluzby/' : '/en/services/'),
  service: (lang: Lang, slug: string) => {
    const s = serviceBySlug(slug);
    return `${routes.services(lang)}${s ? s.path[lang] : slug}/`;
  },
  work: (lang: Lang) => (lang === 'cs' ? '/realizace/' : '/en/work/'),
  case: (lang: Lang, slug: string) => `${routes.work(lang)}${slug}/`,
  about: (lang: Lang) => (lang === 'cs' ? '/o-nas/' : '/en/about/'),
  contact: (lang: Lang) => (lang === 'cs' ? '/kontakt/' : '/en/contact/'),
};

/** Same page in both languages, for hreflang and the language switch. */
export const both = (fn: (lang: Lang) => string) => ({ cs: fn('cs'), en: fn('en') });
