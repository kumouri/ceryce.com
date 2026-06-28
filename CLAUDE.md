# CLAUDE.md — ceryce.com

Ceryce Armstrong's personal homepage. Astro (static) → Cloudflare Workers static assets.
Start with [README.md](README.md) and [BRAND.md](BRAND.md); this file captures the non-obvious bits.

## About the owner

Ceryce Armstrong (pronounced "Cerise") — an Autistic Trans Woman with ADHD, **she/her/hers**.
Use those pronouns everywhere. Brand palette: **Kumouri Purple `#8e00ff`** (primary), **Toxic Green
`#00ff0f`** (accent).

## Operational facts

- **Legal pages render from Markdown.** `src/pages/privacy.astro` + `terms.astro` read the canonical
  files in `legal/` at build time (via `marked`), strip the internal `<!-- … -->` notes, and the Terms
  page substitutes the governing-law state (**Illinois**). Edit the `.md`, never the rendered HTML.
- **Brand contrast rule:** Toxic Green carries body text on the dark base; Kumouri Purple is for large
  text, borders, fills, and glow only (it fails small-text contrast). All motion is gated behind
  `prefers-reduced-motion`. See [BRAND.md](BRAND.md).
- **Portfolio + Résumé are templates** with `TODO`/placeholder content for Ceryce to fill — don't
  fabricate work history, and don't auto-publish her private repos.

## Build & CI

- `npm run check` (astro check) + `npm run build` are the gates; there is no test suite.
- `.github/workflows/ci.yml`: build/check on push + PR; deploy to Cloudflare on push to `main` via
  `cloudflare/wrangler-action` using `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` repo secrets.
  The deploy job **skips green** if the token is absent. Custom domains (`ceryce.com`, `www`) are
  declared in `wrangler.toml` and provisioned automatically on deploy.
- Merge PRs with **merge commits**; never merge red/pending CI (global rule).

## Roadmap

Blog + login + admin is deferred. It becomes Astro **SSR** on Cloudflare with posts in **D1** and admin
auth via **Zitadel** — an additive upgrade (add an adapter + `main`), not a rewrite.
