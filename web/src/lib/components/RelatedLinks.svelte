<script lang="ts">
  export type RelatedLink = { title: string; href: string; description?: string };
  let { links, title = 'Where can you learn more?', id = 'related-links' }: { links: RelatedLink[]; title?: string; id?: string } = $props();
</script>
<nav aria-labelledby={id} class="related"><h2 {id}>{title}</h2><ul>{#each links as link}<li><a href={link.href}>{link.title}<span aria-hidden="true"> ↗</span></a>{#if link.description}<p>{link.description}</p>{/if}</li>{/each}</ul></nav>
<style>.related{margin-block:2rem}.related h2{font-size:1.5rem;color:#fafafa;margin-bottom:1rem}.related ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.8rem;list-style:none;padding:0}.related li{padding:1rem;border:1px solid #ffffff18;border-radius:.7rem}.related a{color:#facc15;text-decoration:underline;text-underline-offset:4px}.related p{color:#b3b3b3;font-size:.85rem;line-height:1.6;margin:.5rem 0 0}</style>
