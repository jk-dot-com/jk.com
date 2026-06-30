import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

try {
  mkdirSync('public/fonts', { recursive: true });
  copyFileSync(
    'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff',
    'public/fonts/space-grotesk-400.woff'
  );
  copyFileSync(
    'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff',
    'public/fonts/space-grotesk-700.woff'
  );

  // Ship the resvg WASM as a static asset so it is served by Cloudflare's ASSETS
  // binding rather than bundled into the Worker script. This sidesteps a Rolldown
  // (Vite 8 / Astro 7) limitation where the ?module WASM import hint does not
  // produce a valid WebAssembly.Module in the Cloudflare Workers runtime.
  mkdirSync('public/wasm', { recursive: true });
  copyFileSync(
    'node_modules/@resvg/resvg-wasm/index_bg.wasm',
    'public/wasm/resvg.wasm'
  );

  // Rasterize the favicon to a 180x180 apple-touch-icon.png — BaseLayout links to
  // this path, and without it the icon 404s for iOS/Safari and search result rich
  // snippets that fall back to it.
  await initWasm(readFileSync('node_modules/@resvg/resvg-wasm/index_bg.wasm'));
  const faviconSvg = readFileSync('public/favicon.svg', 'utf8');
  const resvg = new Resvg(faviconSvg, { fitTo: { mode: 'width', value: 180 } });
  try {
    writeFileSync('public/apple-touch-icon.png', resvg.render().asPng());
  } finally {
    resvg.free();
  }
} catch (error) {
  console.error('postinstall asset copy failed:', error);
  process.exit(1);
}
