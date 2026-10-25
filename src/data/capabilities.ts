/* The services. `enabled` is the ONE switch for which services a visitor sees: navigation, the services
 * overview, service pages, work filters, the contact dropdown, case-study meta and the sitemap all read it.
 *
 * Graphic design is hidden "for now" (Honza, Oct 2026). Its copy stays in i18n/services.json; flip
 * `enabled` to true to bring it back (its page then builds at /sluzby/graficky-design/).
 *
 * `slug` is the internal key (matches the copy in services.json and caseStudies.ts); `path` is the URL
 * segment per language. */
export const SERVICES = [
  // `rich`: the service has its own authored page (templates/Automation.astro, the Relay-style page) instead
  // of the generic service template. Its route files are src/pages/sluzby/automatizace.astro + EN.
  {
    slug: 'ai-automation',
    path: { cs: 'automatizace', en: 'automation' },
    icon: 'nodes',
    enabled: true,
    rich: true,
    nav: { cs: 'Automatizace a AI', en: 'Automation & AI' },
  },
  {
    slug: 'business-optimisation',
    path: { cs: 'optimalizace-firmy', en: 'business-optimisation' },
    icon: 'racks',
    enabled: true,
  },
  { slug: 'websites', path: { cs: 'weby', en: 'websites' }, icon: 'globe', enabled: true },
  {
    slug: 'software',
    path: { cs: 'prototypy-a-software', en: 'prototypes-and-software' },
    icon: 'diamond',
    enabled: true,
  },
  { slug: 'graphic-design', path: { cs: 'graficky-design', en: 'graphic-design' }, icon: 'shapes', enabled: false },
] as const;

export type ServiceSlug = (typeof SERVICES)[number]['slug'];
export const ENABLED_SERVICES = SERVICES.filter((s) => s.enabled);
export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
/** Services with their own authored page (not the generic template). */
export const isRich = (slug: string) => {
  const s = serviceBySlug(slug);
  return !!s && 'rich' in s && s.rich === true;
};
/** Generic service pages to build: enabled and not rich. */
export const GENERIC_SERVICES = ENABLED_SERVICES.filter((s) => !isRich(s.slug));
