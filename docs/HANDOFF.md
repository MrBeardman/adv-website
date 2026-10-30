# Handoff: where the redesign is and how we work (Oct 30, 2026)

Read this first on a new machine, then `CLAUDE.md` (older, partly superseded: see "What changed" below),
`docs/BRAND.md` and `docs/STATUS.md` (new copy waiting for approval, placeholders, launch checklist).

## Setup on a new PC

1. `git clone https://github.com/MrBeardman/adv-website` (or `git pull` an existing clone). Work on `redesign`,
   publish by fast-forwarding `main` (see "Publishing").
2. `npm install --include=dev` (this machine family has `omit=dev` in the npm config).
3. Build and preview the production build: `npx astro build`, then
   `set HOST=127.0.0.1&& set PORT=4400&& node dist\server\entry.mjs` (cmd) and open http://127.0.0.1:4400/.
   On Honza's main PC `C:\Data\Dev\adv-website-tools\serve.ps1 -Build` does this.
   Do **not** run `npx astro check`: it hangs.
4. `.env` is not in git. The live values live in the Hostinger Node.js app settings; names in `.env.example`.

## Publishing (Honza: "push all changes live straight away")

Hostinger auto-deploys `main` to https://tan-jellyfish-775816.hostingersite.com/ in about 1–2 minutes.
Every finished, locally verified change goes live without asking:

```
git checkout redesign      # commit here
git checkout main && git merge --ff-only redesign && git push origin main && git checkout redesign
```

Never force-push. If the push hangs, the Git credential manager wants Honza to sign in (a browser popup).
Bigger experiments go to a separate worktree/branch first (we used `git worktree add ../adv-website-lab`,
branch `lab/frameless`, served on port 4401) and are merged once Honza likes them.

## The current design direction: "frameless" (Oct 30, 2026)

Honza's brief, in his words: no boxes around sections, "just the background, the label and the heading with
the cards"; cards "premium, slightly blurred background, not totally see-through or solid, so they are
readable"; a few of the hero's lines "separate on scroll and complement the scroll ... in some sort of helix";
"the website itself is the automation".

- **Hero** (`components/home/HeroFlow.astro`, engine `scripts/flow/engine.ts`, three.js): tangled lines pass
  through the ADV "A" and leave as an ordered, multicolour ribbon. The A is a solid graphite extrusion (not
  see-through, no outline) in the site's light (cobalt / navy / violet, ice rim), and it **floats a little and
  catches a drifting gloss**. The pointer is a weak magnet that lets go.
- **Background lines** (`scripts/flow/drift.ts`): a fixed canvas behind the page, three thin ribbons wound as a
  slow helix that turns with scroll, slightly blurred (CSS) so they can be bright. Opt in per page with
  `<Base drift>` (homepage and the automation page have it). Off with reduced motion and without WebGL2.
- **Sections** (`components/ui/NodeFrame.astro`): no frame, bar or ports any more. Each section is the small
  label (icon tile + name, e.g. "Služby") above its heading, then its content, full page width.
  Honza explicitly wanted that label, even though the old rule said "no kickers above headings".
- **Glass** (`src/styles/site.css` tokens `--adv-glass-bg`, `--adv-glass-blur`, `--adv-glass-shadow`, utility
  `.adv-glass`): every card and panel (`.adv-card`, `.adv-panel`, the service cards, workflow board, project
  cards, partner cards, inquiry panel). Sections that are lists sit on a glass panel too, so nothing floats
  loose (Honza: "random spaces around" felt chaotic).
- **Service icons** (`components/ui/ServiceIcon.astro`): drawn on a 32 grid, each animates when its card is
  hovered (AI: data runs down the branches; optimisation: sliders line up; web: page builds, cursor clicks;
  software: layers lift). All tiles use the cobalt → violet fade (`tone="fade"`).
- **Demos in the cards** (`components/ui/Demo.astro`, shown through `ui/Scene.astro`): small HTML/CSS product
  scenes in the SDX-website style, 10 s loops, paused off screen; labels only, no numbers.
  Kinds: ai-automation, business-optimisation, websites, software, routing, assistant.
- **Growth chart** (`components/ui/GrowthChart.astro`): cumulative savings, monotone smooth curve, monthly
  bars, a marker per new connection; used by `components/automation/Growth.astro` (general illustration) and
  the Kesia case (shop by shop). Specific client stories belong on case pages, the service pages stay general.
- **Inquiry** (`components/inquiry/Inquiry.astro`, `scripts/inquiry.ts`, questions in `data/inquiry.ts`):
  starts compact with four big service buttons, the box is as tall as the step it shows and eases between
  heights; several questions are multiple choice.
- **Service pages** (`templates/Service.astro`, copy `i18n/serviceDeep.json`; Weby, Optimalizace, Prototypy):
  head with the coloured icon, demo + three stats, then "Jak začínáme" (getting to know the business), "Kde to
  uniká" (six concrete problems: what it costs, what we do), "Co stavíme", projects, and the inquiry preset to
  the service. The selling angle Honza asked for: we learn their business, find problems they may not know
  about, and fix them to bring more clients and sales.
- **Every page** has the drifting lines now (`Base` `drift` defaults to true) and glass cards/panels.
- **Icons**: Honza picked the coloured (fade) tiles; used on the homepage cards, the inquiry buttons and the
  service page heads.
- **Header**: split CTA "Spustit poptávku" (homepage inquiry) | "Kontakt"; bigger logo.

## Rules that still hold

- No invented numbers presented as fact. Placeholders are marked `placeholder: true` in
  `src/data/homeNumbers.ts` and listed in `docs/STATUS.md`; illustrations say so on the page.
- New copy goes into `docs/STATUS.md` under "New copy (needs Honza's approval)".
- No gradient text, no glow halos. One accent (Ice `--adv-accent`) for live states.
- Client name is "Kesia" only.
- Reduced motion always gets a finished still frame.
- Editing source: no PowerShell Get-Content/Set-Content. Use the Edit tool or Python; write LF line endings
  (`open(p, 'w', encoding='utf8', newline='\n')`). Long Python patches with JSX/backticks are safer written to a
  `.py` file and run, than inline in a bash heredoc (the heredoc broke twice on this).
- Verify with a production build and Playwright screenshots (desktop 1440 and phone 390) before pushing.

## Forms → n8n → Telegram

- Both endpoints store first, then forward: `src/pages/api/inquiry.ts` (kind "inquiry") and
  `src/pages/api/contact.ts` (kind "contact", contact page and the short CTA form), through `src/lib/n8n.ts`
  (env `N8N_INQUIRY_URL`, `N8N_INQUIRY_KEY`; trimmed; the inquiry API answers `why` when a forward fails).
- Stored on the Hostinger server in `data/submissions/` (`inquiries-YYYY-MM.jsonl`, `YYYY-MM.jsonl`).
- n8n workflow "ADV Website - Inquiry Intake" (id `9ytultcdcrouxu2D`) on vmi3112391.contaboserver.net: stores
  every submission in the data table `adv_inquiries`, then posts to Telegram by tier (hot / warm / cold silent
  / contact / unsorted).
- **Open:** Telegram answers "chat not found" for chat `-5295592546` (bot not in the group, or the group became
  a supergroup with a new `-100…` id). Fix the chat id in the five Telegram nodes, then send one test.
- **Open:** delete the test rows "TEST (Claude), ignore" (rows 1 and 2 in `adv_inquiries`) and the matching
  lines in `data/submissions` on Hostinger.

## Open items

- Honza to approve the new copy in `docs/STATUS.md` (hero sub, services heading, card stats, growth sections,
  demo chips) and give real figures for every placeholder (AI card stats, Weby "+30 %", Prototypy "7 dní",
  "3 týdny", "1 systém místo pěti tabulek").
- Kesia: confirm the launch month and when shops 2 and 3 were connected (the growth chart assumes Jan 2026,
  +2 and +4 months).
- Footer tagline still says "…a staví k tomu weby, prototypy…" (the wording Honza dropped in the hero); the
  automation page's process step "Demo" still says "na co se dá kliknout". Rewrite in the new tone.
- The workflow board on the homepage still uses the small line icons (fine as is; swap if wanted).
- About, work list, contact and case pages have the lines and glass but no new content yet; the services
  index could get the same selling sections as the service pages.
- The old stream-of-light code (`scripts/stream.ts`, `scripts/canvas.ts`, `.adv-node`) is unused on the
  homepage and the automation page; remove it once no page needs it.
