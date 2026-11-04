/* robots.txt, generated at build time from the launch switch in data/site.ts.
 *
 * Once indexable, the AI crawlers are allowed by name as well as by the wildcard, so a later "block AI
 * bots" default anywhere upstream is easy to spot and argue with (docs/GEO.md). NOTE: the Hostinger
 * preview domain serves its own robots.txt (Googlebot disallowed) and answers GPTBot with HTTP 429 at the
 * edge; check both on the real domain after launch (STATUS.md launch checklist). */
import type { APIRoute } from 'astro';
import { INDEXABLE } from '../data/site';

export const prerender = true;

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Bingbot',
  'Applebot',
  'Applebot-Extended',
  'DuckAssistBot',
];

export const GET: APIRoute = ({ site }) => {
  const body = INDEXABLE
    ? [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        ...AI_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
        `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
        `# Summary for language models: ${new URL('/llms.txt', site).href}`,
        '',
      ].join('\n')
    : `# Preview: not for search engines yet (PUBLIC_SITE_INDEXABLE is not "true").\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
