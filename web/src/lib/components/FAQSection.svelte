<script lang="ts">
  export type FAQItem = { question: string; answer: string; id?: string };
  let { items, title = 'What else should you know?', id = 'frequently-asked-questions' }: { items: FAQItem[]; title?: string; id?: string } = $props();
  // FAQ JSON-LD is assembled from these same items in the page load and head.
</script>
<section aria-labelledby={id} class="faq"><h2 {id}>{title}</h2>{#each items as item, index}<details><summary id={item.id ?? `${id}-${index + 1}`}>{item.question}</summary><p>{item.answer}</p></details>{/each}</section>
<style>.faq{margin-block:2.5rem}.faq h2{font-size:1.65rem;font-weight:650;color:#fafafa;margin-bottom:1rem}.faq details{border-bottom:1px solid #ffffff20}.faq summary{padding:1.1rem .25rem;color:#fafafa;cursor:pointer;font-weight:550;line-height:1.5}.faq summary:focus-visible{outline:2px solid #facc15;outline-offset:3px}.faq p{padding:0 .25rem 1rem;margin:0;color:#c4c4c4;line-height:1.8}</style>
