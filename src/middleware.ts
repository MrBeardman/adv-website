import { defineMiddleware } from 'astro:middleware';
import { SECURITY_HEADERS } from '../security-headers.mjs';

/** Security headers on server-rendered responses (the /api endpoints). Prerendered pages get them from
 *  dist/_headers.json, see security-headers.mjs. */
export const onRequest = defineMiddleware(async (_ctx, next) => {
  const res = await next();
  for (const [k, v] of SECURITY_HEADERS) if (!res.headers.has(k)) res.headers.set(k, v);
  return res;
});
