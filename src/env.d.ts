/// <reference path="../.astro/types.d.ts" />

// Fontsource packages are CSS-only side-effect imports without type declarations.
declare module '@fontsource-variable/*';

// Cloudflare Workers runtime bindings, exposed on `Astro.locals.runtime.env` in
// server-rendered (/admin) routes via the @astrojs/cloudflare adapter.
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  // Populated as the admin section grows (Phase 2+). Cloudflare Access injects the
  // verified-identity headers at the edge; these vars configure JWT verification and
  // the margo-control upstream.
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  CONTROL_PLANE_URL?: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
  DASH_API_SECRET?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    // Verified Cloudflare Access identity for /admin/** (set by src/middleware.ts in Phase 2).
    user?: { email: string };
  }
}
