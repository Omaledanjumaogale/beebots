import type { SchemaObject } from '$lib/schema/types';
export interface OpenGraphMeta { title?: string; description?: string; image?: string; imageAlt?: string; type?: 'website' | 'article'; }
export interface TwitterMeta { card?: 'summary' | 'summary_large_image'; title?: string; description?: string; image?: string; }
export interface SchemaBase { '@type': string; '@id'?: string; url?: string; description?: string; datePublished?: string; dateModified?: string; }
export interface PageSEO { title?: string; description?: string; path?: string; noindex?: boolean; type?: 'website' | 'article'; published?: string; modified?: string; schema?: SchemaObject[]; openGraph?: OpenGraphMeta; twitter?: TwitterMeta; }
export interface SEOConfig { title: string; description: string; canonical: string; robots: string; locale: string; openGraph: Required<OpenGraphMeta>; twitter: Required<TwitterMeta>; schema: SchemaObject[]; published?: string; modified?: string; }
