// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://ceryce.com',
  // Hybrid rendering: every marketing page opts back into static via
  // `export const prerender = true`, so the public site stays a pile of static
  // HTML on Cloudflare's asset host. Only /admin/** runs server-side on the
  // Worker (Cloudflare Access + Margo dashboard). See the admin roadmap plan.
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  // We don't use Astro sessions — admin auth is stateless Cloudflare Access (JWT).
  // Declaring a driver stops the adapter from injecting an (id-less) `SESSION` KV
  // binding that would otherwise break `wrangler deploy`.
  session: { driver: { entrypoint: 'unstorage/drivers/memory' } },
  integrations: [
    sitemap({
      // The admin section is private (Cloudflare Access) — keep it out of the sitemap.
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  build: {
    // Emit clean directory-style URLs (/about/ -> about/index.html)
    format: 'directory',
  },
});
