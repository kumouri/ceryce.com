# ceryce.com

Ceryce Armstrong's personal homepage — about, portfolio, résumé, writing, and legal pages. Built with
[Astro](https://astro.build/), styled as a neon-cyberpunk brand (see [BRAND.md](BRAND.md)), and deployed
to Cloudflare.

## Stack

- **Astro** (hybrid) — marketing pages are prerendered static HTML; `/admin/**` is server-rendered on
  the Worker via `@astrojs/cloudflare`. Near-zero client JS.
- **Self-hosted fonts** via Fontsource — no third-party requests.
- **Cloudflare Workers** for hosting (static assets + SSR Worker), **GitHub Actions** for CI + deploy.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the built site
npm run check    # astro check (typecheck)
```

Requires Node 18.20.8+, 20.3+, or 22+.

## Project layout

| Path | What |
| --- | --- |
| `src/pages/` | One file per route: `index`, `about`, `portfolio`, `resume`, `privacy`, `terms`, `writing/` (all prerendered). |
| `src/content/writing/` | **Canonical** long-form posts as Markdown; `src/content.config.ts` types them. |
| `src/pages/admin/` | Server-rendered admin section (Margo dashboard) — gated by Cloudflare Access. |
| `src/layouts/BaseLayout.astro` | Shared marketing shell — head, nav, footer, theme. |
| `src/layouts/AdminLayout.astro` | Admin shell — own nav, `noindex`; never the public chrome. |
| `src/components/` | `Nav`, `Footer`, `GlitchHeading`, `ProjectCard`. |
| `src/styles/` | `tokens.css` (brand variables) + `global.css`. |
| `legal/` | **Canonical** Privacy + Terms Markdown. The pages render HTML from these — never hand-edit HTML. |
| `public/` | Favicon, OG image, redacted `resume.pdf`. |

## Editing content

- **Legal** — edit `legal/privacy-policy.md` / `legal/terms-and-conditions.md`. The site renders them at
  build time (the `terms` page substitutes the Illinois governing-law state and strips internal notes).
- **About** — the narrative and the `moves` / `values` arrays in `src/pages/about.astro`. The four "moves"
  are deliberately told without naming the game they happened in — see [CLAUDE.md](CLAUDE.md).
- **Portfolio** — edit the project entries in `src/pages/portfolio.astro` (content is live, no longer
  placeholders).
- **Résumé** — edit the content constants in `src/pages/resume.astro` (transcribed from the 2026-06-30
  résumé PDF); the redacted `public/resume.pdf` is present and `hasPdf` is enabled.
- **Writing** — add a Markdown file to `src/content/writing/`. The filename is the slug
  (`ceryces-razor.md` → `/writing/ceryces-razor/`); frontmatter needs `title`, `description`, `date`
  (`YYYY-MM-DD`), and optional `tags`. Start the body at `##` — the page renders `title` as the `<h1>`.
  The index and the sitemap pick it up automatically.

## Deploy

CI builds and typechecks every push/PR. Pushes to `main` deploy to Cloudflare via Wrangler, using the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. The deploy targets the
adapter-generated `dist/server/wrangler.json` (produced by `astro build`), not the root `wrangler.toml`.
See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and [`wrangler.toml`](wrangler.toml).

## Roadmap

The **`/admin` section is in progress**: a dashboard to observe, approve, trigger, and tune **Margo**
(Ceryce's chief-of-staff assistant). It runs as Astro SSR on Cloudflare, gated by **Cloudflare Access**,
backed by a `margo-control` Worker + D1 control plane and a local Claude Agent SDK runner. The blog that
was once planned for **D1** now ships as the file-based [`/writing`](https://ceryce.com/writing/)
collection instead. Full phasing lives in the admin roadmap plan.

---

© Ceryce Armstrong. Code is provided for reference; content and branding are not licensed for reuse — see
[Terms](legal/terms-and-conditions.md).
