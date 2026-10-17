import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import {staticRoutes,dynamicRoutes} from './static-routes.mjs';
// This app has no local Cloudflare bindings. Keep production adaptation while
// avoiding an unnecessary workerd emulator for the ordinary Vite preview.
const cloudflare = adapter({routes:{include:dynamicRoutes,exclude:['<all>']}});
delete cloudflare.emulate;
export default { preprocess: vitePreprocess(), kit: { adapter: cloudflare, prerender: { crawl: false, entries:staticRoutes } } };
