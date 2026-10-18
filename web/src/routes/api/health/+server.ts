import {json} from '@sveltejs/kit';
export const GET=()=>json({application:'OmieBot AI Trading',version:'0.1.0',mode:'paper',time:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
