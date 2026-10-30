/* The per-service inquiry flows (Honza, Oct 29 2026): instead of one generic form, each service asks the
 * questions an expert in that field would ask first, a few at a time, and the answers sort the inquiry
 * automatically (classify() below): problem type, size, urgency, budget, a priority score and a tier.
 * The site shows the result to the visitor as a little "run" and sends it with the raw answers to the n8n
 * workflow (api/inquiry.ts), which stores and routes it.
 *
 * All texts here are NEW COPY for Honza's approval (docs/STATUS.md). Ids are stable: n8n and the stored
 * submissions read them, so rename labels freely but never ids.
 *
 * Scoring: every option may carry `w` (0-3) for one of the axes size / urgency / budget; the priority is
 * a weighted mix of the three, 0-100. No AI involved: the same answers always sort the same way.
 */
import type { Localized } from '../i18n';

export type Axis = 'size' | 'urgency' | 'budget';
export interface Option {
  id: string;
  label: Localized;
  /** weight 0-3 on the question's axis */
  w?: number;
}
export interface Question {
  id: string;
  kind: 'one' | 'many' | 'text';
  title: Localized;
  hint?: Localized;
  options?: Option[];
  /** which sorting axis this question feeds (one-choice questions only) */
  axis?: Axis;
  /** the problem type is the first answer of this question */
  problem?: boolean;
  optional?: boolean;
}

const t = (cs: string, en: string): Localized => ({ cs, en });
const o = (id: string, cs: string, en: string, w?: number): Option => ({ id, label: t(cs, en), w });

// Shared tail questions: when, how much, and the visitor's own words.
const timeline: Question = {
  id: 'timeline',
  kind: 'one',
  axis: 'urgency',
  title: t('Kdy byste chtěli začít?', 'When would you like to start?'),
  options: [
    o('now', 'Co nejdřív, hoří to', 'As soon as possible, it is urgent', 3),
    o('quarter', 'Během příštích 3 měsíců', 'Within the next 3 months', 2),
    o('later', 'Letos, ale bez spěchu', 'This year, no rush', 1),
    o('exploring', 'Zatím se jen rozhlížím', 'Just exploring for now', 0),
  ],
};
const budget: Question = {
  id: 'budget',
  kind: 'one',
  axis: 'budget',
  optional: true,
  title: t('S jakým rozpočtem počítáte?', 'What budget do you have in mind?'),
  hint: t('Nezávazně, pomůže nám navrhnout správný rozsah.', 'Not binding; it helps us propose the right scope.'),
  options: [
    o('s', 'Do 80 000 Kč', 'Up to EUR 3,000', 0),
    o('m', '80 000 – 250 000 Kč', 'EUR 3,000 – 10,000', 1),
    o('l', '250 000 – 800 000 Kč', 'EUR 10,000 – 30,000', 2),
    o('xl', 'Víc než 800 000 Kč', 'More than EUR 30,000', 3),
    o('unknown', 'Zatím nevím', 'Not sure yet', 1),
  ],
};
const words = (cs: string, en: string): Question => ({
  id: 'words',
  kind: 'text',
  optional: true,
  title: t(cs, en),
  hint: t(
    'Pár vět stačí. Čím konkrétněji, tím lepší první hovor.',
    'A few sentences are enough. The more concrete, the better the first call.',
  ),
});
const tools = (axisless = true): Question => ({
  id: 'tools',
  kind: 'many',
  optional: axisless,
  title: t('S jakými nástroji dnes pracujete?', 'Which tools do you work with today?'),
  options: [
    o('pohoda', 'Pohoda', 'Pohoda'),
    o('money', 'Money S3 / S4', 'Money S3 / S4'),
    o('abra', 'ABRA Flexi', 'ABRA Flexi'),
    o('shoptet', 'Shoptet', 'Shoptet'),
    o('woo', 'WooCommerce / WordPress', 'WooCommerce / WordPress'),
    o('m365', 'Microsoft 365', 'Microsoft 365'),
    o('google', 'Google Workspace', 'Google Workspace'),
    o('sheets', 'Excel / tabulky', 'Excel / spreadsheets'),
    o('crm', 'CRM (Pipedrive, HubSpot, …)', 'A CRM (Pipedrive, HubSpot, …)'),
    o('other', 'Něco jiného', 'Something else'),
  ],
});

export const FLOWS: Record<string, Question[]> = {
  'ai-automation': [
    {
      id: 'process',
      kind: 'many',
      problem: true,
      title: t('Která práce vám bere nejvíc času?', 'Which work takes the most of your time?'),
      options: [
        o('documents', 'Přepisování faktur a dokumentů', 'Retyping invoices and documents'),
        o('orders', 'Zpracování objednávek', 'Processing orders'),
        o('email', 'Odpovídání na stejné dotazy a e-maily', 'Answering the same questions and emails'),
        o('approvals', 'Schvalování přes e-mail', 'Approvals over email'),
        o('reports', 'Ruční reporty a exporty', 'Manual reports and exports'),
        o('other', 'Něco jiného', 'Something else'),
      ],
    },
    {
      id: 'volume',
      kind: 'one',
      axis: 'size',
      title: t('Kolik takových položek je za týden?', 'How many of these items come in per week?'),
      hint: t('Faktury, objednávky, e-maily… odhadem.', 'Invoices, orders, emails… a rough guess.'),
      options: [
        o('lt20', 'Méně než 20', 'Fewer than 20', 0),
        o('20-100', '20 – 100', '20 – 100', 1),
        o('100-500', '100 – 500', '100 – 500', 2),
        o('gt500', 'Víc než 500', 'More than 500', 3),
      ],
    },
    {
      id: 'hours',
      kind: 'one',
      axis: 'size',
      title: t('Kolik hodin týdně tomu tým věnuje?', 'How many hours a week does the team spend on it?'),
      options: [
        o('lt5', 'Do 5 hodin', 'Up to 5 hours', 0),
        o('5-20', '5 – 20 hodin', '5 – 20 hours', 1),
        o('20-40', '20 – 40 hodin', '20 – 40 hours', 2),
        o('gt40', 'Víc než 40 hodin', 'More than 40 hours', 3),
      ],
    },
    tools(),
    {
      id: 'judgement',
      kind: 'one',
      title: t('Kde musí rozhodnout člověk?', 'Where does a person need to decide?'),
      options: [
        o('none', 'Nikde, jsou to jasná pravidla', 'Nowhere, the rules are clear'),
        o('some', 'U výjimek a vyšších částek', 'On exceptions and larger amounts'),
        o('often', 'Často, je v tom hodně úsudku', 'Often, there is a lot of judgement in it'),
        o('unsure', 'Nevím, to chci probrat', 'Not sure, I want to talk it through'),
      ],
    },
    timeline,
    budget,
    words('Popište tu práci svými slovy.', 'Describe the work in your own words.'),
  ],

  'business-optimisation': [
    {
      id: 'pain',
      kind: 'many',
      problem: true,
      title: t('Co vás ve firmě nejvíc brzdí?', 'What slows your company down most?'),
      options: [
        o('heads', 'Postupy jsou jen v hlavách lidí', 'Processes live only in people’s heads'),
        o('sheets', 'Na všechno jsou tabulky', 'There is a spreadsheet for everything'),
        o('scattered', 'Data jsou na mnoha místech', 'Data sits in many places'),
        o('overview', 'Chybí přehled a reporting', 'No overview or reporting'),
        o('errors', 'Chyby a práce dvakrát', 'Errors and doing work twice'),
        o('growth', 'Firma roste a systém nestíhá', 'The company grows, the setup does not keep up'),
      ],
    },
    {
      id: 'team',
      kind: 'one',
      axis: 'size',
      title: t('Kolik lidí ve firmě pracuje?', 'How many people work in the company?'),
      options: [
        o('1-10', '1 – 10', '1 – 10', 0),
        o('11-50', '11 – 50', '11 – 50', 1),
        o('51-200', '51 – 200', '51 – 200', 2),
        o('gt200', 'Víc než 200', 'More than 200', 3),
      ],
    },
    {
      id: 'area',
      kind: 'many',
      title: t('Kterých oblastí se to týká?', 'Which areas does it touch?'),
      options: [
        o('sales', 'Obchod', 'Sales'),
        o('ops', 'Provoz a sklad', 'Operations and warehouse'),
        o('finance', 'Finance a účetnictví', 'Finance and accounting'),
        o('service', 'Zákaznická péče', 'Customer service'),
        o('hr', 'Lidé a nábor', 'People and hiring'),
        o('mgmt', 'Vedení a reporting', 'Management and reporting'),
      ],
    },
    tools(),
    timeline,
    budget,
    words('Jak by to mělo vypadat za půl roku?', 'What should it look like in six months?'),
  ],

  websites: [
    {
      id: 'need',
      kind: 'many',
      problem: true,
      title: t('Co potřebujete?', 'What do you need?'),
      options: [
        o('new', 'Nový web', 'A new website'),
        o('redesign', 'Redesign stávajícího webu', 'A redesign of the current site'),
        o('eshop', 'E-shop', 'An e-shop'),
        o('landing', 'Kampaňovou nebo produktovou stránku', 'A campaign or product page'),
      ],
    },
    {
      id: 'goal',
      kind: 'many',
      title: t('Co má web hlavně přinášet?', 'What should the site bring in, above all?'),
      options: [
        o('leads', 'Poptávky', 'Inquiries'),
        o('bookings', 'Rezervace', 'Bookings'),
        o('sales', 'Prodeje online', 'Online sales'),
        o('trust', 'Důvěru a dobré jméno', 'Trust and reputation'),
        o('hiring', 'Nové kolegy', 'New colleagues'),
      ],
    },
    {
      id: 'size',
      kind: 'one',
      axis: 'size',
      title: t('Jak velký web si představujete?', 'How big a site do you have in mind?'),
      options: [
        o('one', 'Jedna stránka', 'One page', 0),
        o('small', '2 – 8 stránek', '2 – 8 pages', 1),
        o('medium', '9 – 25 stránek', '9 – 25 pages', 2),
        o('large', 'Víc, nebo stovky produktů', 'More, or hundreds of products', 3),
      ],
    },
    {
      id: 'have',
      kind: 'many',
      optional: true,
      title: t('Co už máte?', 'What do you already have?'),
      options: [
        o('logo', 'Logo', 'A logo'),
        o('brand', 'Barvy a firemní styl', 'Brand colours and style'),
        o('photos', 'Fotky', 'Photos'),
        o('texts', 'Texty', 'Texts'),
        o('domain', 'Doménu', 'A domain'),
        o('hosting', 'Hosting', 'Hosting'),
      ],
    },
    {
      id: 'help',
      kind: 'many',
      optional: true,
      title: t('S čím ještě chcete pomoct?', 'What else would you like help with?'),
      options: [
        o('copy', 'Texty (copywriting)', 'Copywriting'),
        o('seo', 'SEO a viditelnost', 'SEO and visibility'),
        o('care', 'Správa a aktualizace', 'Care and updates'),
        o('booking', 'Rezervace nebo platby', 'Bookings or payments'),
        o('newsletter', 'Newsletter', 'A newsletter'),
        o('automation', 'Napojení na vaše systémy', 'Connecting your systems'),
      ],
    },
    timeline,
    budget,
    words(
      'Máte web, který se vám líbí? Pošlete odkaz nebo popište proč.',
      'Is there a site you like? Send a link or say why.',
    ),
  ],

  software: [
    {
      id: 'build',
      kind: 'many',
      problem: true,
      title: t('Co chcete postavit?', 'What do you want to build?'),
      options: [
        o('internal', 'Interní nástroj pro tým', 'An internal tool for the team'),
        o('portal', 'Portál pro zákazníky nebo partnery', 'A portal for customers or partners'),
        o('booking', 'Rezervace a plánování', 'Booking and scheduling'),
        o('dashboard', 'Přehledy a dashboardy z dat', 'Overviews and dashboards from data'),
        o('product', 'Nový produkt (SaaS, aplikace)', 'A new product (SaaS, app)'),
        o('replace', 'Náhradu starého systému', 'A replacement for an old system'),
      ],
    },
    {
      id: 'users',
      kind: 'one',
      axis: 'size',
      title: t('Kolik lidí to bude používat?', 'How many people will use it?'),
      options: [
        o('lt10', 'Do 10', 'Up to 10', 0),
        o('10-100', '10 – 100', '10 – 100', 1),
        o('100-1000', '100 – 1 000', '100 – 1,000', 2),
        o('gt1000', 'Víc než 1 000', 'More than 1,000', 3),
      ],
    },
    {
      id: 'stage',
      kind: 'one',
      title: t('Kde teď jste?', 'Where are you now?'),
      options: [
        o('idea', 'Mám nápad', 'I have an idea'),
        o('spec', 'Mám zadání nebo návrhy', 'I have a brief or designs'),
        o('old', 'Mám starý systém, který nestačí', 'I have an old system that is not enough'),
        o('proto', 'Mám prototyp a chci ho dotáhnout', 'I have a prototype to finish'),
      ],
    },
    tools(),
    timeline,
    budget,
    words('Co má nástroj umět jako první?', 'What should it do first?'),
  ],
};

export interface Classified {
  service: string;
  problem: string;
  size: number;
  urgency: number;
  budget: number;
  priority: number;
  tier: 'hot' | 'warm' | 'cold';
}

/** Sort an inquiry from its answers (ids only). Same answers → same result, on the site and in n8n. */
export function classify(service: string, answers: Record<string, string | string[]>): Classified {
  const qs = FLOWS[service] ?? [];
  const axis: Record<Axis, number[]> = { size: [], urgency: [], budget: [] };
  let problem = '';
  for (const q of qs) {
    const a = answers[q.id];
    if (q.problem && a) problem = Array.isArray(a) ? a.join(',') : a;
    if (!q.axis || typeof a !== 'string') continue;
    const w = q.options?.find((x) => x.id === a)?.w;
    if (typeof w === 'number') axis[q.axis].push(w);
  }
  const avg = (v: number[], fallback: number) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : fallback);
  const size = avg(axis.size, 1);
  const urgency = avg(axis.urgency, 1);
  const budgetW = avg(axis.budget, 1);
  const priority = Math.round(((size * 0.35 + urgency * 0.35 + budgetW * 0.3) / 3) * 100);
  const tier = priority >= 62 ? 'hot' : priority >= 35 ? 'warm' : 'cold';
  return { service, problem, size, urgency, budget: budgetW, priority, tier };
}
