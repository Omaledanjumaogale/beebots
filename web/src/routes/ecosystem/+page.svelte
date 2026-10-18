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
