/* Delivery partners. Code-side facts only (logo, link); the words live in i18n/about.json
 * (partners.items, matched by `id`). Ported from PersonalPortfolio src/data/partners.js.
 *
 * Rule for this list: only what can be checked. Jenomics' facts and URL come from its own site
 * (founded 2001, makers of SDX; www.jenomics.de). Anything not verified is `null` and shows as a
 * TODO box in development builds only, never in production.
 * `logoH` is the rendered logo height in px, set by eye so the three marks carry the same weight. */
export const PARTNERS = [
  // White wordmark: sits on a dark plate. The other two are dark/blue marks on a light plate.
  {
    id: 'alture',
    name: 'Alture',
    logo: '/media/partners/alture.png',
    logoH: 30,
    url: null as string | null, // TODO: Alture website
    plate: 'dark' as 'dark' | 'light',
  },
  {
    id: 'jenomics',
    name: 'Jenomics',
    logo: '/media/partners/logo-jenomics-text-blue.webp',
    logoH: 28,
    url: 'https://www.jenomics.de' as string | null,
  },
  {
    id: 'sisu',
    name: 'Sisu Vision',
    logo: '/media/partners/sisu-logo-dark.svg',
    logoH: 38,
    url: null as string | null,
  }, // TODO: Sisu Vision website
];
