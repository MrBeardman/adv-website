/* The headline numbers, one per service, in service order. The ONE place they live (value cards,
 * numbers band). Ported from PersonalPortfolio src/data/homeNumbers.js.
 *
 * `placeholder: true` marks an invented number, put in so the design can be judged with a figure in
 * place (Honza, Oct 2026: "numbers in for the visual now, concrete later"). Every placeholder MUST be
 * replaced with a real, checkable figure before launch: see "Launch checklist" in docs/STATUS.md.
 * Development builds mark placeholders with a small dashed outline (.adv-ph) so they can't be missed.
 *
 * Real ones:
 *   ~340,000 Kč  Kesia live pricing case: rounded estimate from Shoptet's public price list
 *                (3× Premium vs 3× Profi), footnoted on the case page.
 *   2×           Studio Fit Uhříněves: "Bookings doubled within two months of the relaunch"
 *                (caseStudies.ts). Studio Fit has no case page yet, so it links to the Websites service. */
import type { Localized } from '../i18n';

export interface HomeNumber {
  slug: string;
  placeholder: boolean;
  /** count-up target and how to print it */
  count: number;
  prefix?: string;
  suffix: Localized;
  value: Localized;
  label: Localized;
  short: Localized;
  link: { kind: 'service' | 'case'; slug: string };
  linkLabel: Localized;
}

export const HOME_NUMBERS: HomeNumber[] = [
  {
    slug: 'ai-automation',
    // TODO: placeholder. Replace with a measured figure from a real client.
    placeholder: true,
    count: 1200,
    suffix: { en: ' h', cs: ' h' },
    value: { en: '1,200 h', cs: '1 200 h' },
    label: { en: 'of manual work automated per year', cs: 'ruční práce zautomatizované za rok' },
    short: { en: 'automated a year', cs: 'zautomatizováno ročně' },
    link: { kind: 'service', slug: 'ai-automation' },
    linkLabel: { en: 'See AI and automation', cs: 'Detail AI a automatizace' },
  },
  {
    slug: 'business-optimisation',
    placeholder: false,
    count: 340000,
    prefix: '~',
    suffix: { en: ' Kč', cs: ' Kč' },
    value: { en: '~340,000 Kč', cs: '~340 000 Kč' },
    label: {
      en: "a year saved on one client's e-shop fees",
      cs: 'ročně ušetřeno na poplatcích za e-shopy jednoho klienta',
    },
    short: { en: 'saved a year', cs: 'ušetřeno ročně' },
    link: { kind: 'case', slug: 'kesia-live-pricing' },
    linkLabel: { en: 'Read the Kesia case', cs: 'Přečíst případ Kesia' },
  },
  {
    slug: 'websites',
    placeholder: false,
    count: 2,
    suffix: { en: '×', cs: '×' },
    value: { en: '2×', cs: '2×' },
    label: { en: 'bookings within two months of a relaunch', cs: 'víc rezervací do dvou měsíců od relaunche' },
    short: { en: 'the bookings', cs: 'víc rezervací' },
    link: { kind: 'service', slug: 'websites' },
    linkLabel: { en: 'See websites', cs: 'Detail webů' },
  },
  {
    slug: 'software',
    // TODO: placeholder. Replace with a real delivery time from a real project.
    placeholder: true,
    count: 14,
    suffix: { en: ' days', cs: ' dní' },
    value: { en: '14 days', cs: '14 dní' },
    label: { en: 'from first call to a clickable demo', cs: 'od prvního hovoru po klikací demo' },
    short: { en: 'to a clickable demo', cs: 'do klikacího dema' },
    link: { kind: 'service', slug: 'software' },
    linkLabel: { en: 'See prototypes and software', cs: 'Detail prototypů a softwaru' },
  },
];

export const numberFor = (slug: string) => HOME_NUMBERS.find((n) => n.slug === slug);
