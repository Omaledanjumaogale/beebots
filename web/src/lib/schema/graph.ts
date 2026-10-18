import type { SchemaObject } from './types';
/** Escape script delimiters so CMS text cannot terminate the JSON-LD element. */
export function buildPageGraph(schemas: SchemaObject[]): string {
 const nodes = new Map<string, SchemaObject>();
 schemas.forEach((schema, index) => { const key = schema['@id'] ?? `anonymous-${index}`; nodes.set(key, { ...nodes.get(key), ...schema }); });
 return JSON.stringify({ '@context': 'https://schema.org', '@graph': [...nodes.values()] }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
