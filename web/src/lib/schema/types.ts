/** JSON-compatible Schema.org node; factories supply only claims supported by visible content. */
export type SchemaValue = string | number | boolean | null | SchemaObject | SchemaValue[];
export interface SchemaObject { [key: string]: SchemaValue | undefined; '@type'?: string; '@id'?: string; }
export interface Breadcrumb { name: string; url: string; }
export interface QuestionAnswer { question: string; answer: string; }
export interface ArticleInput { title: string; description: string; url: string; published: string; modified: string; }
