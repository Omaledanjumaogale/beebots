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
