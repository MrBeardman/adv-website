/**
 * Security headers for every response. One list, used twice:
 *  - src/middleware.ts: server-rendered responses (/api/*)
 *  - astro.config.mjs integration: writes dist/_headers.json for the prerendered pages, which the Node
 *    adapter (staticHeaders: true) applies. Middleware does not run for prerendered pages.
 *
 * CSP: 'unsafe-inline' for scripts and styles is deliberate. Astro inlines the page CSS and a few small
 * scripts, and the hero uses inline styles; moving to hashes needs Astro's experimental CSP and a re-test
 * of every scene. Everything else is locked to the site's own origin (no third parties are loaded).
 */
export const SECURITY_HEADERS = [
  [
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
  ],
  ['Strict-Transport-Security', 'max-age=31536000'],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
];
