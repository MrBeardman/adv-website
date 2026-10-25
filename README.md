# adv-website

The 2026 website of **ADV Innovations** (Prague): automation, AI, websites, prototypes and business
software. Astro 7, static pages + one Node endpoint for the contact form. Czech at `/`, English at `/en/`.

```bash
npm install --include=dev   # this PC has npm omit=dev set
npm run dev                 # http://localhost:4321 (shows drafts and placeholder cases)
npm run build               # dist/ (production rules: published cases only)
HOST=127.0.0.1 PORT=4400 node dist/server/entry.mjs   # serve the build
npm run format              # prettier
```

- Handover for agents: `CLAUDE.md`. Brand: `docs/BRAND.md`. What is done / open: `docs/STATUS.md`.
- Contact form environment: `.env.example` (no values in git). Without `SMTP_HOST` the form stores
  enquiries in `data/submissions/*.jsonl` and sends nothing.
- Content source: `PersonalPortfolio` branch `adv-rebrand` (React). This repo replaces it.
