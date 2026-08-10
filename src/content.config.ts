import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Long-form writing. Markdown is canonical: the pages under /writing render from these
// files, never the other way round. The glob loader reads them at build time (Node), so
// nothing here needs `node:fs` in the Cloudflare adapter's prerender runtime.
//
// Body convention: the page renders `title` as the <h1>, so post bodies start at `##`.
const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Authored as a bare `YYYY-MM-DD`; see src/lib/date.ts for why it's formatted in UTC. */
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { writing };
