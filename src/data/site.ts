/**
 * One-word headline emphasis (.adv-em): 'ice' = same face in Ice (default), 'serif' = Instrument Serif
 * italic (the Relay look; open decision for Honza), 'off' = no emphasis.
 */
export const EM_STYLE: 'ice' | 'serif' | 'off' = 'ice';

/**
 * THE launch switch for search engines. While the site is a preview (Hostinger preview URL, Honza's
 * colleagues), every page carries <meta name="robots" content="noindex, nofollow"> and robots.txt
 * disallows everything. Flip at launch: set PUBLIC_SITE_INDEXABLE=true in the build environment
 * (Hostinger Node.js app settings), then rebuild. Read at build time. See docs/STATUS.md.
 */
export const INDEXABLE = String(import.meta.env.PUBLIC_SITE_INDEXABLE ?? '').toLowerCase() === 'true';
