# OmieBot complete implementation source package

This file reproduces complete current source for the discovery layer, reusable content/UX components, metadata loads, landing/ecosystem pages, workflow manager and Web Push integration. It is a source snapshot, not independent production acceptance. No environment secret values are included. See [AEO implementation report](AEO-ENTERPRISE-IMPLEMENTATION.md) for Sections 1–7, dependencies, omissions and manual checks; see [workflow acceptance](WORKFLOW-ACCEPTANCE.md) and [mother discovery audit](ECOSYSTEM-DISCOVERY-AUDIT.md) for deployment evidence.

Every source fence begins with its repository path as a language-appropriate comment; remove that comment when copying JSON into a strict JSON parser. The source is otherwise reproduced in full. Files may reference existing helpers and generated SvelteKit types in the repository; use the lockfile and full project rather than treating these as standalone scripts.

## web/src/lib/types/seo.ts

```typescript
// web/src/lib/types/seo.ts
import type { SchemaObject } from '$lib/schema/types';
export interface OpenGraphMeta { title?: string; description?: string; image?: string; imageAlt?: string; type?: 'website' | 'article'; }
export interface TwitterMeta { card?: 'summary' | 'summary_large_image'; title?: string; description?: string; image?: string; }
export interface SchemaBase { '@type': string; '@id'?: string; url?: string; description?: string; datePublished?: string; dateModified?: string; }
export interface PageSEO { title?: string; description?: string; path?: string; noindex?: boolean; type?: 'website' | 'article'; published?: string; modified?: string; schema?: SchemaObject[]; openGraph?: OpenGraphMeta; twitter?: TwitterMeta; }
export interface SEOConfig { title: string; description: string; canonical: string; robots: string; locale: string; openGraph: Required<OpenGraphMeta>; twitter: Required<TwitterMeta>; schema: SchemaObject[]; published?: string; modified?: string; }
```

## web/src/lib/seo.ts

```typescript
// web/src/lib/seo.ts
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
```

## web/src/lib/schema/builders.ts

```typescript
// web/src/lib/schema/builders.ts
import type { ArticleInput, Breadcrumb, QuestionAnswer, SchemaObject } from './types';
const origin = 'https://omiebot.ewinproject.org';
const parent = 'https://ewinproject.org';
const author = 'https://omaledanjumaogale.ewinproject.org/';
export function buildOrganizationSchema(): SchemaObject {
 return { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'OmieBot Trading', url: origin, logo: `${origin}/favicon.svg`, description: 'Paper trading bots and research within the E-WIN Project Ecosystem.', parentOrganization: { '@type': 'Organization', '@id': `${parent}/#organization`, name: 'Elite Workforce Impact Nigeria Project', legalName: 'Elite Workforce Enterprises and Digital Emerging Arbitrage & Leverage Services', url: parent }, founder: { '@id': `${author}#person` } };
}
export function buildWebSiteSchema(): SchemaObject { return { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'OmieBot Trading', url: origin, description: 'Explore simulated trading Bees, recorded decisions and research evidence.', inLanguage: 'en-NG', publisher: { '@id': `${origin}/#organization` } }; }
export function buildPersonSchema(): SchemaObject { return { '@type': 'Person', '@id': `${author}#person`, name: 'Omale Danjuma Ogale', jobTitle: 'Founder & CEO', url: author, worksFor: { '@id': `${parent}/#organization` } }; }
export function buildBreadcrumbSchema(items: Breadcrumb[]): SchemaObject { return { '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) }; }
export function buildArticleSchema(input: ArticleInput): SchemaObject { return { '@type': 'Article', '@id': `${input.url}#article`, headline: input.title, description: input.description, url: input.url, mainEntityOfPage: input.url, datePublished: input.published, dateModified: input.modified, author: { '@id': `${author}#person` }, publisher: { '@id': `${origin}/#organization` } }; }
export function buildFAQSchema(items: QuestionAnswer[]): SchemaObject { return { '@type': 'FAQPage', mainEntity: items.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }; }
export function buildHowToSchema(name: string, description: string, url: string, steps: string[]): SchemaObject { return { '@type': 'HowTo', name, description, url, mainEntityOfPage: url, step: steps.map(text => ({ '@type': 'HowToStep', text })) }; }
export function buildServiceSchema(name: string, description: string, url: string): SchemaObject { return { '@type': 'Service', name, description, url, serviceType: 'Paper trading education and research', provider: { '@id': `${origin}/#organization` }, mainEntityOfPage: url }; }
export const buildProductServicesSchema = buildServiceSchema;
```

## web/src/lib/schema/graph.ts

```typescript
// web/src/lib/schema/graph.ts
import type { SchemaObject } from './types';
/** Escape script delimiters so CMS text cannot terminate the JSON-LD element. */
export function buildPageGraph(schemas: SchemaObject[]): string {
 const nodes = new Map<string, SchemaObject>();
 schemas.forEach((schema, index) => { const key = schema['@id'] ?? `anonymous-${index}`; nodes.set(key, { ...nodes.get(key), ...schema }); });
 return JSON.stringify({ '@context': 'https://schema.org', '@graph': [...nodes.values()] }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
```

## web/src/lib/schema/types.ts

```typescript
// web/src/lib/schema/types.ts
/** JSON-compatible Schema.org node; factories supply only claims supported by visible content. */
export type SchemaValue = string | number | boolean | null | SchemaObject | SchemaValue[];
export interface SchemaObject { [key: string]: SchemaValue | undefined; '@type'?: string; '@id'?: string; }
export interface Breadcrumb { name: string; url: string; }
export interface QuestionAnswer { question: string; answer: string; }
export interface ArticleInput { title: string; description: string; url: string; published: string; modified: string; }
```

## web/src/lib/components/SEO.svelte

```svelte
<!-- web/src/lib/components/SEO.svelte -->
<script lang="ts">
 import type { PageSEO } from '$lib/types/seo';
 import type { SchemaObject } from '$lib/schema/types';
 import { buildMeta } from '$lib/seo';
 import { buildPageGraph } from '$lib/schema/graph';
 let { seo = {}, graph }: { seo?: PageSEO; graph?: SchemaObject[] } = $props();
 const meta = $derived(buildMeta(seo));
 const json = $derived(buildPageGraph(graph ?? meta.schema));
</script>
<svelte:head>
 <title>{meta.title}</title>
 <meta name="description" content={meta.description}/>
 <meta name="robots" content={meta.robots}/>
 <link rel="canonical" href={meta.canonical}/>
 <meta property="og:site_name" content="OmieBot Trading"/>
 <meta property="og:title" content={meta.openGraph.title}/>
 <meta property="og:description" content={meta.openGraph.description}/>
 <meta property="og:url" content={meta.canonical}/>
 <meta property="og:type" content={meta.openGraph.type}/>
 <meta property="og:locale" content={meta.locale}/>
 <meta property="og:image" content={meta.openGraph.image}/>
 <meta property="og:image:alt" content={meta.openGraph.imageAlt}/>
 <meta property="og:image:width" content="1200"/>
 <meta property="og:image:height" content="630"/>
 <meta name="twitter:card" content={meta.twitter.card}/>
 <meta name="twitter:title" content={meta.twitter.title}/>
 <meta name="twitter:description" content={meta.twitter.description}/>
 <meta name="twitter:image" content={meta.twitter.image}/>
 <meta name="twitter:image:alt" content={meta.openGraph.imageAlt}/>
 {#if meta.published}<meta property="article:published_time" content={meta.published}/>{/if}
 {#if meta.modified}<meta property="article:modified_time" content={meta.modified}/>{/if}
 {@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
```

## web/src/lib/components/PageTemplate.svelte

```svelte
<!-- web/src/lib/components/PageTemplate.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import TLDRBlock from './TLDRBlock.svelte';
  import FAQSection, { type FAQItem } from './FAQSection.svelte';
  import AuthorCard from './AuthorCard.svelte';
  import RelatedLinks, { type RelatedLink } from './RelatedLinks.svelte';
  let { title, summary, published, modified, children, faqs = [], related = [], sources = [], author = true }: { title: string; summary: string; published: string; modified: string; children?: Snippet; faqs?: FAQItem[]; related?: RelatedLink[]; sources?: RelatedLink[]; author?: boolean } = $props();
</script>
<article class="content-page"><header><h1>{title}</h1><p class="dates">Published <time datetime={published}>{published}</time> · Last updated <time datetime={modified}>{modified}</time></p><TLDRBlock text={summary} /></header>
  <div class="body">{@render children?.()}</div>
  {#if faqs.length}<FAQSection items={faqs} />{/if}
  {#if author}<AuthorCard />{/if}
  {#if related.length}<RelatedLinks links={related} />{/if}
  {#if sources.length}<section aria-labelledby="sources"><h2 id="sources">Which sources support this page?</h2><ul>{#each sources as source}<li><cite><a href={source.href}>{source.title}</a></cite>{#if source.description}<p>{source.description}</p>{/if}</li>{/each}</ul></section>{/if}
</article>
<style>.content-page{max-width:64rem;margin:auto;padding:3rem 1.25rem;color:#d4d4d4}.content-page h1{font-size:clamp(2rem,5vw,3.6rem);font-weight:700;line-height:1.15;color:#fafafa;margin-bottom:1rem}.dates{font-size:.75rem;color:#999;line-height:1.8;margin-bottom:1.5rem}.body{margin-block:2rem;line-height:1.8}.content-page h2{font-size:1.5rem;color:#fafafa}.content-page cite a{color:#facc15;text-underline-offset:4px}.content-page li{margin-block:.75rem}.content-page li p{font-size:.85rem}</style>
```

## web/src/lib/components/FAQSection.svelte

```svelte
<!-- web/src/lib/components/FAQSection.svelte -->
<script lang="ts">
  export type FAQItem = { question: string; answer: string; id?: string };
  let { items, title = 'What else should you know?', id = 'frequently-asked-questions' }: { items: FAQItem[]; title?: string; id?: string } = $props();
  // FAQ JSON-LD is assembled from these same items in the page load and head.
</script>
<section aria-labelledby={id} class="faq"><h2 {id}>{title}</h2>{#each items as item, index}<details><summary id={item.id ?? `${id}-${index + 1}`}>{item.question}</summary><p>{item.answer}</p></details>{/each}</section>
<style>.faq{margin-block:2.5rem}.faq h2{font-size:1.65rem;font-weight:650;color:#fafafa;margin-bottom:1rem}.faq details{border-bottom:1px solid #ffffff20}.faq summary{padding:1.1rem .25rem;color:#fafafa;cursor:pointer;font-weight:550;line-height:1.5}.faq summary:focus-visible{outline:2px solid #facc15;outline-offset:3px}.faq p{padding:0 .25rem 1rem;margin:0;color:#c4c4c4;line-height:1.8}</style>
```

## web/src/lib/components/AuthorCard.svelte

```svelte
<!-- web/src/lib/components/AuthorCard.svelte -->
<script lang="ts">
  let { name = 'Omale Danjuma Ogale', role = 'Founder & CEO', url = 'https://omaledanjumaogale.ewinproject.org/' }: { name?: string; role?: string; url?: string } = $props();
  // No unverified credentials, stock portrait, or social identity is asserted.
</script>
<aside class="author" aria-label="Author"><span class="avatar" aria-hidden="true">OD</span><div><span class="eyebrow">Published by</span><a href={url} rel="author">{name}</a><p>{role}</p></div></aside>
<style>.author{display:flex;align-items:center;gap:1rem;padding:1.25rem;border:1px solid #ffffff18;border-radius:.8rem;margin-block:2rem}.avatar{display:grid;place-items:center;width:3rem;height:3rem;border-radius:50%;background:#facc1518;color:#facc15;font-weight:700}.author a{display:block;color:#fafafa;text-decoration:underline;text-underline-offset:4px}.author p{margin:.25rem 0 0;color:#aaa;font-size:.85rem}.eyebrow{display:block;font-size:.7rem;color:#facc15;margin-bottom:.25rem}</style>
```

## web/src/lib/components/TLDRBlock.svelte

```svelte
<!-- web/src/lib/components/TLDRBlock.svelte -->
<script lang="ts">
  let { text, title = 'At a glance' }: { text: string; title?: string } = $props();
</script>
<aside class="answer" aria-label={title}><strong>{title}</strong><p>{text}</p></aside>
<style>.answer{padding:1.2rem 1.4rem;border-left:3px solid #facc15;border-radius:0 .8rem .8rem 0;background:#facc150a;color:#e5e5e5}.answer strong{color:#facc15;font-size:.8rem;letter-spacing:.05em}.answer p{margin:.5rem 0 0;line-height:1.75}</style>
```

## web/src/lib/components/RelatedLinks.svelte

```svelte
<!-- web/src/lib/components/RelatedLinks.svelte -->
<script lang="ts">
  export type RelatedLink = { title: string; href: string; description?: string };
  let { links, title = 'Where can you learn more?', id = 'related-links' }: { links: RelatedLink[]; title?: string; id?: string } = $props();
</script>
<nav aria-labelledby={id} class="related"><h2 {id}>{title}</h2><ul>{#each links as link}<li><a href={link.href}>{link.title}<span aria-hidden="true"> ↗</span></a>{#if link.description}<p>{link.description}</p>{/if}</li>{/each}</ul></nav>
<style>.related{margin-block:2rem}.related h2{font-size:1.5rem;color:#fafafa;margin-bottom:1rem}.related ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.8rem;list-style:none;padding:0}.related li{padding:1rem;border:1px solid #ffffff18;border-radius:.7rem}.related a{color:#facc15;text-decoration:underline;text-underline-offset:4px}.related p{color:#b3b3b3;font-size:.85rem;line-height:1.6;margin:.5rem 0 0}</style>
```

## web/src/lib/components/EcosystemBanner.svelte

```svelte
<!-- web/src/lib/components/EcosystemBanner.svelte -->
<aside class="ecosystem" itemscope itemtype="https://schema.org/Organization" aria-label="E-WIN ecosystem membership">
  <meta itemprop="name" content="Elite Workforce Impact Nigeria (E-WIN) Project" />
  <meta itemprop="legalName" content="Elite Workforce Enterprises and Digital Emerging Arbitrage & Leverage Services" />
  <a itemprop="url" href="https://ewinproject.org"><span class="signal" aria-hidden="true"></span><span>A platform under the Elite Workforce Impact Nigeria (E-WIN) Project Ecosystem</span><span aria-hidden="true">↗</span></a>
</aside>
<style>.ecosystem{background:#facc150b;border-block:1px solid #facc151f}.ecosystem a{display:flex;align-items:center;justify-content:center;gap:.65rem;padding:.8rem 1rem;text-align:center;font-size:.76rem;line-height:1.6;color:#e7d689;text-decoration:none}.ecosystem a:focus-visible{outline:2px solid #facc15;outline-offset:-3px}.signal{flex-shrink:0;width:.4rem;height:.4rem;border-radius:50%;background:#facc15;animation:pulse 3s ease-in-out infinite}@keyframes pulse{50%{box-shadow:0 0 0 5px #facc1515}}@media(prefers-reduced-motion:reduce){.signal{animation:none}}</style>
```

## web/src/lib/components/ToastProvider.svelte

```svelte
<!-- web/src/lib/components/ToastProvider.svelte -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { toasts } from '$lib/toast.svelte';
  let reduced = $state(false);
  $effect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = query.matches;
    const update = () => { reduced = query.matches; };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
</script>
<div class="toast-region" aria-label="Notifications">
  {#each toasts.messages as item (item.id)}
    <div class="notice" class:error={item.kind === 'error'} role={item.kind === 'error' ? 'alert' : 'status'} transition:fly={{ y: reduced ? 0 : 16, duration: reduced ? 0 : 160 }}>
      <span>{item.message}</span><button aria-label="Dismiss notification" onclick={() => toasts.dismiss(item.id)}>×</button>
    </div>
  {/each}
</div>
<style>
  .toast-region{position:fixed;bottom:1.25rem;right:1.25rem;z-index:1000;display:grid;gap:.6rem;width:min(25rem,calc(100vw - 2.5rem));pointer-events:none}.notice{display:flex;align-items:start;gap:1rem;background:#171717;color:#fafafa;border:1px solid #eab308;border-radius:.8rem;padding:1rem;box-shadow:0 8px 30px #0008;pointer-events:auto}.notice.error{border-color:#fb7185}.notice span{flex:1;overflow-wrap:anywhere}.notice button{border:0;background:transparent;color:inherit;font-size:1.4rem;min-width:2rem;min-height:2rem;cursor:pointer}.notice button:focus-visible{outline:2px solid #facc15;outline-offset:2px}
</style>
```

## web/src/lib/components/Tooltip.svelte

```svelte
<!-- web/src/lib/components/Tooltip.svelte -->
<script lang="ts">
  import { Tooltip } from 'bits-ui';
  let { text, label = 'More information' }: { text: string; label?: string } = $props();
</script>
<Tooltip.Provider delayDuration={200}>
  <Tooltip.Root>
    <Tooltip.Trigger class="tooltip-trigger" aria-label={label}>ⓘ</Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content class="tooltip-content" sideOffset={6}>{text}</Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
<style>
  :global(.tooltip-trigger){display:inline-grid;place-items:center;vertical-align:middle;min-width:2.75rem;min-height:2.75rem;border:0;border-radius:.4rem;background:transparent;color:#facc15;cursor:help;font-size:1rem}:global(.tooltip-trigger:focus-visible){outline:2px solid #facc15;outline-offset:2px}:global(.tooltip-content){max-width:min(17rem,70vw);z-index:80;background:#202020;border:1px solid #6b591c;border-radius:.6rem;padding:.75rem;color:#fafafa;font-size:.8rem;line-height:1.5;font-weight:400;box-shadow:0 8px 24px #0008}
</style>
```

## web/src/lib/components/DeviceNotifications.svelte

```svelte
<!-- web/src/lib/components/DeviceNotifications.svelte -->
<script lang="ts">
 import {toasts} from '$lib/toast.svelte';
 import Tooltip from './Tooltip.svelte';
 let busy=$state(false),status=$state('Notifications are off until you choose to enable them.');
 async function action(operation:string,subscription?:PushSubscriptionJSON){const r=await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,subscription})});const d=await r.json();if(!r.ok)throw Error(d.message??'Notification action unavailable');return d;}
 async function enable(){busy=true;try{if(!('serviceWorker'in navigator)||!('PushManager'in window))throw Error('This browser does not support Web Push. Some mobile browsers require installing the app on the home screen.');const r=await fetch('/api/notifications');const settings=await r.json();if(!r.ok||!settings.configured||!settings.publicKey)throw Error('Sign in; device delivery must be configured.');const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Notification permission was not granted.');const registration=await navigator.serviceWorker.ready;const raw=atob(settings.publicKey.replace(/-/g,'+').replace(/_/g,'/'));const key=Uint8Array.from(raw,c=>c.charCodeAt(0));const sub=await registration.pushManager.getSubscription()??await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});await action('subscribe',sub.toJSON());status='This device is enrolled. Test delivery to check provider acceptance.';toasts.show(status,'success');}catch(e){status=e instanceof Error?e.message:String(e);toasts.show(status,'error');}finally{busy=false;}}
 async function test(){busy=true;try{const result=await action('test');status=`Push service accepted ${result.accepted} of ${result.devices} deliveries. Confirm receipt on your device separately.`;toasts.show(status,'info');}catch(e){status=e instanceof Error?e.message:String(e);toasts.show(status,'error');}finally{busy=false;}}
 async function disable(){busy=true;try{const registration=await navigator.serviceWorker.ready,sub=await registration.pushManager.getSubscription();if(sub){await action('unsubscribe',sub.toJSON());await sub.unsubscribe();}status='This device is no longer enrolled.';toasts.show(status,'success');}catch(e){status=e instanceof Error?e.message:String(e);toasts.show(status,'error');}finally{busy=false;}}
</script>
<section aria-labelledby="device-notifications"><h2 id="device-notifications">Device notifications <Tooltip text="Opt in on this device. Alerts contain no balances, keys or trading instructions. Permission and push-service acceptance do not prove device receipt."/></h2><p>{status}</p><div><button disabled={busy} onclick={enable}>Enable on this device</button><button disabled={busy} onclick={test}>Test delivery</button><button disabled={busy} onclick={disable}>Disable</button></div></section>
<style>section{border:1px solid #65552a;border-radius:12px;padding:20px;margin-block:20px;color:#ddd}h2{font-size:1.1rem}p{font-size:.85rem;line-height:1.7}div{display:flex;gap:12px;flex-wrap:wrap}button{padding:12px;border:1px solid #665a2d;border-radius:8px;color:#f4c647;min-height:44px}button:focus-visible{outline:2px solid #f4c647}button:disabled{opacity:.5}</style>
```

## web/src/lib/components/WorkflowManager.svelte

```svelte
<!-- web/src/lib/components/WorkflowManager.svelte -->
<script lang="ts">
  import Tooltip from './Tooltip.svelte';
  import { toasts } from '$lib/toast.svelte';
  type Job={_id:string;kind:string;status:string;message:string;updatedAt:number};
  let jobs=$state<Job[]>([]),busy=$state(false),kind=$state('all'),loaded=$state(false);
  async function refresh(){busy=true;try{const response=await fetch('/api/workflows');if(!response.ok)throw new Error('Workflow status unavailable');jobs=await response.json();loaded=true;}catch(error){toasts.show((error as Error).message,'error');}finally{busy=false;}}
  async function start(){busy=true;try{const response=await fetch('/api/workflows',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind})});if(!response.ok)throw new Error('Workflow could not start. Check access, configuration and daily limits.');const result=await response.json();toasts.show(result.existing?'An existing workflow is still active.':'Workflow queued for the external runner.','info');await refresh();}catch(error){toasts.show((error as Error).message,'error');}finally{busy=false;}}
</script>
<section class="manager" aria-labelledby="workflow-title"><h2 id="workflow-title">Which background workflow should run? <Tooltip text="Queues one external job per administrator. Ten starts per day; repeat starts return the active job. Training never runs in a web request."/></h2><p>Administrators can queue retained-data training, production verification, or both in sequence. Training runs outside web requests. Refresh status on demand.</p><div class="controls"><label>Workflow <select bind:value={kind}><option value="all">Training, then verification</option><option value="training">Training</option><option value="verification">Production verification</option></select></label><button disabled={busy} onclick={start}>Start workflow</button><button disabled={busy} onclick={refresh}>Refresh status</button></div><div aria-live="polite">{#if busy}<p>Working…</p>{/if}{#if loaded && !jobs.length}<p>No workflows have been started.</p>{/if}<ul>{#each jobs as job}<li><strong>{job.kind} · {job.status}</strong><p>{job.message}</p><time datetime={new Date(job.updatedAt).toISOString()}>{new Date(job.updatedAt).toLocaleString()}</time></li>{/each}</ul></div></section>
<style>.manager{padding:1.25rem;border:1px solid #ffffff20;border-radius:1rem;color:#ddd}.manager h2{color:#fafafa;font-size:1.2rem}.manager p{line-height:1.6;font-size:.85rem}.controls{display:flex;flex-wrap:wrap;align-items:end;gap:.75rem;margin-block:1rem}.controls label{display:grid;gap:.4rem;font-size:.8rem}.controls select,.controls button{background:#171717;color:#facc15;border:1px solid #82701e;padding:.75rem;border-radius:.5rem;min-height:44px}.controls button{cursor:pointer}.controls button:disabled{opacity:.5;cursor:wait}.manager ul{list-style:none;padding:0}.manager li{padding:.8rem 0;border-top:1px solid #ffffff18}.manager time{font-size:.75rem;color:#999}</style>
```

## web/src/lib/toast.svelte.ts

```typescript
// web/src/lib/toast.svelte.ts
export type ToastKind = 'success' | 'error' | 'info';
export type ToastMessage = { id: number; message: string; kind: ToastKind };
let messages = $state<ToastMessage[]>([]);
let sequence = 0;
export const toasts = {
  get messages() { return messages; },
  dismiss(id: number) { messages = messages.filter((item) => item.id !== id); },
  show(message: string, kind: ToastKind = 'info', duration = 6000) {
    const id = ++sequence;
    messages = [...messages.slice(-3), { id, message, kind }];
    if (typeof window !== 'undefined' && duration > 0) window.setTimeout(() => this.dismiss(id), duration);
    return id;
  }
};
```

## web/src/lib/server/push.ts

```typescript
// web/src/lib/server/push.ts
import {buildPushPayload,type PushSubscription} from '@block65/webcrypto-web-push';
import type {AuthEnv} from './auth';
export function validSubscription(value:unknown):value is PushSubscription{
 if(!value||typeof value!=='object')return false;const v=value as PushSubscription;
 try{const u=new URL(v.endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.href.length<2000&&
 ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(host=>u.hostname===host)||false;}catch{return false;}
}
export function parseSubscription(value:unknown):PushSubscription{
 if(!validSubscription(value))throw Error('Unsupported push service endpoint');
 const v=value as PushSubscription;
 if(!v.keys||!/^[-_a-zA-Z0-9]{80,150}$/.test(v.keys.p256dh)||!/^[-_a-zA-Z0-9]{16,50}$/.test(v.keys.auth))throw Error('Invalid subscription keys');
 return {endpoint:v.endpoint,expirationTime:null,keys:{p256dh:v.keys.p256dh,auth:v.keys.auth}};
}
export async function deliverPush(env:AuthEnv,subscriptions:PushSubscription[],fetcher:typeof fetch=fetch){
 if(!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY)throw Error('Device delivery is not configured');
 const results=[];
 for(const subscription of subscriptions.slice(0,3)){
  parseSubscription(subscription);
  try{const payload=await buildPushPayload({data:JSON.stringify({title:'OmieBot workflow update',body:'Your workflow status was updated. Sign in to review its evidence.',url:'/admin'}),options:{ttl:300}},subscription,{subject:'https://omiebot.ewinproject.org',publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY});
   const r=await fetcher(subscription.endpoint,{...payload,redirect:'error',signal:AbortSignal.timeout(10000)});results.push({endpoint:subscription.endpoint,accepted:r.status===201||r.status===202,expired:r.status===404||r.status===410});
  }catch{results.push({endpoint:subscription.endpoint,accepted:false,expired:false});}
 }
 return results;
}
```

## web/src/hooks.server.ts

```typescript
// web/src/hooks.server.ts
import type {Handle} from '@sveltejs/kit';
export const handle:Handle=async({event,resolve})=>{
 const response=await resolve(event);
 const privatePath=/^\/(api|admin|auth|login|live|invest|terminal|connect)(?:\/|$)/.test(event.url.pathname);
 if(privatePath){response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');response.headers.set('Cache-Control','private, no-store');}
 else if(event.url.pathname.startsWith('/.well-known/'))response.headers.set('Cache-Control','public, max-age=300');
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 response.headers.set('X-Frame-Options','DENY');
 if(event.url.protocol==='https:')response.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
 return response;
};
```

## web/src/routes/+layout.server.ts

```typescript
// web/src/routes/+layout.server.ts
import type {LayoutServerLoad} from './$types';
import {CONTENT_UPDATED,publicPages,SITE,defaultSEO} from '$lib/seo';
import {buildOrganizationSchema,buildPersonSchema,buildWebSiteSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
import type {PageSEO} from '$lib/types/seo';
export const load:LayoutServerLoad=({url})=>{
 const route=publicPages.find(page=>page.path===url.pathname);
 const seo:PageSEO={...defaultSEO,path:url.pathname,title:route?`${route.title} · OmieBot Trading`:'Private workspace · OmieBot Trading',description:route?.description??'Sign in to retrieve your own account records. Static page shells contain no private data.',noindex:!route,modified:CONTENT_UPDATED,schema:route?[
  buildOrganizationSchema(),buildWebSiteSchema(),buildPersonSchema(),
  buildBreadcrumbSchema([{name:'OmieBot Trading',url:SITE+'/'},...(url.pathname==='/'?[]:[{name:route.title,url:SITE+url.pathname}])]),
  {'@type':'WebPage','@id':SITE+url.pathname+'#page',url:SITE+url.pathname,name:route.title,description:route.description,inLanguage:'en-NG',dateModified:CONTENT_UPDATED,author:{'@id':'https://omaledanjumaogale.ewinproject.org/#person'},publisher:{'@id':SITE+'/#organization'},isPartOf:{'@id':SITE+'/#website'},mainEntityOfPage:SITE+url.pathname}
 ]:[]};
 return {seo,contentDate:CONTENT_UPDATED,publicContent:!!route};
};
```

## web/src/routes/+layout.svelte

```svelte
<!-- web/src/routes/+layout.svelte -->
<script lang="ts">
 import '../app.css';
 import type {Snippet} from 'svelte';
 import type {PageSEO} from '$lib/types/seo';
 import TLDRBlock from '$lib/components/TLDRBlock.svelte';
 import SEO from '$lib/components/SEO.svelte';
 import ToastProvider from '$lib/components/ToastProvider.svelte';
 import AuthorCard from '$lib/components/AuthorCard.svelte';
 let {children,data}:{children:Snippet;data:{seo?:PageSEO;publicContent?:boolean;contentDate?:string}}=$props();
</script>
<SEO seo={data.seo}/>
<a class="skip-navigation" href="#main-content">Skip to main content</a>
<div id="main-content" tabindex="-1">{#if data.publicContent&&data.seo?.path!=='/'}<div class="route-summary"><TLDRBlock text={data.seo?.description??''}/></div>{/if}{@render children()}</div>
{#if data.publicContent}<footer class="discovery-footer"><p>Editorial update: <time datetime={data.contentDate}>{data.contentDate}</time>. Market data freshness is shown separately in each workspace.</p><AuthorCard/><nav aria-label="Ecosystem and discovery"><a href="/ecosystem">E-WIN ecosystem</a><a href="https://ewinproject.org/">Elite Workforce Impact Nigeria Project</a><a href="/llms.txt">AI discovery index</a><a href="/rss.xml">Updates feed</a></nav></footer>{/if}
<ToastProvider/>
<style>.route-summary{max-width:1200px;margin:1rem auto;padding:0 1.25rem}.skip-navigation{position:fixed;left:1rem;top:-8rem;z-index:1000;background:#f4c647;color:#111;padding:1rem}.skip-navigation:focus{top:1rem}.discovery-footer{max-width:1200px;margin:auto;padding:2rem 1.25rem;color:#a9b296;font-size:.85rem}.discovery-footer nav{display:flex;flex-wrap:wrap;gap:1.2rem;margin-top:1rem}.discovery-footer a{color:#f4c647}.discovery-footer a:focus-visible{outline:2px solid #f4c647;outline-offset:4px}</style>
```

## web/src/routes/+page.server.ts

```typescript
// web/src/routes/+page.server.ts
import type {PageServerLoad} from './$types';
import {homeFAQs} from '$lib/content';
import {buildFAQSchema} from '$lib/schema/builders';
export const load:PageServerLoad=async({parent})=>{
 const data=await parent();return {faqs:homeFAQs,seo:{...data.seo,title:'OmieBot Trading · Paper trading bots with visible decisions',published:'2026-10-15',schema:[...(data.seo?.schema??[]),buildFAQSchema(homeFAQs)]}};
};
```

## web/src/routes/+page.svelte

```svelte
<!-- web/src/routes/+page.svelte -->
<script lang="ts">
 import EcosystemBanner from '$lib/components/EcosystemBanner.svelte';
 import TLDRBlock from '$lib/components/TLDRBlock.svelte';
 let {data}=$props();
 let open=$state(false);
 const bees=[['01','Drift','TREND FOLLOWER','Looks for sustained direction and waits for its conditions to align.'],['02','Rebound','MEAN REVERSION','Studies pullbacks and recovery signals. Patience is part of the strategy.'],['03','Breaker','BREAKOUT WATCHER','Watches price boundaries for a qualifying move. No signal means no trade.']];
 const faqs=$derived(data.faqs.map(item=>[item.question,item.answer]));
</script>
<svelte:head><link rel="preload" as="image" href="/images/bee-honeycomb.webp"/></svelte:head>
<div class="landing">
<header><a class="brand" href="/" aria-label="OmieBot home"><span class="logo">⬡</span><span>Omie<b>Bot</b><small>TRADING, TOGETHER.</small></span></a><nav class:open aria-label="Main navigation"><a href="#how" onclick={()=>open=false}>How it works</a><a href="#bees" onclick={()=>open=false}>Meet the hive</a><a href="/paper">Paper Workspace</a><a href="/research">Research lab ↗</a></nav><a class="app-link" href="/live">Live Workspace ↗</a><button class="menu" onclick={()=>open=!open} aria-expanded={open} aria-label="Toggle navigation">{open?'Close':'Menu'}</button></header>
<EcosystemBanner/>
<main>
<section class="hero"><img class="hero-photo" src="/images/bee-honeycomb.webp" alt="Honey bee working on the golden honeycomb cells of its nest" fetchpriority="high" width="1920" height="1462"/><div class="shade"></div><div class="hero-copy"><span class="eyebrow">● SMALL BEES. SHARED INTELLIGENCE.</span><h1>Your paper<br/>trading <em>hive.</em></h1><TLDRBlock text="OmieBot lets you explore trading bots with simulated capital and timestamped decisions. Live customer trading and real deposits are not enabled. Returns are not guaranteed."/><p>Meet your trading hive. Independent bots that watch the markets, follow their rules, and put every decision where you can see it.</p><div class="actions"><a class="primary" href="/paper">Explore the paper workspace <span>↗</span></a><a class="watch" href="/hive"><span>▶</span> Watch the hive</a></div><div class="mode">● PAPER TRADING NOW <span>/</span> NO REAL FUNDS REQUIRED</div></div><div class="image-caption"><small>INSPIRED BY NATURE.</small><strong>Built to work as a hive.</strong></div><a class="credit" href="https://commons.wikimedia.org/wiki/File:Western_honey_bee_on_a_honeycomb.jpg" target="_blank" rel="noreferrer">Photo: Matthew T Rader · CC BY-SA 4.0 · resized</a><span class="scroll">EXPLORE THE HIVE ↓</span></section>
<div class="principles"><span>INDEPENDENT BOTS</span><b>✳</b><span>VISIBLE DECISIONS</span><b>✳</b><span>DEFINED BOUNDARIES</span><b>✳</b><span>YOU STAY INFORMED</span></div>
<section class="intro section" id="how"><div><span class="eyebrow">01 / A DIFFERENT WAY IN</span><h2 id="content-1">You don’t need to<br/>know every chart.<br/><span>Start with the hive.</span></h2></div><div class="intro-copy"><p class="lead">Trading can feel like a language you were never taught. OmieBot makes the process easier to follow.</p><p>Explore independent Bees, understand what they look for, and watch their decisions in a paper environment. A shared workspace brings research, activity and results together.</p><a class="underlined" href="/hive">See what the Bees are doing <span>↗</span></a></div></section>
<section class="steps section"><article><span>01</span><h3 id="content-2">Discover your Bees.</h3><p>Meet the strategies and the rules behind them. Different Bees look for different market conditions.</p></article><article><span>02</span><h3 id="content-3">Watch. Learn. Try.</h3><p>Use simulated capital to explore the workspace. Follow decisions, positions and recorded activity.</p></article><article><span>03</span><h3 id="content-4">Keep the full picture.</h3><p>See the costs, pauses and outcomes. A Bee that waits is following its discipline, too.</p></article></section>
<section class="hive section" id="bees"><div class="section-title"><div><span class="eyebrow">02 / COLLECTIVE INTELLIGENCE</span><h2 id="content-5">One hive.<br/><span>Different instincts.</span></h2></div><p>Three distinct baseline Bees.<br/>One place to follow their paper decisions.</p></div><div class="bee-grid">{#each bees as bee}<article><div class="bee-head"><span class="bee-icon">✳</span><small>{bee[0]} / PAPER BEE</small></div><span class="eyebrow">{bee[2]}</span><h3 id="content-6">{bee[1]}<span> Bee</span></h3><p>{bee[3]}</p><a href="/hive">Meet {bee[1]} <span>↗</span></a></article>{/each}</div><div class="hive-foot"><span>● ACTIVITY IS RECORDED. PERFORMANCE IS NEVER INVENTED.</span><a href="/hive">Open the Live Hive ↗</a></div></section>
<section class="evidence section"><figure><img src="/images/bee-honeycomb.webp" alt="Close-up of a honey bee and the intricate cells of a honeycomb nest" loading="lazy" width="1920" height="1462"/><figcaption>EVERY CELL HAS A PURPOSE.<small>Matthew T Rader · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · resized</small></figcaption></figure><div><span class="eyebrow">03 / BUILT ON EVIDENCE</span><h2 id="content-7">Trust is earned.<br/><span>Decision by decision.</span></h2><p>No mysterious profit counter. No promise of overnight returns. Explore the evidence behind the work.</p><ul><li><span>↗</span><div><h3 id="content-8">A record you can follow</h3><p>Inspect paper decisions, positions, costs and activity in the Hive.</p></div></li><li><span>↗</span><div><h3 id="content-9">Research before release</h3><p>Training creates candidates. Independent evaluation and forward paper trials come next.</p></div></li><li><span>↗</span><div><h3 id="content-10">Permission to do nothing</h3><p>Missing data and unmet conditions mean abstaining, with the state visible to you.</p></div></li></ul><a class="underlined" href="/research">Inside the Research Lab <span>↗</span></a></div></section>
<section class="faq section"><div><span class="eyebrow">A LITTLE CLARITY</span><h2 id="content-11">Before you<br/><span>join the hive.</span></h2></div><div>{#each faqs as faq}<details><summary>{faq[0]}<span>+</span></summary><p>{faq[1]}</p></details>{/each}</div></section>
<section class="closing"><span class="eyebrow">YOUR NEXT CHAPTER STARTS WITH A LOOK.</span><h2 id="content-12">Curious?<br/>Come meet <em>your hive.</em></h2><a class="primary" href="/paper">Explore OmieBot <span>↗</span></a><p>Start in paper mode. Learn at your own pace.</p><span class="comb" aria-hidden="true">⬡</span></section>
</main><footer><div class="footer-top"><a class="brand" href="/">Omie<b>Bot</b></a><nav aria-label="Footer"><a href="/terminal">Trading workspace</a><a href="/hive">Live Hive</a><a href="/research">Research Lab</a><a href="/login">Sign in</a></nav></div><p class="risk"><b>A clear starting point.</b> OmieBot currently operates with paper capital. Real deposits, withdrawals and live customer trading are not enabled. Trading involves risk and can result in loss. Simulated results and training do not guarantee future returns.</p><div class="footer-bottom"><span>© {new Date().getFullYear()} OmieBot Trading</span><a href="https://commons.wikimedia.org/wiki/File:Western_honey_bee_on_a_honeycomb.jpg">Hive photography: Matthew T Rader · CC BY-SA 4.0</a><span>BUILT WITH PURPOSE. INSPIRED BY BEES.</span></div></footer>
</div>
<style>
:global(html){scroll-behavior:smooth;scroll-padding-top:90px}:global(body){margin:0;background:#0c0d09;color:#f3f2e8;font-family:Arial,Helvetica,sans-serif}.landing{--yellow:#f8ce36;--muted:#a5a793;overflow:hidden}a{color:inherit;text-decoration:none}header{height:98px;max-width:1440px;margin:auto;padding:0 5%;display:flex;align-items:center;gap:40px}.brand{display:flex;align-items:center;gap:10px;font-size:28px;font-weight:800;letter-spacing:-1.4px}.brand b{color:var(--yellow)}.logo{font-size:51px;color:var(--yellow);font-weight:400;line-height:1}.brand small{display:block;font-size:7px;letter-spacing:2.2px;color:#b4b7a4;margin-top:6px}header nav{display:flex;gap:32px;margin:auto;font-size:12px;color:#c4c6b7}.app-link{padding:13px 18px;border:1px solid #625b37;border-radius:4px;font-size:12px}.menu{display:none}.hero{min-height:690px;position:relative;isolation:isolate;max-width:1700px;margin:auto;background:#242513}.hero-photo,.shade{position:absolute;inset:0;width:100%;height:100%;z-index:-2}.hero-photo{object-fit:cover;object-position:68% 43%}.shade{z-index:-1;background:linear-gradient(90deg,#0c0d09 0%,#0c0d09ef 23%,#0c0d0960 58%,#0c0d0905),linear-gradient(0deg,#0c0d09bc,transparent 40%)}.hero-copy{max-width:1440px;margin:auto;padding:73px 5% 110px}.eyebrow{font-size:9px;letter-spacing:2px;color:var(--yellow);line-height:1.8;font-weight:600}h1{font-size:clamp(60px,7.4vw,110px);line-height:1;letter-spacing:-5.5px;font-weight:500;margin:27px 0}em{color:var(--yellow);font-family:Georgia,serif;font-weight:400}.hero-copy>p{max-width:430px;font-size:15px;line-height:1.9;color:#c6c7b9;margin:26px 0 30px}.actions{display:flex;align-items:center;gap:26px}.primary{display:inline-flex;align-items:center;justify-content:space-between;gap:35px;padding:18px 21px;border-radius:4px;background:var(--yellow);color:#17180c;font-size:12px;font-weight:700}.primary:hover{background:#ffe281;transform:translateY(-2px)}.watch{font-size:12px}.watch>span{display:inline-grid;place-items:center;width:31px;height:31px;border:1px solid #7c7e58;border-radius:50%;font-size:9px;color:var(--yellow);margin-right:8px}.mode{font-size:8px;letter-spacing:1.2px;margin-top:28px;color:#acb095}.mode>span{margin:0 13px}.image-caption{position:absolute;right:5%;bottom:94px;border-left:2px solid var(--yellow);padding-left:15px}.image-caption small{font-size:8px;letter-spacing:2px;color:var(--yellow)}.image-caption strong{display:block;font-size:17px;font-weight:400;margin-top:7px}.credit{position:absolute;right:5%;bottom:43px;font-size:8px;color:#d0cfb7}.scroll{position:absolute;bottom:26px;left:5%;font-size:8px;letter-spacing:2px;color:#c3c6ac}.principles{max-width:1440px;margin:auto;padding:26px 5%;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #3a3d29;border-bottom:1px solid #3a3d29;font-size:9px;letter-spacing:1.6px;color:#c4c8b2}.principles b{font-size:23px;color:var(--yellow)}.section{max-width:1440px;margin:auto;padding:90px 5%}h2{font-size:clamp(32px,3.7vw,54px);line-height:1.12;font-weight:450;letter-spacing:-2px;margin:20px 0}h2>span{color:#979e82}.intro{display:grid;grid-template-columns:1.1fr 1fr;gap:80px;padding-bottom:35px}.intro-copy{padding-top:28px}p{font-size:13px;line-height:1.9;color:var(--muted)}.intro-copy .lead{font-size:20px;line-height:1.6;color:#e0e4d2}.underlined{display:flex;justify-content:space-between;max-width:280px;font-size:12px;color:var(--yellow);padding:14px 0;border-bottom:1px solid #83713d;margin-top:22px}.steps{padding-top:25px;display:grid;grid-template-columns:repeat(3,1fr);gap:44px}.steps article{border-top:1px solid #3b402b;padding-top:22px}.steps article>span{font-size:12px;color:var(--yellow)}h3{font-size:19px;font-weight:500;letter-spacing:-.4px}.steps p{font-size:12px;max-width:300px}.hive{background:#171a10;max-width:none;padding-left:max(5%,calc((100% - 1296px)/2));padding-right:max(5%,calc((100% - 1296px)/2))}.section-title{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-bottom:35px}.section-title>p{margin-bottom:24px}.bee-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.bee-grid article{border:1px solid #454a2e;background:#1c2013;padding:28px;border-radius:7px;transition:transform .2s,border-color .2s}.bee-grid article:hover{transform:translateY(-5px);border-color:#b49d45}.bee-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:33px}.bee-icon{display:grid;place-items:center;width:68px;height:75px;font-size:38px;color:var(--yellow);background:#f8ce3615;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}.bee-head small{font-size:8px;letter-spacing:1px;color:#a0a98b}.bee-grid .eyebrow{font-size:8px}.bee-grid h3{font-size:32px;margin:12px 0}.bee-grid h3>span{font-size:22px;color:#919c79}.bee-grid p{font-size:12px}.bee-grid a{display:flex;justify-content:space-between;border-top:1px solid #41482d;padding-top:20px;margin-top:28px;font-size:11px;color:var(--yellow)}.hive-foot{display:flex;justify-content:space-between;gap:25px;margin-top:27px}.hive-foot>span{font-size:8px;letter-spacing:1px;color:#a0ab88}.hive-foot a{font-size:11px;color:var(--yellow)}.evidence{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.evidence figure{margin:0;position:relative;min-height:570px;align-self:stretch;overflow:hidden;border-radius:5px}.evidence img{position:absolute;width:100%;height:100%;object-fit:cover;object-position:60% center}.evidence figure:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,#000c,transparent 50%)}figcaption{position:absolute;bottom:25px;left:25px;z-index:1;color:#ffdc64;font-size:9px;letter-spacing:2px}figcaption small{display:block;font-size:8px;letter-spacing:0;margin-top:12px;color:#e0e3cf}.evidence ul{list-style:none;padding:0;margin:25px 0}.evidence li{display:flex;gap:18px;border-top:1px solid #363d27;padding:16px 0}.evidence li>span{font-size:24px;color:var(--yellow)}.evidence li h3{font-size:14px;margin:0 0 7px}.evidence li p{font-size:12px;margin:0}.faq{display:grid;grid-template-columns:1fr 1.3fr;gap:90px;border-top:1px solid #363e25}.faq details{padding:22px 0;border-bottom:1px solid #3b442b}.faq summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:20px;font-size:15px}.faq summary::-webkit-details-marker{display:none}.faq summary>span{font-size:22px;color:var(--yellow)}.faq details[open] summary>span{transform:rotate(45deg)}.faq details p{padding-right:30px}.closing{position:relative;overflow:hidden;max-width:1440px;margin:0 auto 65px;padding:65px 5%;border-top:1px solid #62582f;border-bottom:1px solid #62582f;background:#f8ce360c}.closing h2{font-size:clamp(40px,5.3vw,76px);margin:20px 0 30px}.closing p{font-size:11px}.closing>:not(.comb){position:relative;z-index:1}.comb{position:absolute;right:4%;top:-140px;font-size:580px;color:#f8ce3610;line-height:1;transform:rotate(-15deg)}footer{max-width:1440px;margin:auto;padding:0 5% 28px}.footer-top{display:flex;justify-content:space-between;gap:30px;align-items:center;margin-bottom:35px}.footer-top .brand{gap:0}footer nav{display:flex;gap:27px;font-size:11px;color:#bec8a8}.risk{max-width:1000px;font-size:11px;color:#99a584;margin-bottom:28px}.risk b{color:#c7d1b5}.footer-bottom{display:flex;justify-content:space-between;gap:22px;border-top:1px solid #38422b;padding-top:22px;font-size:8px;line-height:1.8;color:#96a17d}.footer-bottom>span:last-child{letter-spacing:1px}a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--yellow);outline-offset:5px}@media(max-width:900px){header{gap:20px}header nav{gap:17px;font-size:11px}.intro,.evidence,.faq{gap:35px}.principles{font-size:8px;letter-spacing:.6px}.bee-grid article{padding:20px}.footer-bottom>span:last-child{display:none}}@media(max-width:650px){header{height:80px;padding:0 6%;gap:15px}.brand{font-size:24px}.logo{font-size:39px}.app-link{margin-left:auto;padding:10px;font-size:10px}.menu{display:block;background:none;color:var(--yellow);border:0;padding:8px 0;font-size:11px}header nav{display:none;position:absolute;top:80px;left:0;right:0;z-index:5;padding:25px 6%;background:#12150e;border-bottom:1px solid #625b37;flex-direction:column;gap:24px}header nav.open{display:flex}.hero{min-height:740px}.hero-copy{padding:55px 6% 190px}.hero-photo{object-position:65% center}.shade{background:linear-gradient(90deg,#0c0d09ef,#0c0d0980),linear-gradient(0deg,#0c0d09,transparent 80%)}h1{font-size:65px;letter-spacing:-3.7px}.hero-copy>p{max-width:320px;font-size:14px}.actions{flex-wrap:wrap;gap:22px}.primary{font-size:11px;padding:17px 19px}.mode{font-size:7px;letter-spacing:.7px}.mode>span{margin:0 8px}.image-caption{left:6%;right:auto;bottom:88px}.credit{left:6%;right:auto;bottom:52px;font-size:7px}.scroll{left:6%;bottom:22px}.principles{flex-wrap:wrap;justify-content:center;gap:18px;padding:22px 6%}.principles b{font-size:15px}.principles b:nth-of-type(2){display:none}.section{padding:60px 6%}.intro,.evidence,.faq{grid-template-columns:1fr;gap:20px}.intro{padding-bottom:25px}.intro-copy{padding-top:0}.intro-copy .lead{font-size:18px}h2{font-size:37px;letter-spacing:-1.5px}.steps{grid-template-columns:1fr;padding-top:10px;gap:24px}.steps p{max-width:none}.section-title{display:block}.bee-grid{grid-template-columns:1fr;gap:16px}.bee-grid article{padding:26px}.bee-head{margin-bottom:20px}.hive-foot{flex-direction:column;gap:20px}.hive-foot>span{line-height:1.8}.evidence figure{min-height:390px}.evidence>div{padding-top:20px}.closing{padding:48px 6%;margin-bottom:45px}.closing h2{font-size:43px}.comb{right:-260px}.footer-top{flex-direction:column;align-items:flex-start}footer nav{flex-wrap:wrap;gap:20px}.footer-bottom{flex-direction:column;gap:10px}.eyebrow{font-size:8px;letter-spacing:1.5px}}@media(prefers-reduced-motion:reduce){:global(html){scroll-behavior:auto}*{transition:none!important}.primary:hover,.bee-grid article:hover{transform:none}}
</style>
```

## web/src/routes/ecosystem/+page.server.ts

```typescript
// web/src/routes/ecosystem/+page.server.ts
import type {PageServerLoad} from './$types';
import {ecosystemLinks} from '$lib/content';
import {CONTENT_UPDATED,SITE} from '$lib/seo';
export const load:PageServerLoad=async({parent})=>{
 const data=await parent();return {links:ecosystemLinks,published:CONTENT_UPDATED,modified:CONTENT_UPDATED,seo:{...data.seo,schema:[...(data.seo?.schema??[]),{'@type':'CollectionPage','@id':SITE+'/ecosystem#directory',url:SITE+'/ecosystem',name:'E-WIN ecosystem directory',description:'Related platforms listed by the parent E-WIN Project. A directory link does not verify current availability or shared account access.',datePublished:CONTENT_UPDATED,dateModified:CONTENT_UPDATED,mainEntity:ecosystemLinks.map(link=>({'@type':'WebSite',name:link.title,url:link.href}))}]}};
};
```

## web/src/routes/ecosystem/+page.svelte

```svelte
<!-- web/src/routes/ecosystem/+page.svelte -->
<script lang="ts">
 import PageTemplate from '$lib/components/PageTemplate.svelte';
 import RelatedLinks from '$lib/components/RelatedLinks.svelte';
 let {data}=$props();
</script>
<PageTemplate title="How does OmieBot connect to the E-WIN ecosystem?" summary="OmieBot Trading is part of the Elite Workforce Impact Nigeria (E-WIN) Project Ecosystem. This directory links the parent and its listed sister platforms; it does not imply shared wallets, subscriptions or verified current availability." published={data.published} modified={data.modified} sources={[{title:'E-WIN parent discovery registry',href:'https://ewinproject.org/llms.txt'}]}>
 <nav aria-label="Application navigation"><a href="/">OmieBot home</a> · <a href="/paper">Paper Workspace</a></nav>
 <h2 id="directory-source">Where do these platform links come from?</h2><p>The parent discovery registry lists these platforms. Each service has its own access rules and data policies. A listing does not grant account access or establish an integration.</p>
 <RelatedLinks title="Which sister platforms are listed?" links={data.links}/>
</PageTemplate>
```

## web/src/routes/sitemap.xml/+server.ts

```typescript
// web/src/routes/sitemap.xml/+server.ts
import { CONTENT_UPDATED, publicPages, SITE } from '$lib/seo';
import type { RequestHandler } from './$types';
/** Build-time source registry avoids database scans and request-time Function work. */
export const prerender = true;
export const GET: RequestHandler = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map(page => `<url><loc>${SITE}${page.path === '/' ? '/' : page.path}</loc><lastmod>${CONTENT_UPDATED}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
```

## web/src/routes/rss.xml/+server.ts

```typescript
// web/src/routes/rss.xml/+server.ts
import { CONTENT_UPDATED, publicPages, SITE } from '$lib/seo';
import type { RequestHandler } from './$types';
export const prerender = true;
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Feed describes editorial resources, never pretends to be a live order feed. */
export const GET: RequestHandler = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>OmieBot Trading public resources</title><link>${SITE}/</link><description>Paper trading documentation and research resources. Trading returns are not guaranteed.</description><language>en-NG</language><lastBuildDate>${new Date(`${CONTENT_UPDATED}T00:00:00Z`).toUTCString()}</lastBuildDate><atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>${publicPages.map(page => `<item><title>${escape(page.title)}</title><link>${SITE}${page.path}</link><guid isPermaLink="true">${SITE}${page.path}</guid><description>${escape(page.description)}</description></item>`).join('')}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
```

## web/src/routes/api/notifications/+server.ts

```typescript
// web/src/routes/api/notifications/+server.ts
import {json,error} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {authEnv,verifyToken,sameOrigin} from '$lib/server/auth';
import {parseSubscription,deliverPush} from '$lib/server/push';
async function store(env:ReturnType<typeof authEnv>,owner:string,operation:string,subscription?:unknown){
 if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)throw error(503,'Notification storage unavailable');
 const r=await fetch(env.EDGE_RUNTIME_URL+'/notifications',{method:'POST',headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({owner,operation,subscription}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw error(503,'Notification storage temporarily unavailable');return r.json();
}
export const GET:RequestHandler=async({cookies,platform})=>{
 const env=authEnv(platform),user=await verifyToken(env,cookies.get('omiebot_session')??'');if(!user)throw error(401,'Sign in required');
 return json({publicKey:env.VAPID_PUBLIC_KEY??null,configured:!!env.VAPID_PRIVATE_KEY},{headers:{'Cache-Control':'private, no-store'}});
};
export const POST:RequestHandler=async({request,cookies,platform,url})=>{
 const env=authEnv(platform);
 const internal=!!env.WORKFLOW_CALLBACK_SECRET&&request.headers.get('Authorization')===`Bearer ${env.WORKFLOW_CALLBACK_SECRET}`;
 const user=internal?null:await verifyToken(env,cookies.get('omiebot_session')??'');
 if(!internal&&!user)throw error(401,'Sign in required');if(!internal&&!sameOrigin(request,url))throw error(403,'Origin rejected');
 const text=await request.text();if(text.length>6000)throw error(413,'Request too large');let body;try{body=JSON.parse(text);}catch{throw error(400,'Invalid JSON');}
 const owner=internal?body.owner:user!.sub;if(typeof owner!=='string'||owner.length>256)throw error(400,'Invalid owner');
 if(internal&&body.operation!=='deliver')throw error(403,'Internal operation rejected');
 if(body.operation==='subscribe'){let subscription;try{subscription=parseSubscription(body.subscription);}catch{throw error(400,'Invalid push subscription');}await store(env,owner,'subscribe',subscription);return json({saved:true},{headers:{'Cache-Control':'no-store'}});}
 if(body.operation==='unsubscribe'){let subscription;try{subscription=parseSubscription(body.subscription);}catch{throw error(400,'Invalid push subscription');}await store(env,owner,'unsubscribe',subscription);return json({removed:true});}
 if(body.operation==='test'||internal){const subscriptions=await store(env,owner,'read');const results=await deliverPush(env,subscriptions);for(const result of results.filter(r=>r.expired)){const sub=subscriptions.find((s:any)=>s.endpoint===result.endpoint);await store(env,owner,'unsubscribe',sub);}return json({accepted:results.filter(r=>r.accepted).length,devices:results.length,deviceReceiptVerified:false},{headers:{'Cache-Control':'no-store'}});}
 throw error(400,'Unknown notification action');
};
```

## web/src/routes/api/workflows/+server.ts

```typescript
// web/src/routes/api/workflows/+server.ts
import { json,error } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { authEnv,verifyToken,signToken,sameOrigin } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async({cookies,platform})=>{
  const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
  if(!user)throw error(401,'Sign in required');if(user.role!=='admin')throw error(403,'Administrator access required');
  const client=new ConvexHttpClient(PUBLIC_CONVEX_URL);client.setAuth(await signToken(env,user));
  return json(await client.query(makeFunctionReference<any>('workflows:list'),{}),{headers:{'Cache-Control':'private, no-store'}});
};
export const POST:RequestHandler=async({request,url,cookies,platform})=>{
  const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
  if(!user)throw error(401,'Sign in required');if(user.role!=='admin')throw error(403,'Administrator access required');if(!sameOrigin(request,url))throw error(403,'Origin rejected');
  const text=await request.text();if(text.length>256)throw error(413,'Request too large');
  let input;try{input=JSON.parse(text);}catch{throw error(400,'Invalid JSON');}if(!['training','verification','all'].includes(input?.kind))throw error(400,'Invalid workflow');
  const client=new ConvexHttpClient(PUBLIC_CONVEX_URL);client.setAuth(await signToken(env,user));
  return json(await client.mutation(makeFunctionReference<any>('workflows:start'),{kind:input.kind}),{headers:{'Cache-Control':'private, no-store'}});
};
```

## web/convex/workflows.ts

```typescript
// web/convex/workflows.ts
import { queryGeneric as query, mutationGeneric as mutation, internalMutationGeneric as internalMutation, internalActionGeneric as internalAction, makeFunctionReference } from 'convex/server';
import { v } from 'convex/values';
const kind = v.union(v.literal('training'),v.literal('verification'),v.literal('all'));
async function guard(ctx:any) {
  const user = await ctx.auth.getUserIdentity();
  if (!user || user.emailVerified !== true || !process.env.SUPER_ADMIN_EMAIL || user.email?.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL.toLowerCase()) throw new Error('Administrator access required');
  return user;
}
export const list = query({ args:{}, handler:async(ctx) => {
  const user = await guard(ctx);
  return ctx.db.query('workflowJobs').withIndex('owner_created',q=>q.eq('owner',user.subject)).order('desc').take(11);
}});
export const start = mutation({ args:{kind}, handler:async(ctx,args) => {
  const user = await guard(ctx), now = Date.now();
  const recent = await ctx.db.query('workflowJobs').withIndex('owner_created',q=>q.eq('owner',user.subject)).order('desc').take(11);
  const active = recent.find(job => job.status === 'queued' || job.status === 'running');
  if (active) return {jobId:active._id,existing:true};
  if (recent.filter(job=>job.createdAt > now-86400000).length >= 10) throw new Error('Daily limit of 10 workflow starts reached');
  if (!process.env.GITHUB_WORKFLOW_TOKEN || !process.env.WORKFLOW_CALLBACK_SECRET) throw new Error('Workflow dispatch is not configured');
  const jobId = await ctx.db.insert('workflowJobs',{owner:user.subject,kind:args.kind,status:'queued',message:'Awaiting external runner',createdAt:now,updatedAt:now});
  await ctx.scheduler.runAfter(0,makeFunctionReference<'action'>('workflows:dispatch') as any,{jobId,kind:args.kind});
  await ctx.scheduler.runAfter(20*60*1000,makeFunctionReference<'mutation'>('workflows:expire') as any,{jobId});
  return {jobId,existing:false};
}});
export const expire = internalMutation({args:{jobId:v.id('workflowJobs')},handler:async(ctx,{jobId})=>{
  const job=await ctx.db.get(jobId);
  if(job && (job.status==='queued'||job.status==='running'))await ctx.db.patch(jobId,{status:'failed',message:'Runner did not report completion within 20 minutes. Inspect GitHub Actions before retrying.',updatedAt:Date.now()});
}});
export const transition = internalMutation({args:{jobId:v.id('workflowJobs'),status:v.union(v.literal('running'),v.literal('succeeded'),v.literal('failed')),message:v.string()},handler:async(ctx,args)=>{
  const job = await ctx.db.get(args.jobId);
  if (!job) throw new Error('Unknown workflow');
  if (args.message.length > 500) throw new Error('Message exceeds limit');
  if (job.status === args.status) return {changed:false};
  if (job.status === 'succeeded' || job.status === 'failed') return {changed:false};
  if (args.status === 'succeeded' && job.status !== 'running') throw new Error('Workflow has not started');
  await ctx.db.patch(args.jobId,{status:args.status,message:args.message,updatedAt:Date.now()});
  return {changed:true};
}});
export const dispatch = internalAction({args:{jobId:v.id('workflowJobs'),kind},handler:async(ctx,args)=>{
  try {
    const response = await fetch('https://api.github.com/repos/Omaledanjumaogale/beebots/actions/workflows/omiebot-operations.yml/dispatches',{method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_WORKFLOW_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify({ref:'codex/production-omiebot',inputs:{job_id:args.jobId,kind:args.kind}}),signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`Runner dispatch returned ${response.status}`);
  } catch {
    await ctx.runMutation(makeFunctionReference<'mutation'>('workflows:transition') as any,{jobId:args.jobId,status:'failed',message:'External runner dispatch failed. Check operator configuration.'});
  }
}});
export const notify = internalAction({args:{owner:v.string()},handler:async(_ctx,{owner})=>{
  if(!process.env.WORKFLOW_CALLBACK_SECRET)return {accepted:false};
  try{const response=await fetch('https://omiebot.ewinproject.org/api/notifications',{method:'POST',headers:{Authorization:`Bearer ${process.env.WORKFLOW_CALLBACK_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({owner,operation:'deliver'}),signal:AbortSignal.timeout(15000)});return {accepted:response.ok};}catch{return {accepted:false};}
}});
export const notificationOwner = internalMutation({args:{jobId:v.id('workflowJobs')},handler:async(ctx,{jobId})=>{const job=await ctx.db.get(jobId);return job?.owner??null;}});
```

## web/convex/http.ts

```typescript
// web/convex/http.ts
import { httpRouter, httpActionGeneric as httpAction, makeFunctionReference } from 'convex/server';
const http = httpRouter();
http.route({path:'/operations/callback',method:'POST',handler:httpAction(async(ctx,request)=>{
  const secret = process.env.WORKFLOW_CALLBACK_SECRET;
  if (!secret || request.headers.get('Authorization') !== `Bearer ${secret}`) return new Response('Unauthorized',{status:401});
  const text = await request.text();
  if (text.length > 2000) return new Response('Too large',{status:413});
  let input:any; try { input=JSON.parse(text); } catch { return new Response('Invalid JSON',{status:400}); }
  if (!input || typeof input.jobId !== 'string' || !['running','succeeded','failed'].includes(input.status) || typeof input.message !== 'string' || input.message.length > 500) return new Response('Invalid callback',{status:400});
  try { const transition=await ctx.runMutation(makeFunctionReference<'mutation'>('workflows:transition') as any,input);
    if(transition.changed&&['succeeded','failed'].includes(input.status)){
      const owner=await ctx.runMutation(makeFunctionReference<'mutation'>('workflows:notificationOwner') as any,{jobId:input.jobId});
      if(owner)await ctx.scheduler.runAfter(0,makeFunctionReference<'action'>('workflows:notify') as any,{owner});
    }
  }
  catch { return new Response('Invalid transition',{status:400}); }
  return new Response('Accepted',{headers:{'Cache-Control':'no-store'}});
})});
export default http;
```

## web/src/service-worker.ts

```typescript
// web/src/service-worker.ts
/// <reference lib="webworker" />
import {build,version} from '$service-worker';
import {publicOfflineRoutes} from '../static-routes.mjs';
const worker=self as unknown as ServiceWorkerGlobalScope;
const name='omiebot-public-'+version,offline='/offline.html';
const publicPaths=new Set<string>(publicOfflineRoutes);
// Never cache API responses, credentials, account mutations or private page shells.
worker.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(name);
 await cache.addAll([...build,...publicOfflineRoutes,offline]);
})()));
worker.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('omiebot-public-')&&key!==name)await caches.delete(key);
 await worker.clients.claim();
})()));
worker.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==worker.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/.well-known/'))return;
 if(request.mode==='navigate'&&publicPaths.has(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(name);
   try{const response=await fetch(request);if(response.ok){await cache.put(url.pathname,response.clone());return response;}return await cache.match(url.pathname)??await cache.match(offline)??response;}
   catch{return await cache.match(url.pathname)??await cache.match(offline)??new Response('Offline',{status:503});}
  })());
 }else if(build.includes(url.pathname))event.respondWith((async()=>await(await caches.open(name)).match(url.pathname)??fetch(request))());
});

worker.addEventListener('push',event=>{
 let message:{title?:string;body?:string;url?:string}={};try{message=event.data?.json()??{};}catch{}
 event.waitUntil(worker.registration.showNotification(message.title??'OmieBot update',{body:message.body??'Sign in to review your workflow status.',icon:'/favicon.svg',tag:'omiebot-workflow',data:{url:'/admin'}}));
});
worker.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(worker.clients.openWindow('/admin'));});
```

## web/static/robots.txt

```text
# web/static/robots.txt
# Private access is enforced by authentication; these rules limit indexing only.
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: PerplexityBot
User-agent: OAI-SearchBot
User-agent: Google-Extended
User-agent: Anthropic-AI
User-agent: cohere-ai
User-agent: YouBot
User-agent: DuckAssistBot
User-agent: Applebot-Extended
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /auth
Disallow: /login
Disallow: /dashboard
Disallow: /terminal
Disallow: /invest
Disallow: /live
Disallow: /connect/

Sitemap: https://omiebot.ewinproject.org/sitemap.xml
# The parent independently publishes and controls its own sitemap.
Sitemap: https://ewinproject.org/sitemap.xml
```

## web/static/llms.txt

```text
# web/static/llms.txt
# OmieBot Trading

> OmieBot Trading is a paper trading and research platform under the Elite Workforce Impact Nigeria (E-WIN) Project Ecosystem. It helps people inspect trading bots called Bees, simulated decisions and research evidence. Live customer trading, real deposits and withdrawals are not enabled. Trading can lose money; simulated results do not guarantee returns.

## Primary entities and topics
- OmieBot Trading: simulated trading workspaces, trading Bees and model research.
- Elite Workforce Impact Nigeria Project: the parent ecosystem.
- Omale Danjuma Ogale: Founder & CEO, as identified by the project owner.
- Drift, Rebound and Breaker: baseline paper trading Bees.

## Public pages
- [OmieBot Trading](https://omiebot.ewinproject.org/): product overview, paper mode and risk boundaries.
- [Paper Workspace](https://omiebot.ewinproject.org/paper): timestamped simulated decisions and paper activity; the shell may remain available when data services fail.
- [Trading Hive](https://omiebot.ewinproject.org/hive): recorded paper Bee decisions with freshness and abstention states.
- [Research Lab](https://omiebot.ewinproject.org/research): research integrations and candidate evaluation evidence.
- [E-WIN ecosystem directory](https://omiebot.ewinproject.org/ecosystem): parent and registered sister-platform destinations, with separate access and account boundaries.

## Ecosystem and attribution
- [E-WIN Project](https://ewinproject.org): mother application and ecosystem entry point.
- [BusineXense](https://businexense.ewinproject.org): registered business platform destination.
- [SchoolXense](https://schoolxense.ewinproject.org): registered education platform destination.
- [HealthCareOS](https://healthcareos.ewinproject.org): registered healthcare platform destination.
- [ProFileX](https://profilex.ewinproject.org): registered profile platform destination.
- [Alternative Akademy](https://altakademy.ewinproject.org): registered academy platform destination.
- [Omale Danjuma Ogale](https://omaledanjumaogale.ewinproject.org/): founder profile and attribution.
- [Extended source notes](https://omiebot.ewinproject.org/llms-full.txt): detailed definitions and citation guidance.
- [Public sitemap](https://omiebot.ewinproject.org/sitemap.xml): canonical public pages on this host.

## Freshness and scope
Editorial documentation updated 17 October 2026. Sister destinations are registered in the parent's public llms.txt; individual service health is not verified. Market observations carry their own timestamps; documentation dates do not establish live feed freshness. The runtime targets five-minute paper cycles while services and feeds are available. Private dashboards, accounts and credentials are not public sources. The parent and other platforms are independently operated; their current availability is not guaranteed here. No external crawler, search ranking or AI citation is guaranteed.

Attribution: OmieBot Trading, part of the E-WIN Project Ecosystem. Use the founder profile above for the published contact channel; no private contact address is supplied.
```

## web/static/llms-full.txt

```text
# web/static/llms-full.txt
# OmieBot Trading: public source guide

Canonical home: https://omiebot.ewinproject.org/
Editorial revision: 2026-10-17
Primary language: English (Nigeria). Other translated editions are not currently claimed.

## What is OmieBot Trading?
OmieBot Trading is a paper trading and research platform in the Elite Workforce Impact Nigeria (E-WIN) Project Ecosystem. It exposes simulated bot decisions, defined risk boundaries and research evidence. The current public workspace uses simulated capital. Real customer deposits, withdrawals and live customer order execution are not enabled.

## What can readers cite?
The landing page https://omiebot.ewinproject.org/ explains the product and current operating boundaries. The Paper Workspace https://omiebot.ewinproject.org/paper shows simulated decisions. The Trading Hive https://omiebot.ewinproject.org/hive shows recorded activity for Drift, Rebound and Breaker. The Research Lab https://omiebot.ewinproject.org/research explains research integrations and evidence limitations. Cite the exact page and observation timestamp for changing runtime data.

## What is a paper trading Bee?
A Bee is a bot with a named strategy and recorded decisions. Drift follows trends, Rebound studies recovery and mean reversion, and Breaker watches for breakouts. A Bee may abstain when required data is unavailable or its conditions are not satisfied. A label identifying a model provider does not establish that independently trained profitable strategies exist.

## Is a paper result a promised return?
No. Paper trading simulates decisions, costs and positions. It does not prove that a real order could fill at the simulated price. Training and backtests do not guarantee live performance or returns. Trading can lose capital.

## Data, training and freshness
Paper data ingestion uses timestamped market bars. The runtime targets five-minute cycles while provider and platform services are available. Research candidates require evaluation; an unsuccessful evaluation must not be described as deployment success. Model fitting runs outside the request-serving Worker. Market and training artifacts are retained privately; public views expose limited projections. A build or editorial date is not a market quote timestamp. Missing or stale feeds should be interpreted as unavailable evidence.

## Author and organization
The project owner identifies Omale Danjuma Ogale as Founder & CEO. Published profile: https://omaledanjumaogale.ewinproject.org/ . No professional investment credential is claimed here.
Parent: Elite Workforce Impact Nigeria Project, https://ewinproject.org . Owner-supplied legal name: Elite Workforce Enterprises and Digital Emerging Arbitrage & Leverage Services.
OmieBot's relationship with the parent is described on this site. This document does not verify the availability or implementation of every sister application. Visit the parent for its current directory.

## Topic clusters
Entry and risk literacy: home -> Paper Workspace -> Trading Hive.
Research literacy: home -> Research Lab -> timestamped candidate evidence.
Ecosystem identity: OmieBot -> E-WIN Project -> founder profile.
Private account connection and administration are excluded from the public citation index.

## Registered sister-platform destinations
The mother's public https://ewinproject.org/llms.txt registers the following destinations. This is a directory relationship, not a claim of verified current service health, shared sign-in or shared balances.
- BusineXense: https://businexense.ewinproject.org
- SchoolXense: https://schoolxense.ewinproject.org
- HalalMatch: https://halalmatch.ewinproject.org
- Alternative Akademy: https://altakademy.ewinproject.org
- DealxHire: https://dealxhire.ewinproject.org
- ProFileX: https://profilex.ewinproject.org
- HealthCareOS: https://healthcareos.ewinproject.org
- AuditorX: https://auditorx.ewinproject.org
- NewXTrade: https://newxtrade.ewinproject.org
- OmieOmniMarketer: https://omieomnimarketer.ewinproject.org
- BabaAgent: https://babaagent.ewinproject.org
- VantagePoint: https://vantagepoint.ewinproject.org
- PulseOdds: https://pulseodds.ewinproject.org
OmieBot's visible directory is https://omiebot.ewinproject.org/ecosystem . Visit each destination for its own access policy and current product details.

## Licensing and use
Public facts may be cited with a direct link and timestamp. This guide grants no blanket license to market data, provider feeds, proprietary source code or third-party materials. Honeycomb photography is attributed on the landing page to Matthew T Rader under CC BY-SA 4.0, resized. Follow the linked image license for reuse. Do not extract credentials, account balances or private user information.

## Discovery resources
Index: https://omiebot.ewinproject.org/llms.txt
Sitemap: https://omiebot.ewinproject.org/sitemap.xml
Feed: https://omiebot.ewinproject.org/rss.xml
Agent metadata: https://omiebot.ewinproject.org/.well-known/ai-agent-manifest.json
This metadata is informational, not a standard authorization grant or a guarantee that an AI service will cite this site.
```

## web/static/.well-known/ai-agent-manifest.json

```json
// web/static/.well-known/ai-agent-manifest.json
{
 "name": "OmieBot Trading",
 "url": "https://omiebot.ewinproject.org/",
 "description": "Paper trading Bees, recorded decisions and research evidence within the E-WIN Project Ecosystem.",
 "language": "en-NG",
 "capabilities": ["public product documentation", "paper trading observation", "research evidence"],
 "limitations": ["No live customer trading", "No guaranteed returns", "No authorization to access private accounts"],
 "llms_txt": "https://omiebot.ewinproject.org/llms.txt",
 "llms_full_txt": "https://omiebot.ewinproject.org/llms-full.txt",
 "sitemap": "https://omiebot.ewinproject.org/sitemap.xml",
 "rss": "https://omiebot.ewinproject.org/rss.xml",
 "parent": {"name": "Elite Workforce Impact Nigeria Project", "url": "https://ewinproject.org"},
 "ecosystem_directory": "https://omiebot.ewinproject.org/ecosystem",
 "ecosystem_registry_source": "https://ewinproject.org/llms.txt",
 "author": {"name": "Omale Danjuma Ogale", "role": "Founder & CEO", "url": "https://omaledanjumaogale.ewinproject.org/"},
 "contact": {"url": "https://omaledanjumaogale.ewinproject.org/"},
 "editorial_updated": "2026-10-17",
 "notice": "Informational discovery metadata, not an authorization or an adopted universal agent manifest standard."
}
```

## web/scripts/static-contract.mjs

```javascript
// web/scripts/static-contract.mjs
import {readFile,writeFile,access} from 'node:fs/promises';
import {staticRoutes,dynamicRoutes} from '../static-routes.mjs';
const root=new URL('../.svelte-kit/cloudflare/',import.meta.url);
const routes=JSON.parse(await readFile(new URL('_routes.json',root),'utf8'));
if(JSON.stringify(routes.include)!==JSON.stringify(dynamicRoutes))throw Error('Only protected API and discovery paths may invoke Functions');
for(const route of staticRoutes){
 const file=route==='/'?'index.html':route.slice(1)+'.html';
 const html=await readFile(new URL(file,root),'utf8');
 if(!html.includes('<html')||!html.includes('OmieBot'))throw Error('Missing static shell: '+route);
 if(!routes.exclude.includes(route))throw Error('Shell is not excluded from Functions: '+route);
}
const recovery=await readFile(new URL('../static/offline.html',import.meta.url),'utf8');
await writeFile(new URL('404.html',root),recovery);
await access(new URL('service-worker.js',root));
for(const file of ['robots.txt','llms.txt','llms-full.txt','sitemap.xml','rss.xml','.well-known/ai-agent-manifest.json','images/omiebot-social.png'])await access(new URL(file,root));
for(const route of ['/','/paper','/hive','/research','/ecosystem']){
 const html=await readFile(new URL(route==='/'?'index.html':route.slice(1)+'.html',root),'utf8');
 if((html.match(/application\/ld\+json/g)??[]).length!==1||!html.includes('rel="canonical"'))throw Error('Missing or duplicate server-rendered graph/canonical: '+route);
}
if(!recovery.includes('Service temporarily limited'))throw Error('Recovery page unavailable');
const privateRoutes=new Set(['/admin','/invest','/invest/terms','/live','/login','/connect/okx','/terminal']);
const headers=staticRoutes.map(route=>`${route}\n  X-Omie-Shell: static-v2\n  X-Robots-Tag: ${privateRoutes.has(route)?'noindex, nofollow, noarchive':'index, follow'}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY`).join('\n\n');
// The adapter owns _routes.json; append only exact static-route headers.
const headerPath=new URL('_headers',root),existing=await readFile(headerPath,'utf8').catch(()=>'');
if(!existing.includes('X-Omie-Shell: static-v2'))await writeFile(headerPath,existing+'\n'+headers+'\n/service-worker.js\n  Cache-Control: no-cache\n');
console.log(`Static contract passed: ${staticRoutes.length} HTML shells, API-only Functions routing, recovery page and public-only service worker.`);
```

## web/scripts/verify-deployment.mjs

```javascript
// web/scripts/verify-deployment.mjs
import {staticRoutes} from '../static-routes.mjs';
const base=process.env.OMIE_PRODUCTION_URL||'https://omiebot.ewinproject.org';
const checks=[];
for(const path of staticRoutes){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)}),html=await r.text();
 checks.push({path,status:r.status,static:r.headers.get('X-Omie-Shell')==='static-v2',pass:r.status===200&&r.headers.get('Content-Type')?.includes('text/html')&&html.includes('OmieBot')&&r.headers.get('X-Omie-Shell')==='static-v2'});
}
const missing=await fetch(base+'/missing-omiebot-recovery-check',{signal:AbortSignal.timeout(15000)}),body=await missing.text();
checks.push({path:'unknown public route',status:missing.status,pass:missing.status===404&&body.includes('Service temporarily limited')&&body.includes('Paper Workspace')});
for(const path of ['/api/control?view=admin-overview','/api/workspaces?view=live','/api/market?type=ticker&symbol=BTC-USDT','/api/runtime/admin/status']){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
 checks.push({path,status:r.status,protected:true,pass:r.status===401});
}
console.log(JSON.stringify({at:new Date().toISOString(),base,checks},null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
```

## web/static-routes.mjs

```javascript
// web/static-routes.mjs
export const staticRoutes=['/','/terminal','/paper','/live','/hive','/research','/invest','/invest/terms','/admin','/login','/connect/okx','/ecosystem'];
export const publicOfflineRoutes=['/','/paper','/hive','/research','/terminal','/ecosystem'];
export const dynamicRoutes=['/api/*','/.well-known/*'];
```

## .github/workflows/omiebot-operations.yml

```yaml
# .github/workflows/omiebot-operations.yml
name: OmieBot administrator operations
on:
  workflow_dispatch:
    inputs:
      job_id:
        description: Convex workflow job ID
        required: true
        type: string
      kind:
        description: Operation sequence
        required: true
        type: choice
        options: [training, verification, all]
permissions:
  contents: read
concurrency:
  group: omiebot-administrator-operations
  cancel-in-progress: false
jobs:
  operate:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      OMIE_CF_ACCOUNT_ID: ${{ secrets.OMIE_CF_ACCOUNT_ID }}
      OMIE_R2_API_TOKEN: ${{ secrets.OMIE_R2_API_TOKEN }}
      OMIE_WORKFLOW_CALLBACK_SECRET: ${{ secrets.OMIE_WORKFLOW_CALLBACK_SECRET }}
      OMIE_CONVEX_SITE_URL: ${{ secrets.OMIE_CONVEX_SITE_URL }}
      OMIE_JOB_ID: ${{ inputs.job_id }}
      OMIE_OPERATION: ${{ inputs.kind }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: codex/production-omiebot
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node scripts/run-operations.mjs
```

## web/test/seo.test.ts

```typescript
// web/test/seo.test.ts
import { describe, expect, it } from 'vitest';
import { buildMeta, publicPages } from '../src/lib/seo';
import { buildPageGraph } from '../src/lib/schema/graph';
import { buildWebSiteSchema, buildOrganizationSchema, buildArticleSchema } from '../src/lib/schema/builders';
describe('public discovery trust boundaries', () => {
 it('keeps canonical URLs on the actual application host and strips tracking', () => {
  expect(buildMeta({path:'/paper?token=private#activity'}).canonical).toBe('https://omiebot.ewinproject.org/paper');
  expect(buildMeta({path:'//evil.example'}).canonical).toBe('https://omiebot.ewinproject.org/');
 });
 it('does not offer nonexistent search or index account pages', () => {
  expect(buildWebSiteSchema()).not.toHaveProperty('potentialAction');
  expect(publicPages.map(page => page.path)).toEqual(['/', '/paper', '/hive', '/research', '/ecosystem']);
  expect(buildMeta({noindex:true}).robots).toContain('noindex');
 });
 it('serializes hostile CMS strings without creating executable script markup', () => {
  const graph = buildPageGraph([{ '@type':'Article', description:'</script><script>alert(1)</script>' }]);
  expect(graph).not.toContain('<');
  expect(JSON.parse(graph)['@graph'][0].description).toBe('</script><script>alert(1)</script>');
 });
 it('merges entity references and uses supplied editorial dates', () => {
  const graph = JSON.parse(buildPageGraph([buildOrganizationSchema(),buildOrganizationSchema(),buildArticleSchema({title:'Evidence',description:'Paper only',url:'https://omiebot.ewinproject.org/research',published:'2026-10-16',modified:'2026-10-17'})]));
  expect(graph['@graph']).toHaveLength(2);
  expect(graph['@graph'][1].datePublished).toBe('2026-10-16');
 });
});
```

## Manual acceptance

<!-- MANUAL STEP --> Validate production rendered source, private authorization, Search Console submission, schema validation, mobile Core Web Vitals and actual device push receipt. No translation, search endpoint, shared wallet, guaranteed ROI or live order execution is introduced by this package.
