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
