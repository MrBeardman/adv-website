/* Structured data (schema.org JSON-LD) and the entity facts behind it, for search engines and AI
 * assistants (GEO). See docs/GEO.md for the research and the reasoning.
 *
 * One `@graph` per page (built in layouts/Base.astro): the company (ProfessionalService, @id "#org"),
 * the site (WebSite), and whatever the page adds through the `schema` prop: a Service, a FAQPage
 * (components/Faq.astro builds it from geo.json), a BreadcrumbList. Facts here must be checkable:
 * nothing goes into the graph that the page does not say in words too. */
import type { Lang } from '../i18n';
import { pick } from '../i18n';
import chrome from '../i18n/chrome.json';
import geo from '../i18n/geo.json';

/** Public profiles of the company (sameAs). TODO (Honza): add the live ones, e.g. the LinkedIn company
 *  page, GitHub, Firmy.cz, Google Business Profile, Clutch. Empty entries are skipped. */
export const SAME_AS: string[] = [];

export const POSTAL_CODE = '110 00';

/** The company node. `site` is Astro.site. */
export function orgSchema(lang: Lang, site: URL) {
  const t = pick(chrome, lang);
  const g = pick(geo, lang);
  return {
    '@type': 'ProfessionalService',
    '@id': new URL('/#org', site).href,
    name: 'ADV Innovations',
    url: site.href,
    logo: new URL('/icon-512.png', site).href,
    image: new URL('/icon-512.png', site).href,
    description: g.company.description,
    email: t.brand.email,
    telephone: t.brand.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: t.brand.street,
      addressLocality: t.brand.city,
      postalCode: POSTAL_CODE,
      addressCountry: 'CZ',
    },
    areaServed: [
      { '@type': 'Country', name: lang === 'cs' ? 'Česko' : 'Czech Republic' },
      { '@type': 'City', name: lang === 'cs' ? 'Praha' : 'Prague' },
      { '@type': 'Country', name: lang === 'cs' ? 'Německo' : 'Germany' },
    ],
    knowsLanguage: ['cs', 'en', 'de'],
    knowsAbout: g.company.knowsAbout,
    founder: { '@type': 'Person', name: 'Jan Matyáš' },
    ...(SAME_AS.filter(Boolean).length ? { sameAs: SAME_AS.filter(Boolean) } : {}),
  };
}

export function websiteSchema(lang: Lang, site: URL) {
  return {
    '@type': 'WebSite',
    '@id': new URL('/#website', site).href,
    name: 'ADV Innovations',
    url: site.href,
    inLanguage: lang === 'cs' ? 'cs-CZ' : 'en',
    publisher: { '@id': new URL('/#org', site).href },
  };
}

/** One service page. `path` is the page's path (per language). */
export function serviceSchema(
  lang: Lang,
  site: URL,
  s: { name: string; description: string; path: string; serviceType: string[] },
) {
  return {
    '@type': 'Service',
    '@id': new URL(`${s.path}#service`, site).href,
    name: s.name,
    serviceType: s.serviceType,
    description: s.description,
    url: new URL(s.path, site).href,
    inLanguage: lang === 'cs' ? 'cs-CZ' : 'en',
    provider: { '@id': new URL('/#org', site).href },
    areaServed: [
      { '@type': 'Country', name: lang === 'cs' ? 'Česko' : 'Czech Republic' },
      { '@type': 'Country', name: lang === 'cs' ? 'Německo' : 'Germany' },
    ],
    availableLanguage: ['cs', 'en', 'de'],
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function breadcrumbSchema(site: URL, crumbs: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(c.path, site).href,
    })),
  };
}

/** The search phrasings each service answers to (schema.org serviceType). From Google/Seznam
 *  autocomplete, Nov 2026 (docs/GEO.md). */
export const SERVICE_TYPES: Record<string, { cs: string[]; en: string[] }> = {
  'ai-automation': {
    cs: [
      'Automatizace firemních procesů',
      'AI automatizace pro firmy',
      'Zpracování faktur',
      'Napojení e-shopu na Pohodu',
      'AI asistent pro firmy',
    ],
    en: [
      'Business process automation',
      'AI automation for business',
      'Invoice processing',
      'E-shop to accounting integration',
      'AI assistants for business',
    ],
  },
  'business-optimisation': {
    cs: [
      'Optimalizace firemních procesů',
      'Interní systém pro firmu',
      'Firemní dashboard',
      'Reporting',
      'Propojení systémů',
    ],
    en: [
      'Business process optimisation',
      'Internal business system',
      'Business dashboard',
      'Reporting',
      'System integration',
    ],
  },
  websites: {
    cs: ['Tvorba webu', 'Tvorba e-shopu', 'Webové stránky pro firmy', 'Rezervační systém'],
    en: ['Website development', 'E-shop development', 'Business websites', 'Booking systems'],
  },
  software: {
    cs: [
      'Vývoj software na míru',
      'Vývoj webových aplikací',
      'Prototyp aplikace (MVP)',
      'CRM na míru',
      'Interní systém na míru',
    ],
    en: [
      'Custom software development',
      'Web application development',
      'Prototype (MVP) development',
      'Custom CRM',
      'Custom internal systems',
    ],
  },
};
