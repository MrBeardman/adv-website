# Status (2026-10-26)

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
- **Homepage** `/` + `/en/` (Honza, Oct 2026, replaces the calm overview): the old ADV homepage's 3D card
  stack rebuilt in Astro (vanilla three.js island, `components/home/CardStack.astro` +
  `scripts/stack/*`, engine ported from PersonalPortfolio `HeroSceneGL.js`) in the Studio look: graphite
  matte cards with a lit edge and Ice icons, the progressive background. Behind the stack the "breathing
  floor" (Oct 26): a slow Ice band crossing the grid bottom-left → top-right every 9 s, dimmed behind the
  copy, plus thin Ice light runners along the grid lines (no glowing heads), mouse lens on desktop
  (`scripts/heroBg/`, knobs in `tuning.ts`). Card faces are capped so a drag
  to the extreme can no longer blow the face out to white (Oct 26 fix).
  Drag/swipe (direction lock, thresholds, spring back, click still opens, vertical swipe scrolls), arrows,
  ←/→ keys, first-visit nudge, auto cycle with hold on the caption. Opening a card shows its service panel
  in the hero (URL hash, e.g. `/#optimalizace-firmy`, back button and Esc close) with selected work and a
  link to the service page (automation → `/sluzby/automatizace/`). Reduced motion / no WebGL / no JS:
  a static DOM stack and every service listed with its own link; three.js is never downloaded there.
  Below the hero: selected work, partners, Ice CTA; faint stream.
- impeccable detector: 0 findings on every route (CS + EN, 1280 and 390).

## New copy (needs Honza's approval)
- **Graphite canvas (Oct 29)**: "Jak to do sebe zapadá." + its lead (`home.json` workflow.sectionTitle/sectionLead), node "Jak to zapadá" / Workflow / Běží.
- **Redesign canvas (Oct 29)**: node bars (`home.json` → `canvas`: Služby/Akce, Realizace/Historie běhů, Partneři/Integrace, Nová poptávka/Spouštěč; Čeká/Hotovo/Úspěch/Připojeno/Připraveno), header "Workflow aktivní" and "Spustit poptávku" (`chrome.json` nav.live, nav.run), case run status "Úspěch" (`services.json` service.runOk).
- **Redesign (branch `redesign`, Oct 29) workflow hero** (`home.json` → `workflow`): file stamp ("Spis 0001 · Jak to u vás poběží"), "Vaše firma dnes" + its three pains, "Firma, která běží" + its four results, "Otevřít". Node results reuse `homeNumbers.ts` (1 200 h and 14 dní are still placeholders).
- Automation page: hero pill and sub, "Kde mizí hodiny." + the three card bodies, the scene labels
  (Účetní / Obchod / Schválení, Návrh odpovědi / Odeslat), the window texts (file name, node labels,
  log statuses), workflow grid labels, statement ("Většina práce je rutina. ..."), tools heading.
- Homepage card stack: "Celá stránka služby" / "Full service page" (panel link); the stack's screen-reader
  label. (The value cards, `components/home/04-values.astro`, are not used on any page right now.)
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
- Naming: the nav says "Automatizace a AI" / "Automation & AI" (as asked); the approved service title in
  cards, footer and filters is still "AI a automatizace" / "AI and automation". Pick one.
- Optional extras not built yet: first-visit logo intro (0–100 count folding into the nav logo), mid-page
  logo plate opening into a statement panel, brand-moment image (slot ready: `ui/BrandMoment.astro`).
