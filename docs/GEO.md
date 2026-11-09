# GEO + SEO: how ADV gets found and recommended (Nov 4, 2026)

Research and the resulting site changes. GEO = generative engine optimisation: being the company an AI
assistant (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews) names when someone asks it for a
supplier. SEO = the classic search ranking (Google, and Seznam in Czechia). The two overlap almost
completely for a small B2B company: AI assistants read the open web, mostly through Bing/Google-style
search, and quote the pages that state things plainly.

## 1. What the buyers type (Google + Seznam autocomplete, Nov 4 2026)

Pulled from the live suggest endpoints (`suggestqueries.google.com`, hl=cs; `suggest.seznam.cz`). These
are the real phrasings; our headings and the "V kostce" blocks use them.

| Need        | Czech phrasings people actually type                                                                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automation  | automatizace procesů **ve firmě**, automatizace **firemních** procesů, automatizace **podnikových** procesů (Seznam), automatizace **účetních** procesů, robotická automatizace procesů (RPA), automatizace faktur / fakturace, **ai zpracování faktur**, automatizace objednávek (shoptet) |
| AI          | ai pro firmy → **ai agenti pro firmy**, **ai automatizace pro firmy**, **ai asistent pro firmy**, školení ai pro firmy, claude ai pro firmy                                                                                                                                                 |
| Integration | **propojení systémů**, napojení eshopu na pohodu                                                                                                                                                                                                                                            |
| Software    | **vývoj aplikace na míru (praha)**, **webová aplikace na míru praha**, software na míru → vývoj software na míru, **crm na míru (praha)**, interní systém pro firmu, prototyp aplikace, vývoj mvp                                                                                           |
| Web         | **tvorba webu praha**, tvorba eshopu → cena / na míru / shoptet / shopify / praha, kdo mi udělá web / webové stránky, nový web pro firmu                                                                                                                                                    |
| Change      | **digitalizace firmy** (+ dotace, praha)                                                                                                                                                                                                                                                    |

Takeaways: people add **Praha** to software/web queries (Seznam suggests "…na míru praha" for every
software term); they name the systems (**Pohoda, Shoptet**); "optimalizace firmy" is not a search term
(nobody types it; they type the problem: faktury, objednávky, tabulky, propojení); "AI pro firmy" splits
into agenti / asistent / automatizace.

## 2. What the AI assistants answer today (ChatGPT, logged out, Nov 4 2026)

Three buyer prompts, run in Honza's Chrome. ADV is not in any answer (expected: noindex, temporary domain).
What matters is **who wins and why ChatGPT says it picked them**:

1. CZ: "Doporuč mi firmu v Praze, která malé firmě zautomatizuje faktury a objednávky, napojí e-shop na
   Pohodu a postaví k tomu interní systém a web."
   → Adaptis IT (1st), Velupasoft, PragueCoding, apios, XART, WEBZI.
   Reasons given: _"na svém webu popisuje přesně kombinaci funkcí, kterou hledáte"_, named systems
   (Pohoda, Shoptet API), named realised projects, an address, **a published rate** (apios: od 1 500 Kč/h,
   napojení e-shopu od 24 h).
2. CZ: "Hledám firmu v Praze, která nejdřív pochopí náš byznys, pak pomocí AI zautomatizuje rutinu
   (e-maily, doklady, reporting), postaví nám interní systém s jedním dashboardem a nový web. 15 lidí."
   → MATUCHA.DEV (1st), Prahapp, Elementario, Haxo.
   Reasons: _"pojetí jednoho firemního systému, který propojuje data, lidi, automatizace a reporting"_
   (= ADV's own positioning, stated plainly on their site), Prahapp's explicit list + "prototyp zdarma do
   tří pracovních dnů", Elementario's audit → návrh → vývoj process, Haxo's "přes 100 projektů" + Praha 1.
   MATUCHA.DEV's site was in maintenance mode at the time and still won: the model also answers from memory,
   so consistency over time counts.
3. EN: same brief for a 15-person company → Prahapp (1st), INNETIC, Webforte. Reasons: published services
   list that maps 1:1 to the brief, **published prices** (custom internal app 100–200k CZK, AI agent from
   €5,000), free prototype in 3 days, "built by people in Prague", founder contact.

ChatGPT also told the buyer what to ask every supplier: show a working invoice automation on our
accounting software, show an internal dashboard you built, will we own the code, who maintains it,
milestone payments. Our FAQ answers exactly these.

### What the winners' pages have (and ours did not)

|                                                                  | Adaptis IT                    | Prahapp                    | Velupasoft              | ADV before                | ADV now                                                                   |
| ---------------------------------------------------------------- | ----------------------------- | -------------------------- | ----------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Words on the money page                                          | 2 241                         | 1 734                      | 420                     | ~730                      | ~1 200                                                                    |
| Concrete H3s naming the job (faktury, Shoptet API, Pohoda sync…) | 15+                           | 10                         | 6                       | 3 slogans                 | 16–21                                                                     |
| Systems named in body text                                       | Pohoda, Shoptet, GRiT, Retino | ERP, CRM                   | Pohoda, ABRA, Money S3  | none (only inside a demo) | Pohoda, Fakturoid, Shoptet, Shopify, n8n, Make, OpenAI, Claude, WordPress |
| Price or rate                                                    | yes                           | yes                        | no                      | no                        | budget bands (to confirm)                                                 |
| City in body text                                                | no                            | yes                        | yes + schema            | footer only               | yes, every service page                                                   |
| FAQ / "Questions" section                                        | no                            | yes                        | yes                     | no                        | yes (6–8 per page)                                                        |
| Organization schema with description                             | yes                           | ProfessionalService @graph | LocalBusiness + address | minimal Organization      | ProfessionalService + WebSite + Service + FAQPage + BreadcrumbList        |
| llms.txt                                                         | no                            | no                         | (HTML, broken)          | no                        | yes, generated                                                            |

## 3. Where these buyers are

- **Google** (≈75–85 % of Czech search) and **Seznam** (≈12–21 %; B2B owners over 40 still use it).
  Both read the same HTML; Seznam weighs the Firmy.cz listing heavily for "… praha" queries.
- **ChatGPT** (over a third of Czechs have tried it, Ipsos 2025; ~17 % use an AI chatbot daily), Perplexity,
  Gemini/AI Overviews, Copilot. For supplier questions they search the web live (Bing index for ChatGPT),
  then read the candidates' pages and compare them against the brief. Being indexed and **saying the thing
  in words** is the whole game; they also lean on directories for local intent (Yext study, 2026).
- **Directories the models read**: Firmy.cz, Google Business Profile, Clutch (clutch.co/cz), DesignRush,
  Sortlist, GoodFirms, LinkedIn company page, the n8n and Make partner/expert directories.
- **Memory**: models also answer from training data; a stable, consistent description of the company across
  the site, LinkedIn, Firmy.cz and GitHub is what gets remembered.

## 4. What changed on the site (this commit)

- **Plain-language "V kostce" block** (`components/Plain.astro`, copy `i18n/geo.json` → `pages.<key>.plain`)
  on every service page, the automation page and the about page: one paragraph that says what, for whom,
  where, on what systems, in the buyers' words; four facts (Pro koho / Kde / Na čem / Začátek).
- **FAQ "Otázky a odpovědi"** (`components/Faq.astro`, copy `geo.json` → `pages.<key>.faq`) on the homepage
  and every service page: 6–8 questions phrased as buyers ask them (price, time, Pohoda/Fakturoid, Make vs
  n8n, GDPR, who owns the code, can AI err), answer-first, plain HTML (no accordion), plus FAQPage JSON-LD.
- **Structured data** (`data/seo.ts`, emitted by `layouts/Base.astro` as one `@graph`): ProfessionalService
  (#org: description, address + postal code, areaServed CZ/Praha/DE, knowsLanguage, knowsAbout, founder,
  `SAME_AS` profiles, empty until Honza adds them), WebSite, per service a `Service` (serviceType = the
  autocomplete phrasings, provider → #org), BreadcrumbList, FAQPage.
- **Titles and descriptions** per service (`geo.json` → `meta`): "Automatizace firemních procesů a AI pro
  firmy · ADV Innovations" etc., city and systems in the description. The generic pages used the one-line
  card text before.
- **Unique H1 on the automation page** ("Faktury, dotazy, objednávky. Běží samy." / "Invoices, enquiries,
  orders. Run themselves."): it shared the homepage's H1 before (`01-hero.astro` `headline` + `typeWords`).
- **`/llms.txt`** (`pages/llms.txt.ts`), generated from the same data: company, services, FAQs, published
  cases, pages; Czech then English.
- **robots.txt** (`pages/robots.txt.ts`): once indexable, the AI crawlers are allowed by name (GPTBot,
  OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot, Applebot…), sitemap and llms.txt
  pointers.

Not changed: the design (the new sections use the existing node label, glass panel and h2/h3 styles), the
hero copy on the homepage, the service "Kde to uniká" sections.

## 5. Findings on the preview host (fix at launch)

- The Hostinger temporary domain serves **its own robots.txt** (`User-agent: Googlebot / Disallow: /`), not
  ours, and answers **GPTBot with HTTP 429** at the edge (PerplexityBot and ClaudeBot get 200). After the
  domain switch: open `https://<domain>/robots.txt` and confirm it is ours; `curl -A "GPTBot" -I` must give
  200; in hPanel check CDN "bot protection / Under Attack" settings (Hostinger's article on AI crawlers).
- Since Nov 9 2026 the site is indexable by default (`PUBLIC_SITE_INDEXABLE=false` = preview build, STATUS.md).

## 6. Off-site checklist (Honza; nothing on the site can replace this)

1. **Google Business Profile** for ADV Innovations, Rybná 234/20: category "Software company" +
   "Website designer", services listed with the same wording as the site, 5+ reviews from real clients
   (Kesia, Laser Arena Praha, HomeStyle).
2. **Firmy.cz** listing (Seznam): category "Vývoj software na zakázku" + "Tvorba webových stránek", tags
   automatizace procesů, AI, Pohoda, Shoptet. Same description as the schema `description`.
3. **LinkedIn company page** with the same one-liner; Honza's profile headline naming ADV.
4. **Clutch / DesignRush / GoodFirms** profiles (free) with 2–3 verified client reviews: ChatGPT's EN answers
   quoted Clutch-style profiles.
5. **n8n Experts / Make Partner** directories (ADV builds on both; the directories are crawled and quoted).
6. **Case studies on the clients' side**: a line on Laser Arena Praha's and HomeStyle's sites ("web a
   rezervace: ADV Innovations") with a link; one LinkedIn post per case with the client tagged.
7. **GitHub org** `ADV Innovations` with public descriptions; **Wikidata** item (name, country, website,
   founder) once there is press.
8. Add every live profile URL to `SAME_AS` in `src/data/seo.ts`.

## 7. Monitoring (monthly, 15 minutes)

Run the three prompts from §2 (plus one per service: "kdo mi udělá rezervační systém pro laser arénu v
Praze", "napojení Shoptetu na Pohodu firma Praha", "vývoj interního systému pro malou firmu Praha") in
ChatGPT, Perplexity, Gemini and Google (AI Overview). Log: named? position? which page quoted? Also Search
Console: queries containing "praha", "pohoda", "shoptet", "automatizace". Expect first appearances 2–6 weeks
after indexing for the live-search engines; longer for answers from memory.

### Log

| Date  | Prompt                                                | 1st                                          | Also                                                    | ADV? | Note                                                                                   |
| ----- | ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------- |
| Nov 4 | CZ faktury + Pohoda + interní systém + web            | Adaptis IT                                   | Velupasoft, PragueCoding, apios, XART, WEBZI            | no   | preview, noindex                                                                       |
| Nov 4 | CZ pochopí byznys, AI rutina, dashboard, web, 15 lidí | MATUCHA.DEV                                  | Prahapp, Elementario, Haxo                              | no   | preview, noindex                                                                       |
| Nov 4 | EN same brief, 15 people                              | Prahapp                                      | INNETIC, Webforte                                       | no   | preview, noindex                                                                       |
| Nov 9 | CZ faktury + Pohoda + interní systém + web            | Velupasoft                                   | Adaptis IT, NETservis, AKSYSTEM                         | no   | live 4 days but still noindex (switch not set); map card from Google Business profiles |
| Nov 9 | CZ pochopí byznys, AI rutina, dashboard, web, 15 lidí | MATUCHA.DEV ("Company OS")                   | INNETIC, KOALA42, Bolder Studio (prices from 20 000 Kč) | no   | same                                                                                   |
| Nov 9 | EN same brief, 15 people                              | Prahapp ("free prototype in 3 working days") | eValue                                                  | no   | same                                                                                   |

Nov 9 reading: the winners did not change; the reasons did not change (plain service lists, named systems, a
published price or a free prototype, a Google Business profile with reviews that feeds the map card). ADV was
not indexable until Nov 9, so no engine could have it yet. Next run: early December, after Search Console
shows the pages indexed and the Google Business profile exists.

## 8. Open for Honza

- **Live-site findings (Nov 9)**: `https://advinnovations.com/` (no www) answers 200 instead of redirecting
  to the canonical www host: set a 301 in hPanel (Websites → advinnovations.com → Redirects, or "force www").
  Submit `https://www.advinnovations.com/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools
  (Bing feeds ChatGPT's search). Spoofed Googlebot/Bingbot user agents get 403 from Hostinger's bot check;
  real crawlers come from verified IPs, so confirm with "URL inspection" in Search Console rather than curl.
  No analytics or cookies are set, so no consent banner is needed; if analytics is wanted, a cookieless one
  (Plausible, Umami) keeps it that way.
- Price bands in the FAQs (under 80 000 / 80–250 000 / over 250 000 Kč) reuse the inquiry budget bands
  (`data/inquiry.ts`, still a first guess). Confirm or change: ChatGPT rewards a published range, but it must
  be one you will honour.
- "Kód a data patří vám", "evropské servery kde to jde", "mapování 2–3 dny": written as policy; confirm.
- Delivery times (decided Nov 4 evening, see STATUS.md "New copy"): prezentační web do 3 dnů, prototyp do
  7 dnů (Honza); první automatizace do 7 dnů, napojení od 24 h (= Adaptis / apios, "match the fastest");
  e-shop first version 7 days + software first version 3 weeks still to confirm. One number per promise,
  everywhere (geo.json, services.json, serviceDeep.json, homeNumbers.ts): a model that reads two different
  numbers trusts neither.
- WordPress and Shoptet stay in the copy (the queries are typed a lot), framed as "umíme, stavíme na míru,
  ale doporučíme vlastní řešení": keeps the match, states the real offer, and is a niche no winner claims.
  Follow-up: a post "Proč nestavíme nový web na WordPressu" for the comparison queries ("wordpress nebo…").
- The automation page's new H1 (replaces the homepage headline there).
- `SAME_AS` profile URLs; founded year and team size for the about facts (not stated anywhere, so not claimed).
- Niche: the research says the winners are the ones that name a system and a job ("Shoptet → Pohoda",
  "faktury → schválení → Pohoda"). The site now names them; a dedicated page per integration (e.g.
  `/sluzby/automatizace/shoptet-pohoda/`) would be the next step if Honza wants to niche down.

Sources: Google/Seznam suggest endpoints (Nov 4 2026); ChatGPT logged-out runs (Nov 4 2026, screenshots of
the answers are in the session only, re-run to reproduce); Ipsos/Charles University (ChatGPT use in CZ,
2025); Yext AI citation study (Jan–Mar 2026); Orbit Media LLM citation study (13 184 citations); Hostinger
"How to allow or block AI crawlers" support article; competitor pages adaptis.cz, prahapp.cz, velupasoft.cz,
apios.cz fetched Nov 4 2026.
