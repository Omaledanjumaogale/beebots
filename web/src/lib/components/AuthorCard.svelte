<script lang="ts">
  let { name = 'Omale Danjuma Ogale', role = 'Founder & CEO', url = 'https://omaledanjumaogale.ewinproject.org/' }: { name?: string; role?: string; url?: string } = $props();
  // No unverified credentials, stock portrait, or social identity is asserted.
</script>
<aside class="author" aria-label="Author"><span class="avatar" aria-hidden="true">OD</span><div><span class="eyebrow">Published by</span><a href={url} rel="author">{name}</a><p>{role}</p></div></aside>
<style>.author{display:flex;align-items:center;gap:1rem;padding:1.25rem;border:1px solid #ffffff18;border-radius:.8rem;margin-block:2rem}.avatar{display:grid;place-items:center;width:3rem;height:3rem;border-radius:50%;background:#facc1518;color:#facc15;font-weight:700}.author a{display:block;color:#fafafa;text-decoration:underline;text-underline-offset:4px}.author p{margin:.25rem 0 0;color:#aaa;font-size:.85rem}.eyebrow{display:block;font-size:.7rem;color:#facc15;margin-bottom:.25rem}</style>
