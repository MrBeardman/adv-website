/* robots.txt, generated at build time from the launch switch in data/site.ts. */
import type { APIRoute } from 'astro';
import { INDEXABLE } from '../data/site';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const body = INDEXABLE
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`
    : `# Preview: not for search engines yet (PUBLIC_SITE_INDEXABLE is not "true").\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
