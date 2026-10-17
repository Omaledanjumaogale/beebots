import { describe, expect, it } from 'vitest';
import { buildMeta, publicPages } from '../src/lib/seo';
import { buildPageGraph } from '../src/lib/schema/graph';
import { buildWebSiteSchema, buildOrganizationSchema, buildArticleSchema } from '../src/lib/schema/builders';
describe('public discovery trust boundaries', () => {
 it('keeps canonical URLs on the actual application host and strips tracking', () => {
  expect(buildMeta({path:'/paper?token=private#activity'}).canonical).toBe('https://omiebot.ewinproject.org/paper');
  expect(buildMeta({path:'//evil.example'}).canonical).toBe('https://omiebot.ewinproject.org/');
 });
 it('does not offer nonexistent search or index account pages', () => {
  expect(buildWebSiteSchema()).not.toHaveProperty('potentialAction');
  expect(publicPages.map(page => page.path)).toEqual(['/', '/paper', '/hive', '/research', '/ecosystem']);
  expect(buildMeta({noindex:true}).robots).toContain('noindex');
 });
 it('serializes hostile CMS strings without creating executable script markup', () => {
  const graph = buildPageGraph([{ '@type':'Article', description:'</script><script>alert(1)</script>' }]);
  expect(graph).not.toContain('<');
  expect(JSON.parse(graph)['@graph'][0].description).toBe('</script><script>alert(1)</script>');
 });
 it('merges entity references and uses supplied editorial dates', () => {
  const graph = JSON.parse(buildPageGraph([buildOrganizationSchema(),buildOrganizationSchema(),buildArticleSchema({title:'Evidence',description:'Paper only',url:'https://omiebot.ewinproject.org/research',published:'2026-10-16',modified:'2026-10-17'})]));
  expect(graph['@graph']).toHaveLength(2);
  expect(graph['@graph'][1].datePublished).toBe('2026-10-16');
 });
});

