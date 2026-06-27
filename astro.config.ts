import { defineConfig, fontProviders } from 'astro/config';
import { fileURLToPath } from 'node:url';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import emdash from 'emdash/astro';
import { d1, r2 } from '@emdash-cms/cloudflare';

const cloudflareAdapterOptions: Parameters<typeof cloudflare>[0] & { compatibilityDate: string } = {
  // Keep this date in sync with `wrangler.jsonc`'s `compatibility_date`.
  // Both are currently pinned intentionally until deployment config is consolidated.
  compatibilityDate: '2026-04-01',
  imageService: 'passthrough',
};

// https://astro.build/config
export default defineConfig({
  output: 'server',

  // Astro 6 uses workerd runtime natively — no platformProxy config needed
  adapter: cloudflare(cloudflareAdapterOptions),

  integrations: [
    svelte(),
    // emdash({
      // database: d1({ binding: 'jk_emdash' }),
      // storage: r2({ binding: 'jk_media' }),
    // }),
  ],

  // Vite 8 with Rolldown (Rust compiler) — enabled by default in Astro 6
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {},
    },
  },

  // Built-in Fonts API (stable in Astro 6)
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Space Grotesk',
      cssVariable: '--font-heading',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],

  site: 'https://jaysonknight.com',
});
