# ADV Innovations brand on the web (2026)

Source: ADV brand guide 1.0 (`C:\Data\Work\Personal\ADV\brand`), the palette study Honza picked
(`ADV\inspo\adv-palette-study.html`, palette "Studio" + accent Ice) and the Relay reference
(`ADV\inspo\relay-*`). Decisions locked by Honza in October 2026 unless marked open.

## Direction
Clean site, made premium through palette, finish, gradients and precise HTML/CSS motion. No code-made 3D
(it read as "vibe coded"). Relay is the main reference: one continuous stream of light through the page,
sections as nodes on it, a tilted glass window with a live workflow in the hero.

## Colour (tokens in `src/styles/site.css`)
| Token | Value | Use |
| --- | --- | --- |
| `--adv-bg` | `#090a0e` | page |
| `--adv-bg-2` | `#0e1016` | node fills, inner surfaces |
| `--adv-surface-1` → `--adv-surface-2` | `#181b24` → `#0b0c11` | matte card gradient |
| `--adv-edge` / `--adv-edge-hi` | `rgba(255,255,255,.09)` / `.26` | hairlines / lit inset edge |
| `--adv-line` | `rgba(255,255,255,.055)` | dividers |
| `--adv-text` / `--adv-muted` | `#f1f2f5` / `#9298a8` | text |
| `--adv-glow` | `rgba(32,64,170,.30)` | navy light behind key areas |
| `--adv-spot` | `rgba(64,104,235,.22)` | card hover spotlight |
| `--adv-accent` | Ice `#7cc8ff` (rgb 124,200,255) | the one accent: CTAs, live states, stream |
| `--adv-on-accent` | `#07101e` | text on Ice |

- **Amber is retired on the site** (it read as construction machinery). The only warm colour left is the
  dashed outline that marks placeholders in development builds.
- **Logo tile on dark = Ice, through ONE variable** `--adv-logo-tile`. Brand guide 1.0 says Signal amber;
  pending Honza's confirmation (STATUS.md, open decisions).
- Background: a dark mesh (#0b0c10, #1b1f2b, #2b3245, #181a20, #1f3fae, a touch of Ice) with fine grain, in
  fixed layers. It is **progressive**: cooler navy/Ice at the top, deeper in the middle, a little warmer and
  lighter near the final CTA (`--p` from `site.ts`, 0 → 1 with scroll).

## Type
- **Urbanist** 500/600/700: display and headings (tight tracking, -0.02 to -0.035em).
- **Manrope** 400/500/600: body and UI.
- **JetBrains Mono** 400/500: labels, kickers, data, the workflow window.
- **Optional emphasis**: Instrument Serif italic on at most one word per major headline (`.adv-em`),
  switchable in one place: `<html data-em="urbanist">` (Urbanist italic) or `data-em="off"`. Open decision.
- Self-hosted from @fontsource, latin + latin-ext; Czech pages preload latin-ext.

## Finish
- **Matte card** (`.adv-card`, from the palette study): soft gradient, faint top sheen, inset lit edge,
  deep soft shadow. Hover: navy spotlight follows the pointer, an Ice hairline lights the edge near it,
  the divider (`.adv-rule`) grows. `.adv-panel` is the same finish without hover.
- Radii: buttons 12px, cards 22px, big panels 28px.
- Glass only in the hero window (backdrop blur over the grid).

## Motion vocabulary
Calm and precise, no bounce. Ease `cubic-bezier(.23,1,.32,1)`.
- Sections arrive blur → sharp with a slight rise (`[data-reveal]`); headline line reveals (`[data-lines]`).
- Scroll-lit statement words (`[data-lit]`); count-ups (`[data-count]`); thin drawn charts (`[data-play]`).
- The stream of light (`scripts/stream.ts`): Ice/navy filaments on a rail, each section kicker is a node
  that lights and ticks as the light passes, ending in the Ice CTA panel.
- The breathing workflow grid in the hero (`scripts/flowGrid.ts`), kept clear of the text and window.
- Micro: underline draw-in on links, arrow nudge, light sweep on primary buttons, press scale 0.98, Ice
  focus rings. The card spotlight is the only pointer-following effect.
- Reduced motion: everything visible, no loops, scenes show their final frame. No JS: all content visible.

## Logo
`src/components/ui/Logo.astro`, geometry in `src/data/logoPaths.ts` (from the brand files). The A is always
a cut (evenodd), never filled. Horizontal logo never narrower than 120px; below that, the symbol.

## Naming rules
- The Kesia client is **"Kesia"** only. Never the shop brands (Oro Praha, Aurum Brno, ...); the shops are
  "three e-shops" (Prague, Brno, Hradec Králové).
- Numbers: only checkable ones. Invented numbers are flagged `placeholder: true` in `src/data/homeNumbers.ts`
  and must be replaced before launch (STATUS.md, launch checklist).
