/* Case studies: the single source for every place work appears (homepage, service pages, the work
 * index, case pages, next-project links). Adding a project here updates all of them.
 *
 * Ported 1:1 from PersonalPortfolio (adv-rebrand) src/data/caseStudies.js.
 *
 * ── Status ─────────────────────────────────────────────────────────────────
 *   published    real client, copy approved, shown everywhere
 *   draft        real client, copy incomplete: development builds only
 *   placeholder  INVENTED client, exists only so layouts can be built against realistic content:
 *                development builds only, NEVER in a production build
 *
 * The visibility rule below is not optional. Placeholder entries describe fictional companies with
 * fictional numbers; one of them reaching the live site would be a false claim about work that never
 * happened. `astro dev` shows everything; `astro build` only `published`.
 *
 * Text fields are { en, cs? }; a missing cs falls back to en (loc() in i18n/index.ts). */
import type { Localized } from '../i18n';

export const TODO = 'TODO';

export type CaseStatus = 'published' | 'draft' | 'placeholder';
export interface CaseDetail {
  layout?: 'kesia-live-pricing' | 'laser-arena-praha' | 'homestyle';
  situation?: Localized;
  approach?: { title: Localized; body: Localized }[];
  results?: { value: string; label: Localized }[];
  duration?: Localized;
  team?: Localized;
  state: 'live' | 'ongoing-support' | 'in-progress';
}
export interface CaseStudy {
  slug: string;
  status: CaseStatus;
  client: Localized;
  sector: Localized;
  year: number | null;
  services: string[];
  outcome: Localized;
  image?: string;
  /** Flat screenshots for the device mockups (ui/Devices.astro): a laptop screen (16:10), optionally a
   *  phone screen or a second app window floating in front. Cases without them show as plain rows. */
  screens?: { desktop: string; mobile?: string; float?: string };
  related?: string[];
  detail?: CaseDetail;
}

/** Drafts and placeholders: `astro dev` only. */
export const SHOW_UNPUBLISHED = import.meta.env.DEV;
export const isVisible = (c: CaseStudy) => c.status === 'published' || SHOW_UNPUBLISHED;

export const CASE_STUDIES: CaseStudy[] = [
  /* ── Real projects ─────────────────────────────────────────────────────── */
  {
    slug: 'kesia-praha',
    // Hidden for now (Honza, Oct 29 2026): the e-shops are being redesigned. Back with 'published'.
    status: 'draft',
    client: { en: 'Kesia Praha' },
    sector: { en: 'Retail', cs: 'Maloobchod' },
    year: null,
    services: ['websites'],
    outcome: {
      en: 'Three premium storefronts and one stock view, run by a team of two.',
      cs: 'Tři prémiové obchody a jeden pohled na sklad, které zvládnou dva lidi.',
    },
    image: '/media/cases/kesia-1.webp',
    // Same client, separate project: the live pricing dashboard below.
    related: ['kesia-live-pricing'],
  },
  {
    /* Live precious-metal pricing for Kesia. Business optimisation first (it
     * is the featured case of that service), automation second.
     *
     * Public naming rule: the client is "Kesia", the shops are "three
     * e-shops" (Prague, Brno, Hradec Králové). Never the shop brand names.
     * Every number on the page is a rounded estimate with a footnote; source:
     * ADV\case-study-kesia\case-study-brief.md.
     *
     * Has its own page layout (templates/KesiaLivePricing.astro), selected by
     * detail.layout; its copy lives in i18n/kesia.json. */
    slug: 'kesia-live-pricing',
    status: 'published',
    client: { en: 'Kesia' },
    sector: { en: 'Precious metals', cs: 'Investiční kovy' },
    year: 2026,
    services: ['business-optimisation', 'ai-automation'],
    outcome: {
      en: 'Live gold, silver and platinum prices across three e-shops, with no daily retyping.',
      cs: 'Živé ceny zlata, stříbra a platiny ve třech e-shopech, bez každodenního ručního přepisování.',
    },
    image: '/media/cases/kesia/cover.webp',
    screens: {
      desktop: '/media/cases/kesia/01-pricing-groups.webp',
      float: '/media/cases/kesia/03-sales-analytics-760.webp',
    },
    related: ['kesia-praha'],
    detail: { layout: 'kesia-live-pricing', state: 'ongoing-support' },
  },
  {
    slug: 'studio-fit-uhrineves',
    // Hidden for now (Honza, Nov 1 2026). Back with 'published'.
    status: 'draft',
    client: { en: 'Studio Fit Uhříněves' },
    sector: { en: 'Fitness', cs: 'Fitness' },
    year: null,
    services: ['websites'],
    outcome: {
      en: 'Bookings doubled within two months of the relaunch.',
      cs: 'Rezervace se do dvou měsíců od relaunche zdvojnásobily.',
    },
    image: '/media/cases/studio-1.webp',
    // live site, captured Oct 29 2026
    screens: { desktop: '/media/cases/studio/desktop.webp', mobile: '/media/cases/studio/mobile.webp' },
  },
  {
    /* Custom WordPress site + booking system, the owner edits everything himself. Own page layout
     * (templates/LaserArenaPraha.astro), copy in i18n/laser.json. Numbers are the owner's rounded estimates
     * (~+60% bookings vs the same months last year, ~10 h a week saved); client approved, quote still to come. */
    slug: 'laser-arena-praha',
    status: 'published',
    client: { en: 'Laser Arena Praha' },
    sector: { en: 'Entertainment', cs: 'Zábava' },
    year: 2026,
    services: ['websites', 'software'],
    outcome: {
      en: 'A booking system the owner runs himself: by his own count about 60% more bookings and around 10 hours a week saved.',
      cs: 'Rezervační systém, který majitel vede sám: podle něj zhruba o 60 % víc rezervací a kolem 10 hodin týdně ušetřeno.',
    },
    image: '/media/cases/laser/cover.webp',
    screens: { desktop: '/media/cases/laser/08-home-laptop.webp', float: '/media/cases/laser/02-slots-760.webp' },
    detail: { layout: 'laser-arena-praha', state: 'ongoing-support' },
  },
  {
    /* Custom WordPress site + admin for a Prague furniture showroom. PUBLISHED on request (Nov 1 2026); still open: the client's approval and
     * the go-live on homestyle.cz are confirmed; the new site still runs beside the old one and the owner is moving
     * products over. Numbers: 151 products and 8 brands from the admin (Nov 1 2026), ~150 ms measured server response.
     * No savings are claimed (none supplied). Own page layout (templates/HomeStyle.astro), copy in i18n/homestyle.json. */
    slug: 'homestyle',
    status: 'published',
    client: { en: 'HomeStyle' },
    sector: { en: 'Furniture', cs: 'Nábytek' },
    year: 2026,
    services: ['websites', 'software'],
    outcome: {
      en: 'A fast new site and an admin where the owner sets tags, materials, sets, order and filters himself.',
      cs: 'Rychlý nový web a administrace, ve které si majitel sám nastaví štítky, materiály, sestavy, pořadí i filtry.',
    },
    image: '/media/cases/homestyle/10-new-home.webp',
    // the new site (aqua-sparrow-244867.hostingersite.com), captured Nov 1 2026 at 1440×900 and 390×844
    screens: { desktop: '/media/cases/homestyle/desktop.webp', mobile: '/media/cases/homestyle/mobile.webp' },
    detail: { layout: 'homestyle', state: 'in-progress' },
  },
  {
    slug: 'zive-vinohrady',
    status: 'draft',
    client: { en: 'Živé Vinohrady' },
    sector: { en: 'Events', cs: 'Akce' },
    year: null,
    services: ['websites'],
    outcome: { en: TODO },
  },
  {
    slug: 'nerit',
    status: 'draft',
    client: { en: 'Nerit' },
    sector: { en: 'IT services', cs: 'IT služby' },
    year: null,
    services: ['websites'],
    outcome: { en: TODO },
  },
  {
    slug: 'be-agency',
    status: 'draft',
    client: { en: 'BE Agency' },
    sector: { en: 'Events', cs: 'Eventy' },
    year: null,
    services: ['websites'],
    outcome: { en: TODO },
  },
  /* ── Our own products (Honza, Nov 1 2026: "I made them for myself, technically I am my own client").
   * Facts from their repos (github.com/MrBeardman/dreamshape-app, finance-tracker, freelance-dashboard):
   * features, stack, start dates. No savings claimed. Draft until Honza has read them. */
  {
    slug: 'dreamshape',
    status: 'draft',
    client: { en: 'DreamShape' },
    sector: { en: 'Fitness, own product', cs: 'Fitness, vlastní produkt' },
    year: 2025,
    services: ['software'],
    outcome: {
      en: 'One app for training, food and habits instead of three: workouts, records, nutrition with a barcode scanner and daily habits, synced across devices.',
      cs: 'Jedna aplikace na trénink, jídlo a návyky místo tří: tréninky, rekordy, výživa se skenerem čárových kódů a denní návyky, synchronizované mezi zařízeními.',
    },
    image: '/media/cases/dreamshape-1.webp',
    detail: {
      situation: {
        en: 'Training notes in one app, calories in another, habits on paper. None of them knew about the others, so there was no single view of how a week actually went, and logging a set mid-workout took longer than the rest between sets.',
        cs: 'Tréninky v jedné aplikaci, kalorie v druhé, návyky na papíře. Žádná o těch ostatních nevěděla, takže nebyl jeden pohled na to, jak týden opravdu proběhl, a zapsat sérii uprostřed tréninku trvalo déle než pauza mezi sériemi.',
      },
      approach: [
        {
          title: { en: 'Fast where it matters: in the gym', cs: 'Rychlost tam, kde na ní záleží: v posilovně' },
          body: {
            en: 'Sets fill in from the last workout, a rest timer runs per exercise, and a workout can be minimised so the rest of the app stays usable without losing the session.',
            cs: 'Série se předvyplní z minulého tréninku, u každého cviku běží časovač pauzy a trénink jde minimalizovat, takže zbytek aplikace zůstane použitelný a rozjetý trénink se neztratí.',
          },
        },
        {
          title: { en: 'Food without typing', cs: 'Jídlo bez přepisování' },
          body: {
            en: 'Search the Open Food Facts database or scan a barcode with the phone camera; your own foods keep named portions such as "1 slice = 30 g".',
            cs: 'Vyhledávání v databázi Open Food Facts nebo sken čárového kódu kamerou telefonu; vlastní potraviny si pamatují porce typu „1 plátek = 30 g“.',
          },
        },
        {
          title: { en: 'One home screen', cs: 'Jedna úvodní obrazovka' },
          body: {
            en: 'Workouts this week, the streak, which muscle groups are overdue, today\'s calories and macros, habits and tasks, all at a glance; the long-term charts live in the profile.',
            cs: 'Tréninky za týden, série dnů, které partie dlouho nepřišly na řadu, dnešní kalorie a makra, návyky a úkoly, všechno na jeden pohled; dlouhodobé grafy jsou v profilu.',
          },
        },
        {
          title: { en: 'Works offline, syncs when it can', cs: 'Funguje offline, synchronizuje, když může' },
          body: {
            en: 'A progressive web app: data is saved on the phone first and synced to the cloud (Supabase) when there is a connection, so a weak signal in a basement gym loses nothing.',
            cs: 'Progresivní webová aplikace: data se ukládají nejdřív v telefonu a do cloudu (Supabase) se dostanou, jakmile je spojení, takže slabý signál ve sklepní posilovně nic nesmaže.',
          },
        },
      ],
      results: [
        { value: '3 → 1', label: { en: 'apps replaced by one', cs: 'aplikace nahrazené jednou' } },
        { value: '55', label: { en: 'built-in exercises, plus your own', cs: 'cviků v knihovně, k tomu vlastní' } },
        { value: '12/2025', label: { en: 'in use since', cs: 'v provozu od' } },
      ],
      duration: { en: 'Built in phases since December 2025', cs: 'Stavěno po etapách od prosince 2025' },
      team: { en: 'Design and development in-house', cs: 'Návrh i vývoj vlastními silami' },
      state: 'live',
    },
  },
  {
    slug: 'finance-tracker',
    status: 'draft',
    client: { en: 'Household finances', cs: 'Rodinné finance' },
    sector: { en: 'Personal finance, own product', cs: 'Osobní finance, vlastní produkt' },
    year: 2026,
    services: ['software', 'business-optimisation'],
    outcome: {
      en: 'A shared household budget on two phones instead of one spreadsheet: expenses in seconds, budgets per category and a monthly settlement that works itself out.',
      cs: 'Společný rodinný rozpočet ve dvou telefonech místo jedné tabulky: výdaj zapsaný za pár vteřin, rozpočty po kategoriích a měsíční vyrovnání, které se spočítá samo.',
    },
    detail: {
      situation: {
        en: 'Two incomes, shared and personal expenses, savings goals, all in one Excel file. A whole day\'s spending went into a single cell, entering anything on a phone was painful, formulas needed constant care, and working out who owed whom when one of us paid a shared bill from a personal account was a monthly chore.',
        cs: 'Dva příjmy, společné i osobní výdaje, cíle spoření, všechno v jednom Excelu. Útrata za celý den se vešla do jedné buňky, zapsat něco z telefonu bylo utrpení, vzorce se musely pořád hlídat a spočítat, kdo komu dluží, když jeden zaplatil společný účet z osobního, byla měsíční otrava.',
      },
      approach: [
        {
          title: { en: 'Built for the phone', cs: 'Postavené pro telefon' },
          body: {
            en: 'Each person logs in on their own phone; adding an expense is one screen: amount, category, who paid and from which account.',
            cs: 'Každý se přihlásí ve svém telefonu; zapsat výdaj je jedna obrazovka: částka, kategorie, kdo platil a z jakého účtu.',
          },
        },
        {
          title: { en: 'The settlement does the maths', cs: 'Vyrovnání počítá samo' },
          body: {
            en: 'Shared costs split by each person\'s share of income; whenever someone pays a shared expense from their own pocket, the month-end balance updates by itself.',
            cs: 'Společné náklady se dělí podle podílu na příjmech; když někdo zaplatí společný výdaj ze svého, vyrovnání na konci měsíce se upraví samo.',
          },
        },
        {
          title: { en: 'Budgets and goals you can see', cs: 'Rozpočty a cíle na očích' },
          body: {
            en: 'Budget against spending per category, income with a 60/20/20 allocation, savings goals with the monthly amount needed, and a 12-month overview laid out like the old spreadsheet.',
            cs: 'Rozpočet proti útratě po kategoriích, příjmy s rozdělením 60/20/20, cíle spoření s měsíční částkou, kterou je potřeba odkládat, a přehled za 12 měsíců uspořádaný jako stará tabulka.',
          },
        },
        {
          title: { en: 'The small daily things too', cs: 'I drobnosti na každý den' },
          body: {
            en: 'A shared grocery list in the same app, and business expenses kept apart from household ones.',
            cs: 'Společný nákupní seznam ve stejné aplikaci a firemní výdaje oddělené od domácích.',
          },
        },
      ],
      results: [
        { value: '0', label: { en: 'formulas to maintain by hand', cs: 'vzorců k ruční údržbě' } },
        { value: '2', label: { en: 'people, each on their own phone', cs: 'lidé, každý ve svém telefonu' } },
        { value: '1', label: { en: 'tap to see who owes whom', cs: 'klepnutí a víte, kdo komu dluží' } },
      ],
      duration: { en: 'Since March 2026', cs: 'Od března 2026' },
      team: { en: 'Design and development in-house', cs: 'Návrh i vývoj vlastními silami' },
      state: 'live',
    },
  },
  {
    slug: 'freelance-os',
    status: 'draft',
    client: { en: 'Freelance OS' },
    sector: { en: 'Project management, own product', cs: 'Řízení zakázek, vlastní produkt' },
    year: 2026,
    services: ['software', 'ai-automation'],
    outcome: {
      en: 'Clients, projects, meeting notes, tickets, hours and tasks in one place, with AI that turns meeting notes into tickets.',
      cs: 'Klienti, projekty, poznámky ze schůzek, tikety, hodiny i úkoly na jednom místě, s AI, která z poznámek ze schůzky udělá tikety.',
    },
    detail: {
      situation: {
        en: 'Freelance work for several clients spread over a spreadsheet, notes, a time tracker and email. After every meeting the notes had to be rewritten into tasks by hand, hours lived somewhere else, and the overview of what was open for whom existed only in one head.',
        cs: 'Práce pro několik klientů rozházená mezi tabulku, poznámky, měření času a e-mail. Po každé schůzce se poznámky musely ručně přepsat do úkolů, hodiny byly jinde a přehled, co je pro koho otevřené, existoval jen v jedné hlavě.',
      },
      approach: [
        {
          title: { en: 'One model of the work', cs: 'Jeden model práce' },
          body: {
            en: 'Clients, projects, scope documents and agreements, meeting notes, a ticket board and time entries, all linked to each other.',
            cs: 'Klienti, projekty, rozsah a dohody, poznámky ze schůzek, nástěnka tiketů a odpracovaný čas, všechno navzájem propojené.',
          },
        },
        {
          title: { en: 'AI where the busywork was', cs: 'AI tam, kde byla rutina' },
          body: {
            en: 'Paste the notes from a meeting and Claude proposes the tickets; an in-app assistant answers questions about any project.',
            cs: 'Vložíte poznámky ze schůzky a Claude navrhne tikety; asistent přímo v aplikaci odpoví na otázky ke kterémukoli projektu.',
          },
        },
        {
          title: { en: 'Tasks that work offline', cs: 'Úkoly, které fungují i offline' },
          body: {
            en: 'A fast task list with lists, tags and subtasks that keeps working without a connection and syncs later without losing a change.',
            cs: 'Rychlý seznam úkolů se seznamy, štítky a podúkoly, který funguje i bez připojení a později se synchronizuje, aniž by se ztratila změna.',
          },
        },
        {
          title: { en: 'Moved when the platform got in the way', cs: 'Přestěhováno, když platforma překážela' },
          body: {
            en: 'When the free database kept pausing, the app moved to its own hosting and database with its own login, without losing data.',
            cs: 'Když se bezplatná databáze pořád uspávala, aplikace se přestěhovala na vlastní hosting a databázi s vlastním přihlášením, bez ztráty dat.',
          },
        },
      ],
      results: [
        { value: '1', label: { en: 'place for clients, tickets, hours and tasks', cs: 'místo pro klienty, tikety, hodiny i úkoly' } },
        { value: 'AI', label: { en: 'meeting notes become tickets', cs: 'z poznámek ze schůzky jsou tikety' } },
        { value: '03/2026', label: { en: 'in daily use since', cs: 'v každodenním provozu od' } },
      ],
      duration: { en: 'Since March 2026', cs: 'Od března 2026' },
      team: { en: 'Design and development in-house', cs: 'Návrh i vývoj vlastními silami' },
      state: 'live',
    },
  },

  /* ── Placeholders. INVENTED. Development builds only. ─────────────────────── */
  {
    slug: 'fleet-scheduling',
    status: 'placeholder',
    client: { en: 'Regional logistics company' },
    sector: { en: 'Logistics' },
    year: 2025,
    services: ['software'],
    outcome: { en: 'Dispatch planning moved from a whiteboard to an app the whole fleet uses.' },
    detail: {
      situation: {
        en: 'Forty drivers, three dispatchers and one whiteboard. Every route change meant a round of phone calls, and nobody outside the office knew the plan for the day.',
      },
      approach: [
        {
          title: { en: 'Assessment' },
          body: {
            en: 'Two days with the dispatch team to map how routes were actually planned and changed.',
          },
        },
        {
          title: { en: 'First version' },
          body: { en: 'Daily planning and driver notifications only, in use within eight weeks.' },
        },
        {
          title: { en: 'Rollout' },
          body: {
            en: 'Drivers onboarded depot by depot, with the whiteboard kept in parallel for two weeks.',
          },
        },
      ],
      results: [
        { value: '−60%', label: { en: 'Time spent on daily planning' } },
        { value: '40', label: { en: 'Drivers using the app daily' } },
        { value: '8 wks', label: { en: 'To first version in use' } },
      ],
      duration: { en: '5 months' },
      team: { en: 'Product designer, two developers, project lead' },
      state: 'ongoing-support',
    },
  },
  {
    slug: 'clinic-booking',
    status: 'placeholder',
    client: { en: 'Private clinic group' },
    sector: { en: 'Medical' },
    year: 2024,
    services: ['software'],
    outcome: { en: 'Online booking and reminders across three clinics, with no-shows down by a third.' },
    detail: {
      situation: {
        en: 'Three clinics, one phone line each, and a paper diary per doctor. Patients waited on hold, and missed appointments were never followed up.',
      },
      approach: [
        {
          title: { en: 'Assessment' },
          body: {
            en: 'Mapped booking rules per doctor and clinic, including the exceptions nobody had written down.',
          },
        },
        {
          title: { en: 'Integration' },
          body: { en: 'Connected online booking to the existing practice software instead of replacing it.' },
        },
        {
          title: { en: 'Reminders' },
          body: { en: 'Automatic SMS and email reminders with one-tap rescheduling.' },
        },
      ],
      results: [
        { value: '−33%', label: { en: 'No-shows' } },
        { value: '55%', label: { en: 'Bookings made online' } },
        { value: '3', label: { en: 'Clinics on one system' } },
      ],
      duration: { en: '4 months' },
      team: { en: 'Designer, developer, integration specialist, project lead' },
      state: 'live',
    },
  },
  {
    slug: 'order-reporting',
    status: 'placeholder',
    client: { en: 'Wholesale distributor' },
    sector: { en: 'Wholesale' },
    year: 2025,
    services: ['business-optimisation'],
    outcome: { en: 'Weekly reports that took a day to assemble now update on their own.' },
    detail: {
      situation: {
        en: 'Sales, stock and margin lived in three systems. Every Monday one analyst spent the day copying them into a spreadsheet that was out of date by Wednesday.',
      },
      approach: [
        {
          title: { en: 'Data map' },
          body: { en: 'Traced every number in the Monday report back to its source.' },
        },
        {
          title: { en: 'Sync' },
          body: { en: 'Nightly sync from the ERP, e-shop and warehouse into one reporting database.' },
        },
        { title: { en: 'Views' }, body: { en: 'Separate dashboards for sales, purchasing and management.' } },
      ],
      results: [
        { value: '1 day → 0', label: { en: 'Weekly reporting effort' } },
        { value: 'Daily', label: { en: 'Data refresh, previously weekly' } },
        { value: '3', label: { en: 'Systems in one view' } },
      ],
      duration: { en: '3 months' },
      team: { en: 'Data engineer, developer, project lead' },
      state: 'ongoing-support',
    },
  },
  {
    slug: 'agency-intranet',
    status: 'placeholder',
    client: { en: 'Real estate agency' },
    sector: { en: 'Real estate' },
    year: 2024,
    services: ['business-optimisation'],
    outcome: { en: 'Listings, viewings and contracts in one internal system instead of four.' },
    detail: {
      situation: {
        en: 'Twelve agents, four tools, and a shared spreadsheet as the source of truth. Leads got lost between the website form and whoever happened to read the inbox.',
      },
      approach: [
        {
          title: { en: 'Workflow' },
          body: {
            en: 'Documented the path from enquiry to signed contract with the agents who walk it every day.',
          },
        },
        {
          title: { en: 'System' },
          body: {
            en: 'One internal app for listings, leads, viewings and documents, linked to the public website.',
          },
        },
        {
          title: { en: 'Handover' },
          body: { en: 'Trained the office manager to run it without outside help.' },
        },
      ],
      results: [
        { value: '4 → 1', label: { en: 'Tools in daily use' } },
        { value: '< 1 hr', label: { en: 'Lead response time, previously next day' } },
        { value: '12', label: { en: 'Agents onboarded' } },
      ],
      duration: { en: '6 months' },
      team: { en: 'Designer, two developers, project lead' },
      state: 'ongoing-support',
    },
  },
  {
    slug: 'project-data-room',
    status: 'placeholder',
    client: { en: 'Architecture studio' },
    sector: { en: 'Architecture' },
    year: 2025,
    services: ['software'],
    outcome: { en: 'Drawings shared with contractors under access control and full version history.' },
    detail: {
      situation: {
        en: 'Plans went out to subcontractors as email attachments. Nobody could say who held which revision, and upcoming public tenders required a documented data environment.',
      },
      approach: [
        {
          title: { en: 'Assessment' },
          body: { en: "Reviewed tender requirements and the studio's existing file structure." },
        },
        {
          title: { en: 'Setup' },
          body: { en: 'Data room with project-level access, versioning and an audit log.' },
        },
        {
          title: { en: 'Onboarding' },
          body: {
            en: 'Contractor access rolled out project by project, with a one-page guide for external parties.',
          },
        },
      ],
      results: [
        { value: '100%', label: { en: 'Drawings issued through the data room' } },
        { value: '0', label: { en: 'Revisions sent by email' } },
        { value: 'Full', label: { en: 'Audit trail for tenders' } },
      ],
      duration: { en: '2 months' },
      team: { en: 'Implementation specialist, project lead' },
      state: 'live',
    },
  },
  {
    slug: 'client-portal',
    status: 'placeholder',
    client: { en: 'Law firm' },
    sector: { en: 'Legal' },
    year: 2024,
    services: ['software'],
    outcome: { en: 'Clients upload and sign documents in a portal instead of sending email attachments.' },
    detail: {
      situation: {
        en: 'Sensitive client documents arrived by email and were saved to personal folders. Data protection obligations were met on paper, not in daily practice.',
      },
      approach: [
        {
          title: { en: 'Audit' },
          body: { en: 'Mapped where client data entered the firm and where it ended up.' },
        },
        {
          title: { en: 'Portal' },
          body: { en: 'Branded client portal with upload, e-signature and automatic retention rules.' },
        },
        {
          title: { en: 'Policy' },
          body: { en: 'Internal guidelines and a short training for partners and staff.' },
        },
      ],
      results: [
        { value: '−90%', label: { en: 'Documents received by email' } },
        { value: 'Automatic', label: { en: 'Retention and deletion' } },
        { value: '1 day', label: { en: 'Staff training' } },
      ],
      duration: { en: '3 months' },
      team: { en: 'Security specialist, developer, project lead' },
      state: 'live',
    },
  },
  {
    slug: 'invoice-intake',
    status: 'placeholder',
    client: { en: 'Accounting firm' },
    sector: { en: 'Finance' },
    year: 2025,
    services: ['ai-automation'],
    outcome: {
      en: 'Incoming invoices read, checked and filed automatically, with exceptions flagged for review.',
    },
    detail: {
      situation: {
        en: 'Two accountants spent most of each month retyping supplier invoices into the accounting system. Errors surfaced at the end of the quarter.',
      },
      approach: [
        {
          title: { en: 'Trial' },
          body: {
            en: 'Ran a month of real invoices through extraction to measure accuracy before committing.',
          },
        },
        {
          title: { en: 'Pipeline' },
          body: { en: 'Intake from email, extraction, validation against supplier records, filing.' },
        },
        {
          title: { en: 'Review' },
          body: { en: 'Anything uncertain goes to a person with the fields already filled in.' },
        },
      ],
      results: [
        { value: '−70%', label: { en: 'Manual data entry' } },
        { value: '95%', label: { en: 'Invoices processed without changes' } },
        { value: 'Daily', label: { en: 'Error checks, previously quarterly' } },
      ],
      duration: { en: '3 months' },
      team: { en: 'Automation engineer, accounting consultant, project lead' },
      state: 'ongoing-support',
    },
  },
  {
    slug: 'enquiry-routing',
    status: 'placeholder',
    client: { en: 'Event agency' },
    sector: { en: 'Events' },
    year: 2025,
    services: ['ai-automation'],
    outcome: { en: 'Incoming requests sorted and answered with a first draft within minutes.' },
    detail: {
      situation: {
        en: 'Hundreds of enquiries a month across email, web and social media. The serious ones waited in the same queue as the spam.',
      },
      approach: [
        {
          title: { en: 'Triage' },
          body: { en: 'Classified a year of past enquiries to define categories and priorities.' },
        },
        {
          title: { en: 'Routing' },
          body: { en: 'Every new enquiry tagged, prioritised and assigned to the right person.' },
        },
        {
          title: { en: 'Drafts' },
          body: { en: 'A first reply prepared for each enquiry, edited and sent by a person.' },
        },
      ],
      results: [
        { value: '< 10 min', label: { en: 'First response, previously one to two days' } },
        { value: '4 hrs', label: { en: 'Saved per week' } },
        { value: '100%', label: { en: 'Replies reviewed by a person' } },
      ],
      duration: { en: '2 months' },
      team: { en: 'Automation engineer, project lead' },
      state: 'live',
    },
  },
];

const STATUS_RANK: Record<CaseStatus, number> = { published: 0, draft: 1, placeholder: 2 };
const byRecency = (a: CaseStudy, b: CaseStudy) =>
  (b.year ?? -Infinity) - (a.year ?? -Infinity) || STATUS_RANK[a.status] - STATUS_RANK[b.status];

/** Visible case studies, optionally for one service, newest first. */
export function caseStudiesFor(serviceSlug?: string | null) {
  return CASE_STUDIES.filter(isVisible)
    .filter((c) => !serviceSlug || c.services.includes(serviceSlug))
    .sort(byRecency);
}

export function findCaseStudy(slug: string) {
  const c = CASE_STUDIES.find((x) => x.slug === slug);
  return c && isVisible(c) ? c : null;
}

/** Cases that have their own page (in this build). */
export const caseStudiesWithPages = () => caseStudiesFor().filter((c) => c.detail);

/** Next visible case with a page in the same service, else the next in the overall list. */
export function nextCaseStudy(current: CaseStudy) {
  const same = caseStudiesFor(current.services[0]).filter((c) => c.detail);
  const all = caseStudiesWithPages();
  const pool = same.length > 1 ? same : all;
  const i = pool.findIndex((c) => c.slug === current.slug);
  if (pool.length < 2) return null;
  return pool[(i + 1) % pool.length];
}
