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
