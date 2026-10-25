// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // TODO (Honza): confirm the canonical domain before launch.
  site: 'https://www.advinnovations.com',
  trailingSlash: 'always',
  // Pages are pre-rendered to static HTML; only /api/* runs on the Node server (contact form).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  build: {
    // Inline all CSS into the HTML: no render-blocking stylesheet requests.
    inlineStylesheets: 'always',
    format: 'directory',
  },
  compressHTML: true,
  security: { checkOrigin: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      // Czech is the default and lives at the root, English under /en/.
      i18n: { defaultLocale: 'cs', locales: { cs: 'cs-CZ', en: 'en-US' } },
      filter: (page) => !page.includes('/api/'),
    }),
  ],
});
