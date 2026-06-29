# CLAUDE.md — ceryce.com

Ceryce Armstrong's personal homepage. **Hybrid Astro** on Cloudflare Workers: marketing pages are
prerendered static HTML; `/admin/**` is server-rendered (SSR) on the Worker. First admin tenant is the
**Margo dashboard** (see [the admin roadmap plan](../../.claude/plans/we-contemplated-a-web-glistening-glacier.md)).
Start with [README.md](README.md) and [BRAND.md](BRAND.md); this file captures the non-obvious bits.

## About the owner

Ceryce Armstrong (pronounced "Cerise") — an Autistic Trans Woman with ADHD, **she/her/hers**.
Use those pronouns everywhere. Brand palette: **Kumouri Purple `#8e00ff`** (primary), **Toxic Green
`#00ff0f`** (accent).

## Operational facts

- **Legal pages render from Markdown.** `src/pages/privacy.astro` + `terms.astro` import the canonical
  `legal/*.md` via Vite `?raw` (inlined at build — works in the Cloudflare adapter's prerender runtime,
  which can't load `node:fs`), render with `marked`, strip the internal `<!-- … -->` notes, and the Terms
  page substitutes the governing-law state (**Illinois**). Edit the `.md`, never the rendered HTML.
- **Hybrid rendering.** Every marketing page declares `export const prerender = true` so it stays static;
  routes under `src/pages/admin/**` omit it and run on the Worker. Keep new public pages prerendered.
- **Brand contrast rule:** Toxic Green carries body text on the dark base; Kumouri Purple is for large
  text, borders, fills, and glow only (it fails small-text contrast). All motion is gated behind
  `prefers-reduced-motion`. See [BRAND.md](BRAND.md).
- **Portfolio + Résumé are templates** with `TODO`/placeholder content for Ceryce to fill — don't
  fabricate work history, and don't auto-publish her private repos.

## Build & CI

- `npm run check` (astro check) + `npm run build` are the gates; there is no test suite.
- **Deploy uses the adapter-generated config, not the root one.** `astro build` (via `@astrojs/cloudflare`)
  emits `dist/client` (static assets) + `dist/server/entry.mjs` (the Worker) and resolves a complete
  `dist/server/wrangler.json`. Root `wrangler.toml` is the *user config* the adapter reads (name, custom
  domains, asset handling, future D1/vars). Deploy/preview point at the generated file:
  `wrangler deploy --config dist/server/wrangler.json` (see the `deploy`/`preview` npm scripts).
- `.github/workflows/ci.yml`: build/check on push + PR; deploy on push to `main` via
  `cloudflare/wrangler-action` (`command: deploy --config dist/server/wrangler.json`) using
  `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets. Deploy **skips green** if the token is absent.
  Custom domains (`ceryce.com`, `www`) are declared in `wrangler.toml` and provisioned on deploy.
- We **don't use Astro sessions** (admin auth is stateless Cloudflare Access). `astro.config.mjs` sets a
  memory session driver purely to stop the adapter injecting an id-less `SESSION` KV binding that would
  break deploy.
- Merge PRs with **merge commits**; never merge red/pending CI (global rule).

## Roadmap

The `/admin` SSR section is **in progress** (the Margo dashboard) — auth via **Cloudflare Access (email
OTP)**, a `margo-control` Cloudflare Worker + D1 control plane, and a local Claude Agent SDK runner. Full
phasing + decisions live in
[the admin roadmap plan](../../.claude/plans/we-contemplated-a-web-glistening-glacier.md). Blog with posts
in **D1** is still deferred. (Zitadel is **not** used — that earlier plan is dead.)
