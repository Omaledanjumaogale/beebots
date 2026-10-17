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
