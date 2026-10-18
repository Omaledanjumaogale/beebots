import type { ArticleInput, Breadcrumb, QuestionAnswer, SchemaObject } from './types';
const origin = 'https://omiebot.ewinproject.org';
const parent = 'https://ewinproject.org';
const author = 'https://omaledanjumaogale.ewinproject.org/';
export function buildOrganizationSchema(): SchemaObject {
 return { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'OmieBot Trading', url: origin, logo: `${origin}/favicon.svg`, description: 'Paper trading bots and research within the E-WIN Project Ecosystem.', parentOrganization: { '@type': 'Organization', '@id': `${parent}/#organization`, name: 'Elite Workforce Impact Nigeria Project', legalName: 'Elite Workforce Enterprises and Digital Emerging Arbitrage & Leverage Services', url: parent }, founder: { '@id': `${author}#person` } };
}
export function buildWebSiteSchema(): SchemaObject { return { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'OmieBot Trading', url: origin, description: 'Explore simulated trading Bees, recorded decisions and research evidence.', inLanguage: 'en-NG', publisher: { '@id': `${origin}/#organization` } }; }
export function buildPersonSchema(): SchemaObject { return { '@type': 'Person', '@id': `${author}#person`, name: 'Omale Danjuma Ogale', jobTitle: 'Founder & CEO', url: author, worksFor: { '@id': `${parent}/#organization` } }; }
export function buildBreadcrumbSchema(items: Breadcrumb[]): SchemaObject { return { '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) }; }
export function buildArticleSchema(input: ArticleInput): SchemaObject { return { '@type': 'Article', '@id': `${input.url}#article`, headline: input.title, description: input.description, url: input.url, mainEntityOfPage: input.url, datePublished: input.published, dateModified: input.modified, author: { '@id': `${author}#person` }, publisher: { '@id': `${origin}/#organization` } }; }
export function buildFAQSchema(items: QuestionAnswer[]): SchemaObject { return { '@type': 'FAQPage', mainEntity: items.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }; }
export function buildHowToSchema(name: string, description: string, url: string, steps: string[]): SchemaObject { return { '@type': 'HowTo', name, description, url, mainEntityOfPage: url, step: steps.map(text => ({ '@type': 'HowToStep', text })) }; }
export function buildServiceSchema(name: string, description: string, url: string): SchemaObject { return { '@type': 'Service', name, description, url, serviceType: 'Paper trading education and research', provider: { '@id': `${origin}/#organization` }, mainEntityOfPage: url }; }
export const buildProductServicesSchema = buildServiceSchema;
