import type {LayoutServerLoad} from './$types';
import {CONTENT_UPDATED,publicPages,SITE,defaultSEO} from '$lib/seo';
import {buildOrganizationSchema,buildPersonSchema,buildWebSiteSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
import type {PageSEO} from '$lib/types/seo';
export const load:LayoutServerLoad=({url})=>{
 const route=publicPages.find(page=>page.path===url.pathname);
 const seo:PageSEO={...defaultSEO,path:url.pathname,title:route?`${route.title} · OmieBot Trading`:'Private workspace · OmieBot Trading',description:route?.description??'Sign in to retrieve your own account records. Static page shells contain no private data.',noindex:!route,modified:CONTENT_UPDATED,schema:route?[
  buildOrganizationSchema(),buildWebSiteSchema(),buildPersonSchema(),
  buildBreadcrumbSchema([{name:'OmieBot Trading',url:SITE+'/'},...(url.pathname==='/'?[]:[{name:route.title,url:SITE+url.pathname}])]),
  {'@type':'WebPage','@id':SITE+url.pathname+'#page',url:SITE+url.pathname,name:route.title,description:route.description,inLanguage:'en-NG',dateModified:CONTENT_UPDATED,author:{'@id':'https://omaledanjumaogale.ewinproject.org/#person'},publisher:{'@id':SITE+'/#organization'},isPartOf:{'@id':SITE+'/#website'},mainEntityOfPage:SITE+url.pathname}
 ]:[]};
 return {seo,contentDate:CONTENT_UPDATED,publicContent:!!route};
};
