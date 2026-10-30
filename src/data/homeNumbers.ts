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

/** a secondary stat on the homepage service cards (lab/frameless: "more stats, not only hours") */
export interface CardStat {
  placeholder: boolean;
  value: Localized;
  short: Localized;
}

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
  /** two more stats under the headline one on the homepage service cards */
  more: CardStat[];
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
    // TODO: both placeholders (Oct 30, for the layout). Replace with measured figures.
    more: [
      { placeholder: true, value: { en: '85 %', cs: '85 %' }, short: { en: 'of documents with no manual step', cs: 'dokladů bez ruční práce' } },
      { placeholder: true, value: { en: '6', cs: '6' }, short: { en: 'processes running on their own', cs: 'procesů běží samo' } },
    ],
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
    // real: the Kesia case (live prices in three e-shops, no daily manual retyping)
    more: [
      { placeholder: false, value: { en: '3', cs: '3' }, short: { en: 'e-shops on live prices', cs: 'e-shopy s živými cenami' } },
      { placeholder: false, value: { en: '0', cs: '0' }, short: { en: 'prices retyped by hand', cs: 'ručně přepsaných cen' } },
    ],
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
    // first one real (Studio Fit: doubled within two months); the second is a placeholder
    more: [
      { placeholder: false, value: { en: '2 months', cs: '2 měsíce' }, short: { en: 'from relaunch', cs: 'od spuštění' } },
      { placeholder: true, value: { en: '+30 %', cs: '+30 %' }, short: { en: 'sales from the web', cs: 'tržeb z webu' } },
    ],
  },
  {
    slug: 'software',
    // TODO: placeholder. Replace with a real delivery time from a real project.
    placeholder: true,
    count: 7,
    suffix: { en: ' days', cs: ' dní' },
    value: { en: '7 days', cs: '7 dní' },
    label: { en: 'from first call to a working prototype', cs: 'od prvního hovoru po funkční prototyp' },
    short: { en: 'to a working prototype', cs: 'do funkčního prototypu' },
    link: { kind: 'service', slug: 'software' },
    linkLabel: { en: 'See prototypes and software', cs: 'Detail prototypů a softwaru' },
    // TODO: both placeholders (Oct 30, for the layout). Replace with figures from real projects.
    more: [
      { placeholder: true, value: { en: '3 weeks', cs: '3 týdny' }, short: { en: 'to the first version in use', cs: 'do první verze v provozu' } },
      { placeholder: true, value: { en: '1', cs: '1' }, short: { en: 'system instead of five spreadsheets', cs: 'systém místo pěti tabulek' } },
    ],
  },
];

export const numberFor = (slug: string) => HOME_NUMBERS.find((n) => n.slug === slug);
