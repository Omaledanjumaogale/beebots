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
