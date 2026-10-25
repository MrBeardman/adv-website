# CLAUDE.md: adv-website

Handover for Claude Code agents. Read this first, then `README.md`, `docs/BRAND.md`, `docs/STATUS.md`.

## What this is
The 2026 website of **ADV Innovations** (Prague; Jan "Honza" Matyáš). Replaces the React site in
`C:\Data\Dev\PersonalPortfolio` (branch `adv-rebrand`), which stays as the content source and reference
(its `/preview/*` 3D experiments are not ported: Honza found code-made 3D too clean).
Built on Alture's Astro stack, the same as `sdx-website` and `jenomics-website`
(`C:\Data\Work\Jenomics\JenomicsWebsite`, read only), following the `astro-marketing-site` skill.

- Local repo only: `C:\Data\Dev\adv-website`, branch `main`, **no remote**. Never push, never deploy, never
  create a GitHub repo unless Honza asks. Don't touch `.env` files or credentials.
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
  `flowGrid.ts` (hero grid engine from the palette study), `count.ts`, `form.ts`.

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
