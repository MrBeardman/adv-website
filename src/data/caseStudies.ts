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
  layout?: 'kesia-live-pricing';
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
    status: 'published',
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
    status: 'published',
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
    slug: 'laser-arena-praha',
    status: 'draft',
    client: { en: 'Laser Arena Praha' },
    sector: { en: 'Entertainment', cs: 'Zábava' },
    year: null,
    services: ['websites'],
    outcome: { en: TODO },
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
  {
    // Service mapping is a guess, pending confirmation.
    slug: 'dreamshape',
    status: 'draft',
    client: { en: 'DreamShape' },
    sector: { en: TODO },
    year: null,
    services: ['software'],
    outcome: {
      en: 'A product that finally looks like the price it asks for.',
      cs: 'Produkt, který konečně vypadá na cenu, kterou si říká.',
    },
    image: '/media/cases/dreamshape-1.webp',
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
