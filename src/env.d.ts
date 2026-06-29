/// <reference path="../.astro/types.d.ts" />

// Fontsource packages are CSS-only side-effect imports without type declarations.
declare module '@fontsource-variable/*';

// Cloudflare Workers runtime locals (`Astro.locals.cfContext`) from the
// @astrojs/cloudflare adapter. Bindings/vars are read via `import { env } from
// 'cloudflare:workers'` (Astro v6 removed `Astro.locals.runtime.env`).
type Runtime = import('@astrojs/cloudflare').Runtime;

interface Env {
  // Cloudflare Access injects the verified-identity headers at the edge; these vars
  // configure JWT verification (Phase 2) and the margo-control upstream (Phase 3+).
  ACCESS_TEAM_DOMAIN?: string; // e.g. "ceryce.cloudflareaccess.com"
  ACCESS_AUD?: string; // the Access application's AUD tag
  CONTROL_PLANE_URL?: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
  DASH_API_SECRET?: string;
  /** Local-dev-only stand-in identity for the /admin gate (see src/middleware.ts). */
  DEV_ADMIN_EMAIL?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    // Verified Cloudflare Access identity for /admin/** (set by src/middleware.ts in Phase 2).
    user?: { email: string };
  }
}

// Worker bindings/vars accessor (Astro v6 / @astrojs/cloudflare v14 way; replaces the
// removed `Astro.locals.runtime.env`). Provided by workerd at runtime and the adapter's
// platform proxy in dev.
declare module 'cloudflare:workers' {
  export const env: Env;
}
