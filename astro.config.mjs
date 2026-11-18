// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECURITY_HEADERS } from './security-headers.mjs';

/** Writes dist/_headers.json: the security headers for every prerendered page (read by @astrojs/node). */
function staticSecurityHeaders() {
  return {
    name: 'adv-static-security-headers',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const client = fileURLToPath(dir);
        const pages = [];
        const walk = (d) => {
          for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith('.html')) {
              const rel = path.relative(client, full).split(path.sep).join('/');
              pages.push(
                rel === 'index.html' ? '/' : '/' + rel.replace(/(^|\/)index\.html$/, '/').replace(/\.html$/, '/'),
              );
            }
          }
        };
        walk(client);
        const headers = SECURITY_HEADERS.map(([key, value]) => ({ key, value }));
        const out = path.join(path.dirname(client), '_headers.json');
        fs.writeFileSync(out, JSON.stringify([{ pathname: pages, headers }]));
      },
    },
  };
}

export default defineConfig({
  // TODO (Honza): confirm the canonical domain before launch.
  site: 'https://www.advinnovations.com',
  trailingSlash: 'always',
  // Pages are pre-rendered to static HTML; only /api/* runs on the Node server (contact form).
  output: 'static',
  adapter: node({ mode: 'standalone', staticHeaders: true }),
  build: {
    // Inline all CSS into the HTML: no render-blocking stylesheet requests.
    inlineStylesheets: 'always',
    format: 'directory',
  },
  compressHTML: true,
  security: { checkOrigin: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    staticSecurityHeaders(),
    sitemap({
      // Czech is the default and lives at the root, English under /en/.
      i18n: { defaultLocale: 'cs', locales: { cs: 'cs-CZ', en: 'en-US' } },
      filter: (page) => !page.includes('/api/'),
    }),
  ],
});
