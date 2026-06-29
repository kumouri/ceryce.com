import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { verifyAccessJwt, readAccessToken, ACCESS_JWT_COOKIE } from './lib/access';

const ADMIN_PREFIX = '/admin';

/**
 * Gate /admin/** behind Cloudflare Access.
 *
 * Cloudflare Access blocks unauthenticated requests at the edge before they reach the
 * Worker; this middleware re-verifies the signed assertion as defense in depth and
 * exposes the caller's identity on `Astro.locals.user`. Marketing pages are untouched
 * (and prerendered, so this runs for them only at build time, where it short-circuits).
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  if (!isAdmin) return next();

  // `astro dev` has no Cloudflare Access in front of it. Use a stand-in identity so the
  // admin UI is usable locally. This branch is dead code in the deployed Worker.
  if (import.meta.env.DEV) {
    context.locals.user = { email: env.DEV_ADMIN_EMAIL ?? 'dev@localhost' };
    return next();
  }

  const token = readAccessToken(
    context.request.headers,
    context.cookies.get(ACCESS_JWT_COOKIE)?.value,
  );

  try {
    const identity = await verifyAccessJwt(token, {
      teamDomain: env.ACCESS_TEAM_DOMAIN ?? '',
      aud: env.ACCESS_AUD ?? '',
    });
    context.locals.user = { email: identity.email };
  } catch {
    // Access should make this unreachable; if we get here, fail closed.
    return new Response('Forbidden', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  return next();
});
