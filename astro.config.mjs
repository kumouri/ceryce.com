// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ceryce.com',
  output: 'static',
  integrations: [sitemap()],
  build: {
    // Emit clean directory-style URLs (/about/ -> about/index.html)
    format: 'directory',
  },
});
