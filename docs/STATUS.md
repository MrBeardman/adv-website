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
- **Hero sub (Oct 30, lab/frameless, chosen by Honza)** (`chrome.json` hero.sub): CS "Jeden propojený systém pro vaši
  firmu: automatizace, software na míru, prototypy a weby, které prodávají." EN "One connected system for your business:
  automation, custom software, prototypes and websites that sell."
- **Services heading (Oct 30, lab)** (`services.json` capabilities.title): "Co pro vaši firmu postavíme." / "What we build
  for your business." (was "Co děláme.").
- **"Funkční prototyp" (Oct 30, lab)** replaces "proklikatelná ukázka" / "klikací demo": software card body, its long
  text, homeNumbers short/label ("do funkčního prototypu"); EN "working prototype".
- **Automation page demos (Oct 30, lab)** (`automation.json` uses.scene): new chips "Přiděleno" / "Assigned" and
  "Odesláno" / "Sent".
- **Service card stats (Oct 30, lab)** (`homeNumbers.ts` → `more`, two per service). PLACEHOLDERS, replace before launch:
  AI "85 % dokladů bez ruční práce", "6 procesů běží samo"; Weby "+30 % tržeb z webu"; Software "7 dní do funkčního prototypu" (was 14), "3 týdny do první verze
  v provozu", "1 systém místo pěti tabulek". Real: Kesia "3 e-shopy s živými cenami", "0 ručně přepsaných cen"; Studio
  Fit "2 měsíce od spuštění".
- **Inquiry flows (Oct 29)**: every question and option per service in `src/data/inquiry.ts` (CS + EN) and the flow texts in `src/i18n/inquiry.json`. Budget bands (80k / 250k / 800k Kč; EUR 3k / 10k / 30k) are a first guess: confirm. Priority weights (size .35, urgency .35, budget .3; hot ≥ 62, warm ≥ 35) in `classify()`.
- **Showcase (Oct 29)**: "Přečíst případovou studii" (`services.json` service.readCase). Studio Fit screens are captures of the live site (Oct 29); **Kesia Praha has no flat screenshots yet**, so it shows as a plain row until it gets `screens` in caseStudies.ts.
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

- **Service demos** (`i18n/home.json` → `values.scene.demo`, shown in ui/Demo.astro): labels only, no
  numbers. CS: Příchozí; Účetnictví / Sklad / Podpora; faktura.pdf, objednavka.xlsx, dotaz.eml; Vše roztříděno;
  Schválení faktury; Automatizovat; Excel / E-mail / Tisk / Podpis / Archiv; Automaticky; vasefirma.cz;
  Rezervovat; Nová rezervace; Nové / Řeší se / Hotovo; Zakázka; Uloženo. EN equivalents alongside.
- **Header CTA** is now a split pill: "Spustit poptávku" (homepage inquiry flow) | "Kontakt" (contact page).

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
- [ ] **Inquiry n8n workflow**: own `X-ADV-Key` credential set, Telegram group -5295592546 set, workflow active
      (Oct 29). Test run stored row 1 in `adv_inquiries` ("TEST (Claude), ignore": delete it) but Telegram said
      "chat not found": **add the bot behind n8n's "Telegram account" credential to the group**. Then set
      `N8N_INQUIRY_URL` / `N8N_INQUIRY_KEY` in Hostinger. Original steps: "ADV Website - Inquiry Intake" (https://vmi3112391.contaboserver.net/workflow/9ytultcdcrouxu2D,
      created inactive Oct 29): (1) give the webhook its own Header Auth credential, header name `X-ADV-Key`
      (n8n auto-assigned the content queue's "Queue API Key"); (2) put the Telegram chat ID for inquiries in the
      four Telegram nodes; (3) activate; (4) in Hostinger set `N8N_INQUIRY_URL` =
      https://vmi3112391.contaboserver.net/webhook/adv-inquiry and `N8N_INQUIRY_KEY` = the same secret.
      Stores into the n8n data table `adv_inquiries`; the site keeps its own copy in data/submissions either way.
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
