# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: the owner or managing director of a small or mid-sized Czech or German company who is losing hours
to manual work, scattered tools and processes that live in people's heads, and who decides on the project
themselves. Secondary: the operations, finance or IT lead in the same or a larger company who scopes the
project and has to sign it off; they need enough detail (process, tools, data, security) to do that. Write for
the owner first, never leave the second reader without the detail they need.

## Product Purpose
The company website of ADV Innovations (Prague), founded by Jan Matyáš and a co-founder. It wins project
inquiries for four services, in this order: automation and AI, business optimisation, websites, prototypes
and business software (graphic design exists but is hidden). Success: a qualified inquiry that already
describes the client's problem in the terms we need, sorted automatically, so the first call starts with
the real question.

## Positioning
We run our own company on the automations and AI we sell. The site proves it rather than claims it: each
service has its own inquiry flow that asks the questions an expert in that vertical would ask, and the
inquiry is sorted and routed by a working automation (n8n) the moment it is sent.

## Operating Context
- Visitors arrive from referrals, partners and search, in Czech (default, site root) or English (`/en/`).
- An inquiry is the main action. Per-service guided flows replace the generic contact form; each submission
  goes to an n8n workflow on the company's Contabo server, which classifies it (service, problem type,
  size, urgency, priority) and notifies the team. The site keeps its own copy of every submission.
- Hosted on Hostinger as a Node app (Astro static + one API route), preview at
  https://tan-jellyfish-775816.hostingersite.com/, noindex until launch.

## Capabilities and Constraints
- Stack: Astro 7 static + `@astrojs/node`, vanilla JS per section, no CMS; texts in `src/i18n/*.json` (cs, en).
- Services and their visibility come from `src/data/capabilities.ts` (one `enabled` switch).
- Undecided: final domain (business card says www.advinnovations.com), co-founder name, team section,
  company IČO, privacy page for the forms, whether an AI summary is added to each inquiry.

## Brand Commitments
- Name "ADV Innovations"; the logo geometry in `src/data/logoPaths.ts` (the A is always a cut). The visual
  brand is open for redesign (Honza, Oct 2026), with one binding constraint: **deep navy blue, dark overall**.
- Voice: company "we", plain and precise, CS and EN.

## Evidence on Hand
- The Kesia live-pricing case (`/prace/kesia-live-pricing/`) with footnoted numbers. The client is "Kesia"
  only; the shops are "three e-shops".
- Nothing else is approved proof yet: no client logos, testimonials or team photos; the About stats (13 years,
  50+ projects, 2–50k EUR, CZ/DE) and the placeholder numbers in `src/data/homeNumbers.ts` are unconfirmed.
  Do not fabricate customers, numbers or quotes; mark anything unconfirmed as a placeholder.

## Product Principles
1. Show, don't claim: the inquiry flow, the case and the interface itself are the proof of competence.
2. Ask the right questions: every service speaks to that vertical's real problems in the client's words.
3. Organised and accountable: clear structure, clear next step, no hidden interactions.
4. Owner first, detail on demand.
5. Only checkable facts.
