<script lang="ts">
  let { text, title = 'At a glance' }: { text: string; title?: string } = $props();
</script>
<aside class="answer" aria-label={title}><strong>{title}</strong><p>{text}</p></aside>
<style>.answer{padding:1.2rem 1.4rem;border-left:3px solid #facc15;border-radius:0 .8rem .8rem 0;background:#facc150a;color:#e5e5e5}.answer strong{color:#facc15;font-size:.8rem;letter-spacing:.05em}.answer p{margin:.5rem 0 0;line-height:1.75}</style>
