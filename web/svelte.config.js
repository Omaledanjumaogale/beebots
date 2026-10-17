import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
// This app has no local Cloudflare bindings. Keep production adaptation while
// avoiding an unnecessary workerd emulator for the ordinary Vite preview.
const cloudflare = adapter();
delete cloudflare.emulate;
export default { preprocess: vitePreprocess(), kit: { adapter: cloudflare, prerender: { crawl: false, entries: ['/', '/terminal', '/paper', '/live', '/hive', '/research', '/invest', '/invest/terms', '/admin', '/login', '/connect/okx'] } } };
