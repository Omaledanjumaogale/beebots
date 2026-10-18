import type { PageSEO, SEOConfig } from './types/seo';
import { buildOrganizationSchema, buildPersonSchema, buildWebSiteSchema } from './schema/builders';
export const SITE = 'https://omiebot.ewinproject.org';
export const PARENT = 'https://ewinproject.org';
export const AUTHOR = 'https://omaledanjumaogale.ewinproject.org/';
/** Editorial release date, not a claim that market data was refreshed. */
export const CONTENT_UPDATED = '2026-10-17';
export const publicPages = [
 { path: '/', title: 'OmieBot Trading', description: 'Explore trading Bees with simulated capital, visible decisions and defined risk boundaries.', changefreq: 'weekly', priority: '1.0' },
 { path: '/paper', title: 'Paper Workspace', description: 'Follow paper trading bots using simulated capital and timestamped market decisions.', changefreq: 'daily', priority: '0.9' },
 { path: '/hive', title: 'Trading Hive', description: 'Inspect the recorded decisions of Drift, Rebound and Breaker paper trading Bees.', changefreq: 'daily', priority: '0.8' },
 { path: '/research', title: 'Research Lab', description: 'Explore model research, evidence boundaries and training candidate evaluation.', changefreq: 'weekly', priority: '0.8' },
 { path: '/ecosystem', title: 'E-WIN Project Ecosystem', description: 'Find the E-WIN parent project, OmieBot identity and linked ecosystem platforms.', changefreq: 'weekly', priority: '0.7' }
] as const;
export const defaultSEO: PageSEO = { title: 'OmieBot Trading · Paper trading bots and research', description: publicPages[0].description, path: '/', modified: CONTENT_UPDATED };
export function buildMeta(page: PageSEO = {}): SEOConfig {
 const title = page.title ?? defaultSEO.title!;
 const description = page.description ?? defaultSEO.description!;
 const path = (page.path ?? '/').split(/[?#]/)[0];
 const canonical = new URL(path.startsWith('/') && !path.startsWith('//') ? path : '/', SITE).href;
 const image = new URL(page.openGraph?.image ?? '/images/omiebot-social.png', SITE).href;
 return { title, description, canonical, robots: page.noindex ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large', locale: 'en_NG', openGraph: { title, description, image, imageAlt: 'OmieBot Trading — paper trading Bees and research', type: page.type ?? 'website', ...page.openGraph }, twitter: { card: 'summary_large_image', title, description, image, ...page.twitter }, schema: page.schema ?? [buildOrganizationSchema(), buildWebSiteSchema(), buildPersonSchema()], published: page.published, modified: page.modified };
}
