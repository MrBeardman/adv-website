# CLAUDE.md: adv-website

Handover for Claude Code agents. **Start with `docs/HANDOFF.md`** (current design direction, how we publish,
open items; it supersedes the homepage and stream notes below), then this file, `README.md`, `docs/BRAND.md`,
`docs/STATUS.md`.

## What this is
The 2026 website of **ADV Innovations** (Prague; Jan "Honza" Matyáš). Replaces the React site in
`C:\Data\Dev\PersonalPortfolio` (branch `adv-rebrand`), which stays as the content source and reference
(its `/preview/*` 3D experiments are not ported: Honza found code-made 3D too clean).
Built on Alture's Astro stack, the same as `sdx-website` and `jenomics-website`
(`C:\Data\Work\Jenomics\JenomicsWebsite`, read only), following the `astro-marketing-site` skill.

- Repo `C:\Data\Dev\adv-website`, branch `main`, remote https://github.com/MrBeardman/adv-website.
  Hostinger preview URL: **https://tan-jellyfish-775816.hostingersite.com/** (temporary domain).
  Hostinger auto-pulls `main`, so **every push goes live on the preview**: push only at verified, presentable
  milestones, never force-push. Don't touch `.env` files or credentials.
- **Preview phase = noindex, FLIP AT LAUNCH**: `src/data/site.ts` `INDEXABLE` reads
  `PUBLIC_SITE_INDEXABLE` (build time). Not "true" → every page `noindex, nofollow`, `robots.txt`
  (`src/pages/robots.txt.ts`) disallows all. Set `PUBLIC_SITE_INDEXABLE=true` in Hostinger at launch.
- Page roles (Honza, Oct 2026): the Relay-style rich page is the **Automation & AI service page**
  (`templates/Automation.astro`, `/sluzby/automatizace/`, `/en/services/automation/`). The **homepage** is the
  old ADV 3D card stack rebuilt in Astro (`components/home/CardStack.astro`; engine in `scripts/stack/`:
  `HeroSceneGL.js` ported from PersonalPortfolio with "ADV:" notes, `controller.ts` replaces Hero.jsx).
  Vanilla three.js + gsap, dynamically imported; no React. Test: `adv-website-tools\stack.py` (drag, swipe,
  open/close, keys, deep link, blow-out guard at the extreme drags). Services with `rich: true` in
  `capabilities.ts` have their own route file.
- Card faces never blow out: `HeroSceneGL.js` caps the reflected light on a face (`LIT_MAX`, `COAT_MAX`,
  opening to `EDGE_MAX` at grazing angles; emissive text and rim sit on top) and eases the drag turn into
  `DRAG_TILT_MAX`. Raising those brings the white-slab bug back; `blowout.py` / `stack.py` measure it.
- **Homepage hero background** = the "breathing floor" + thin "light runners" (Honza's picks B and A from
  `ADV\inspo\adv-hero-bg.html`, runners as pure lines: no glowing heads or crossings), one canvas, one loop:
  `scripts/heroBg/` (runner `index.ts`, effects `breath.ts`, `runners.ts`). **All knobs in
  `scripts/heroBg/tuning.ts`**: `HERO_BG.effects` (draw order; remove one to switch it off), `strength`
  (1 = approved look), `fps` (60), `baseGrid`, `lens`, `copyDim` (dim behind the copy column,
  `[data-herobg-dim]`); `BREATH.period` (9 s/pass), `peak` (.32), `shoulder`, `falloff` (.3), `fill` (.28),
  `sparkle`, `still` (reduced-motion frame); `RUNNERS.count` (6), `mouseRate`, `max`, `width` (1.2 px),
  `alpha` (.7 at the head), `speed` (140-260 px/s), `tail` (150 px), `turn` (.22 per crossing), `life`
  (2.5-5 s), `fadeIn`/`fadeOut`, `avoidPad` (no spawns near the copy). Reduced motion: breathing floor still
  frame, no runners. Another effect = a file exporting a `BgEffect` + one line in `EFFECTS`.
  Test: `bandseq.py`, `fps_bg.py`. The automation page keeps `flowGrid.ts`.
- Tools and screenshots: `C:\Data\Dev\adv-website-tools` (`serve.ps1`, `shoot.py`, `commit.ps1`, ...).
- Honza's preview: `http://127.0.0.1:4400` (`node dist/server/entry.mjs`, HOST/PORT env), restarted by
  `adv-website-tools\serve.ps1 [-Build]`.
- `npm install --include=dev` (npm `omit=dev` is set globally on this PC).

## Architecture
- Astro 7, `output: 'static'` + `@astrojs/node` standalone. Only `src/pages/api/contact.ts` runs on the server.
- `build.inlineStylesheets: 'always'`, `trailingSlash: 'always'`, `format: 'directory'`, sitemap with i18n
  (`cs` default at the root, `en` under `/en/`). Domain in `astro.config.mjs` is a TODO.
- One template per page in `src/templates/`; route files in `src/pages/` only pass `lang` (and a slug).
- Texts: `src/i18n/<area>.json` as `{ "cs": {...}, "en": {...} }`; `pick()` falls back to Czech.
  `chrome` (meta, nav, footer, hero headline), `home` (new homepage copy), `services`, `work`, `kesia`,
  `about` (+ partners), `contact`, `form` (API messages). Data-file text is `{ en, cs? }` read with `loc()`.
- Data: `src/data/capabilities.ts` (services + the ONE `enabled` switch; graphic design is off),
  `routes.ts` (every URL per language + the old-URL map), `caseStudies.ts` (status rules!),
  `homeNumbers.ts` (headline numbers, placeholder flags), `partners.ts`, `logoPaths.ts`.
- Sections: `src/components/home/NN-name.astro`, shared ones in `src/components/`, small UI in `components/ui/`.
  Each has its own `<style is:global>` with the `adv-` prefix, and a small vanilla script where needed.
- `src/styles/site.css`: tokens, base, background layers, buttons, links, matte card, kickers, stream,
  reveal/lines/lit, forms, shared inner-page bits, reduced motion. `fonts.css`: @font-face.
- Scripts: `site.ts` (reveal, lines, lit words, header + drawer, live-scene pausing, spotlight, count-ups,
  play-once charts, typewriter, background progress, kickers), `stream.ts` (stream of light),
  `flowGrid.ts` (automation hero grid engine from the palette study), `heroBg/` (homepage hero background),
  `count.ts`, `form.ts`.

## Rules that matter
- **Case visibility**: `published` everywhere; `draft` and `placeholder` only in `astro dev`
  (`import.meta.env.DEV`). Placeholders are invented companies: never in a production build.
  Today production has one case page: `kesia-live-pricing`.
- **Kesia naming**: "Kesia" only; the shops are "three e-shops". Every Kesia number keeps its footnote.
- **Numbers**: only from `homeNumbers.ts`; `placeholder: true` ones get a dashed outline in dev and are on
  the launch checklist in `docs/STATUS.md`.
- **Graphic design** is hidden: `enabled: false` in `capabilities.ts` (copy kept in `services.json`).
- New copy goes into `docs/STATUS.md` → "New copy" for Honza's approval.
- No amber on the site; the accent is Ice. Logo tile colour is one variable (`--adv-logo-tile`).
- Section nodes, not kickers: no small uppercase label above headings (the impeccable detector bans it).
  A section's node is `<Node />` as the heading's first child (or `<Node panel />` before a padded panel);
  the stream rail runs through all `.adv-node`s. No coloured glow shadows (use gradients), no infinite
  pulsing dots or marquees, body text ≥ 12px. Keep the detector at 0.
- Headline emphasis: `.adv-em`, style switch `EM_STYLE` in `src/data/site.ts`.

## Gotchas (from the skill and this build)
- `[data-reveal]` overrides an element's own transitions: site.ts removes it after the reveal.
- `overflow: hidden` breaks `position: sticky`; use `overflow: clip`.
- No `box-shadow` inside `preserve-3d`. The hero window uses a plain transform + perspective on its parent.
- Fixed background layers do not show in Playwright full-page screenshots below the first screen; judge
  the background in viewport shots.
- **Never edit source files with PowerShell `Get-Content`/`Set-Content`**: it reads UTF-8 as cp1250 and
  writes a BOM (this broke Czech characters once). Use the editor tools or Node.
- When restarting the server, `serve.ps1` only stops `node.exe` running `dist/server/entry.mjs`.
- Prettier reflows templates; re-check inline spacing in built HTML after `npm run format`.

## Verify before handing over
1. `npm run build`; `npm run check:format`.
2. `serve.ps1`, then `python shoot.py shots\<run> all [mid]` (1440 + 390, fold, full, mid-scroll; prints
   console errors and the 390 scrollWidth).
3. `python verify.py` (curls every CS + EN route, POSTs the contact API valid / invalid / honeypot).
4. Reduced motion and no-JS: `python modes.py`.
5. impeccable detector: `detect.ps1` (0 findings).
