import { CONTENT_UPDATED, publicPages, SITE } from '$lib/seo';
import type { RequestHandler } from './$types';
/** Build-time source registry avoids database scans and request-time Function work. */
export const prerender = true;
export const GET: RequestHandler = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map(page => `<url><loc>${SITE}${page.path === '/' ? '/' : page.path}</loc><lastmod>${CONTENT_UPDATED}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
