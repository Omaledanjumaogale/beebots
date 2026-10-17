import type {PageServerLoad} from './$types';
import {ecosystemLinks} from '$lib/content';
import {CONTENT_UPDATED,SITE} from '$lib/seo';
export const load:PageServerLoad=async({parent})=>{
 const data=await parent();return {links:ecosystemLinks,published:CONTENT_UPDATED,modified:CONTENT_UPDATED,seo:{...data.seo,schema:[...(data.seo?.schema??[]),{'@type':'CollectionPage','@id':SITE+'/ecosystem#directory',url:SITE+'/ecosystem',name:'E-WIN ecosystem directory',description:'Related platforms listed by the parent E-WIN Project. A directory link does not verify current availability or shared account access.',datePublished:CONTENT_UPDATED,dateModified:CONTENT_UPDATED,mainEntity:ecosystemLinks.map(link=>({'@type':'WebSite',name:link.title,url:link.href}))}]}};
};
