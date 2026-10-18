import type {PageServerLoad} from './$types';
import {homeFAQs} from '$lib/content';
import {buildFAQSchema} from '$lib/schema/builders';
export const load:PageServerLoad=async({parent})=>{
 const data=await parent();return {faqs:homeFAQs,seo:{...data.seo,title:'OmieBot Trading · Paper trading bots with visible decisions',published:'2026-10-15',schema:[...(data.seo?.schema??[]),buildFAQSchema(homeFAQs)]}};
};
