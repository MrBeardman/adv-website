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
- **GEO / SEO layer (Nov 4)** (`src/i18n/geo.json`, CS + EN; research and reasoning in `docs/GEO.md`):
  - "V kostce" / "In short" block (`components/Plain.astro`) on the automation page, the three service pages
    and the about page: one plain paragraph (what, for whom, where, on which systems) + four facts. Names
    Pohoda, Fakturoid, Shoptet, Shopify, n8n, Make, OpenAI, Claude, WordPress, Astro; "Praha, celé Česko a
    Německo"; "česky, anglicky, německy"; references Laser Arena Praha, HomeStyle, Kesia.
  - "Otázky a odpovědi" / "Questions" (`components/Faq.astro`) on the homepage (6) and every service page
    (6–8): phrased as buyers ask. CLAIMS TO CONFIRM: price bands (menší automatizace do 80 000 Kč; nástroj,
    web, prototyp 80–250 000 Kč; propojený systém nad 250 000 Kč = the inquiry budget bands), "mapování
    procesů 2–3 dny", "první verze do 2–3 měsíců", "kód a data patří vám", "evropské servery, kde to jde",
    "n8n na vlastním serveru", "dlouhodobou správu kampaní neděláme", "mluvíme česky, anglicky, německy".
  - Service page titles + meta descriptions (`geo.json` → `meta`), e.g. "Automatizace firemních procesů a AI
    pro firmy · ADV Innovations".
  - Automation page H1: "Faktury, dotazy, objednávky. / Běží samy." (typewriter: samy. / automaticky. / bez
    přepisování.), EN "Invoices, enquiries, orders. / Run themselves." (`automation.json` hero). It shared the
    homepage H1 before.
  - Company description + `knowsAbout` list in the schema and `/llms.txt` (`geo.json` → `company`);
    founder "Jan Matyáš" in the schema (`data/seo.ts`).
  - About facts: "Vede ji Jan Matyáš; tým má přes deset let zkušeností…" (from the 13-years stat), partners
    with their categories.
- **Own products as cases (Nov 1, DRAFT, dev only)** (`caseStudies.ts`: `dreamshape`, `finance-tracker` "Rodinné finance",
  `freelance-os`): outcome, situation, four approach steps, three results each, from the repos. MY ASSUMPTIONS to confirm:
  DreamShape "before" (training app + calorie app + habits on paper → "3 → 1"); Freelance OS "before" (spreadsheet,
  notes, time tracker, email) and "v každodenním provozu"; whether "Rodinné finance" may name Zuzka/the household.
  Finance tracker "before" is from its PLAN.md (real). Need screenshots without private data for all three.
- **HomeStyle case (Nov 1, new page, published on request)** (`src/i18n/homestyle.json`, CS + EN, `templates/HomeStyle.astro`, case
  `homestyle` in `caseStudies.ts`, status `published`, state `in-progress`): title "Showroom, který si majitel konečně řídí
  sám.", sections: the seven product tabs (hero), a web where the owner could set nothing (six locks), old vs new homepage,
  what we built (needs ticked off), the admin, the catalogue, "the move continues and so does support", where we are now.
  Numbers: 151 products and 8 brands from the admin on Nov 1 2026 (the owner is still moving products over, so they
  grow), ~150 ms = measured server response of the new site on its staging address (147 ms). NO savings are claimed:
  none were supplied. The old site's agency/CMS is deliberately not named. Screens are from the real admin and the
  staging site (the client's name and an in-progress draft were kept out of the shots). Open before publishing: client
  approval to be named, go-live on homestyle.cz, real before/after numbers (time saved, enquiries), a quote, and the
  security clean-up on the staging site (PHP backups under uploads, "admin" user, headers) before any security claim.
- **Laser Arena Praha case (Nov 1, new page)** (`src/i18n/laser.json`, CS + EN, `templates/LaserArenaPraha.astro`, case in
  `caseStudies.ts`, published): title "Rezervační systém, který si majitel konečně upraví sám.", lead, six sections (web nobody
  could change, we listened, built to be changed, bookings run themselves, support for years, what changed). Numbers are
  the owner's rounded estimates told to Honza: ~+60 % bookings (months since launch vs the same months last year on the old
  site), ~10 h a week saved; "~18 requests" is counted from the booking plugin's changelog (two feedback rounds). The index
  bar (100 / ~160) is the same 60 % drawn to scale. Launch is "léto 2026" (exact month unconfirmed). Open: client quote,
  screenshots (booking steps, staff screen, admin tabs, old Joomla site), confirm what the ~10 h consists of.
- **Service pages (Oct 30)** (`src/i18n/serviceDeep.json`, CS + EN, used by `templates/Service.astro` for Weby,
  Optimalizace firmy, Prototypy a software): section labels (Jak začínáme, Kde to uniká, Co stavíme, Realizace,
  Poptávka), per service "how we start" (title, lead, 3 steps), "where it leaks" (title, lead, 6 problems with what
  they cost and what we do), "what we build" (6 items), inquiry heading "Popište nám, co řešíte." + lead. No numbers.
- **Hero sub (Oct 30, lab/frameless, chosen by Honza)** (`chrome.json` hero.sub): CS "Jeden propojený systém pro vaši
  firmu: automatizace, software na míru, prototypy a weby, které prodávají." EN "One connected system for your business:
  automation, custom software, prototypes and websites that sell."
- **Services heading (Oct 30, lab)** (`services.json` capabilities.title): "Co pro vaši firmu postavíme." / "What we build
  for your business." (was "Co děláme.").
- **"Funkční prototyp" (Oct 30, lab)** replaces "proklikatelná ukázka" / "klikací demo": software card body, its long
  text, homeNumbers short/label ("do funkčního prototypu"); EN "working prototype".
- **Automation page "Úspora, která každý měsíc roste." (Oct 30, lab)** (`automation.json` growth): replaces the Kesia
  spotlight. ILLUSTRATION, labelled under the chart: a new connection every 2 months, 25 h/month each, 450 Kč/h →
  "~1 050 h" and "~470 000 Kč" in the first year; marker names Faktury, Objednávky, Dotazy, Reporting, Sklad, Schvalování.
- **Kesia case "Úspora rostla s každým e-shopem." (Oct 30, lab)** (`kesia.json` growth): ESTIMATE from the case's own
  results (~700 h, ~340 000 Kč a year for three shops) split per shop and month, shops 2 and 3 joining 2 and 4 months
  after the first, ten months since launch → "~470 h", "~230 000 Kč". Honza to confirm the real connection months and
  the launch month; the 4th shop "Shopify, ve výrobě".
- **Inquiry (Oct 30, lab)**: multiple choice now on process, pain, need, goal and build (classify() joins the ids).
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

## Performance (Nov 1 2026)
PageSpeed (pagespeed.web.dev, no GPU) first run: mobile 50-60 (LCP 3.9-4.1 s, TBT 1.5 s), desktop 65. Causes and fixes:
- Hero copy (`data-reveal`/`data-lines`) waited for site.ts, queued behind three.js: now a CSS-only entrance
  (`HeroFlow.astro`). LCP 4.1 s to 1.6 s.
- Hero scene (`scripts/flow/engine.ts`) booted at load: now after first paint + idle, async shader compile, yields.
- Drift helix (`scripts/flow/drift.ts`, invisible until scroll) now starts on first scroll/wheel/touch/key.
- `scripts/gl.ts`: `failIfMajorPerformanceCaveat` skips both scenes on software-GL (PageSpeed, GPU-less PCs); they get
  the page-without-WebGL look. Flip `REQUIRE_HARDWARE_GL` to run them everywhere (lab score then about 70 mobile).
- Fonts moved to `src/assets/fonts` (hashed `/_astro/` URLs, one-year immutable cache).
Local Lighthouse, software GL: mobile 99, desktop 100. Real GPU mobile still about 71 in the lab (one ~0.3 s
shader-link hitch in the hero scene; simplify the fragment shader if it matters). SEO 69 = preview noindex only.
Re-test on the live URL after each deploy: `npx lighthouse URL --only-categories=performance [--preset=desktop]`,
and with `--chrome-flags="--headless=new --disable-gpu"` to mimic PageSpeed.

## Launch checklist
- [ ] Replace placeholder numbers in `src/data/homeNumbers.ts`: AI **1,200 h** and Software **14 days**
      (`placeholder: true`, dashed outline in dev builds).
- [ ] Savings slider assumptions (46 weeks, 70 %, 450 CZK/h) confirmed or changed (`07-savings.astro`).
- [ ] Tool list confirmed (`02-tools.astro`).
- [ ] About stats (13 years, 50+ projects, 2–50k EUR, CZ/DE) confirmed; team section copy + portraits.
- [ ] Partner URL for Sisu Vision (Alture = alture.io, done; Sisu Vision is still building its site, so its card stays unlinked until it is live); one "together" line per partner (`partners.ts`, about.json).
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
- [ ] **Performance gate (checker agent, after the first full version, before launch)**: run the "Performance gate"
      in the `astro-marketing-site` skill and the section below; record the numbers here.
- [ ] **Flip the preview switch**: `PUBLIC_SITE_INDEXABLE=true`.
- [ ] **GEO after the domain switch** (`docs/GEO.md` §5–6): `https://<domain>/robots.txt` is ours (the
      Hostinger preview domain serves its own, Googlebot disallowed); `curl -A GPTBot -I` returns 200 (the
      preview edge answers 429); `/llms.txt` and `/sitemap-index.xml` reachable; Search Console + Bing
      Webmaster Tools verified and the sitemap submitted; Google Business Profile, Firmy.cz, LinkedIn,
      Clutch profiles created with the schema `description` wording; their URLs in `SAME_AS`
      (`src/data/seo.ts`); the FAQ price bands and policies confirmed (New copy above).

## Open decisions (Honza)
- Headline emphasis: default is the same face in Ice; the Relay-style Instrument Serif italic is one switch
  (`EM_STYLE` in `src/data/site.ts`: 'ice' | 'serif' | 'off'). The impeccable detector flags the serif.
- Logo tile on dark: Ice via `--adv-logo-tile` (brand guide 1.0 says Signal amber; amber is retired).
- Tool list, contact recipient, partner URLs, About stats (above).
- Naming: the nav says "Automatizace a AI" / "Automation & AI" (as asked); the approved service title in
  cards, footer and filters is still "AI a automatizace" / "AI and automation". Pick one.
- Optional extras not built yet: first-visit logo intro (0–100 count folding into the nav logo), mid-page
  logo plate opening into a statement panel, brand-moment image (slot ready: `ui/BrandMoment.astro`).
