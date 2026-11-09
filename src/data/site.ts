/**
 * One-word headline emphasis (.adv-em): 'ice' = same face in Ice (default), 'serif' = Instrument Serif
 * italic (the Relay look; open decision for Honza), 'off' = no emphasis.
 */
export const EM_STYLE: 'ice' | 'serif' | 'off' = 'ice';

/**
 * THE switch for search engines. Live since Nov 2026 on www.advinnovations.com, so the default is
 * indexable. For a preview build set PUBLIC_SITE_INDEXABLE=false in the build environment: every page then
 * carries <meta name="robots" content="noindex, nofollow"> and robots.txt disallows everything. Read at
 * build time (a change on Hostinger needs a rebuild). Before Nov 9 2026 it was the other way round
 * ("true" to index), which is why the live site went out as noindex. See docs/STATUS.md.
 */
export const INDEXABLE = String(import.meta.env.PUBLIC_SITE_INDEXABLE ?? '').toLowerCase() !== 'false';
