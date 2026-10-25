# Status (2026-10-25)

## Preview phase: FLIP AT LAUNCH
- The whole site is **noindex, nofollow** and `robots.txt` disallows everything while it is a preview
  (Hostinger preview, Honza's colleagues). One switch: `PUBLIC_SITE_INDEXABLE=true` in the build environment
  (`src/data/site.ts`), then rebuild. Without it: every page carries
  `<meta name="robots" content="noindex, nofollow">`, `/robots.txt` says `Disallow: /`.
- Repo: https://github.com/MrBeardman/adv-website (main), Hostinger auto-pulls `main`. Push only at verified,
  presentable milestones. Never force-push.

## Done
- Astro stack scaffold (Jenomics pattern), fonts, media, CS + EN copy ported from PersonalPortfolio
  `adv-rebrand`, data modules (services with the `enabled` switch, case visibility rules, headline numbers,
  partners, routes).
- Design system (`site.css`): Studio palette, Ice accent, matte card finish with pointer spotlight, progressive
  mesh background + grain, buttons with light sweep, link underline draw-in, reveals, line reveals, scroll-lit
  words, count-ups, play-once charts, reduced motion, no-JS.
- **Automation & AI page** `/sluzby/automatizace/` + `/en/services/automation/` (the Relay-style page, per
  Honza: it is the automation service, not the homepage): hero with the tilted glass workflow window
  (invoice → extraction → over 50,000 CZK? → approval / booking in Pohoda → done, recent-runs log),
  typewriter word, workflow grid (flows kept clear of text and window), the stream of light with section
  nodes, tools row, scroll-lit statement, three "what we automate" scene cards, Kesia spotlight with drawn
  chart + count-ups, numbers band with mini charts, savings slider, process timeline, selected automation
  work, Ice CTA panel with a short form.
- Nav: "Služby" opens a menu of the services, automation first as "Automatizace a AI" / "Automation & AI".
- Services overview, generic service pages (optimisation, websites, prototypes & software), work index with
  service filter (`?service=`), Kesia live pricing case page (ticker, 164 cells, fee bars, price path,
  screenshots, results, footnote), generic case template (dev-only placeholders), About (stats, partners),
  Contact (full form), 404, contact API (honeypot, rate limit, validation, jsonl store, SMTP-less mode).
- impeccable detector: 0 findings on the automation page (CS + EN, 1280 and 390).

## In progress
- Homepage `/` + `/en/`: becoming a calmer company overview (short hero about ADV as a whole, four value cards
  to the services, selected work, partners, contact; no workflow window, light stream).

## New copy (needs Honza's approval)
- Automation page: hero pill and sub, "Kde mizí hodiny." + the three card bodies, the scene labels
  (Účetní / Obchod / Schválení, Návrh odpovědi / Odeslat), the window texts (file name, node labels,
  log statuses), workflow grid labels, statement ("Většina práce je rutina. ..."), tools heading.
- Value card titles (Automatizujte rutinu, Optimalizujte firmu, Prototyp vašeho nápadu, Nový web, který prodává).
- Typewriter words (byznysu / času / klidu / prodejů; business / time / focus / sales).
- Numbers band title ("Co se dá změřit."), savings slider texts and its assumptions note, process step 1
  ("Hovor") and 4 ("Stavba") bodies, CTA panel texts ("Který úkol byste už nikdy nedělali?" ...), form
  API messages, Kesia chart label.

## Launch checklist
- [ ] Replace placeholder numbers in `src/data/homeNumbers.ts`: AI **1,200 h** and Software **14 days**
      (`placeholder: true`, dashed outline in dev builds).
- [ ] Savings slider assumptions (46 weeks, 70 %, 450 CZK/h) confirmed or changed (`07-savings.astro`).
- [ ] Tool list confirmed (`02-tools.astro`).
- [ ] About stats (13 years, 50+ projects, 2–50k EUR, CZ/DE) confirmed; team section copy + portraits.
- [ ] Partner URLs for Alture and Sisu Vision; one "together" line per partner (`partners.ts`, about.json).
- [ ] Contact: `MAIL_TO` recipient + SMTP env vars in Hostinger (`.env.example`).
- [ ] Domain in `astro.config.mjs` (`site`), then 301s from the old React URLs (`src/data/routes.ts`),
      e.g. `/services/ai-automation` → `/sluzby/automatizace/`.
- [ ] Privacy note / page for the form.
- [ ] **Flip the preview switch**: `PUBLIC_SITE_INDEXABLE=true`.

## Open decisions (Honza)
- Headline emphasis: default is the same face in Ice; the Relay-style Instrument Serif italic is one switch
  (`EM_STYLE` in `src/data/site.ts`: 'ice' | 'serif' | 'off'). The impeccable detector flags the serif.
- Logo tile on dark: Ice via `--adv-logo-tile` (brand guide 1.0 says Signal amber; amber is retired).
- Tool list, contact recipient, partner URLs, About stats (above).
- Optional extras not built yet: first-visit logo intro (0–100 count folding into the nav logo), mid-page
  logo plate opening into a statement panel, brand-moment image (slot ready: `ui/BrandMoment.astro`).
