import {json} from '@sveltejs/kit';
import {authEnv} from '$lib/server/auth';
import type {RequestHandler} from './$types';

// Public projection deliberately omits weights, dataset objects and service configuration.
export const GET:RequestHandler=async({platform,fetch})=>{
  const env=authEnv(platform);
  if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)return json({error:'Training evidence unavailable'},{status:503});
  try{
    const response=await fetch(`${env.EDGE_RUNTIME_URL}/admin/training`,{headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`},signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error();
    const data=await response.json();
    const results=['drift','rebound','breaker'].map(bee=>{
      const r=data.results?.find((entry:any)=>entry.bee===bee)?.result??{};
      const statuses=['awaiting-data','skipped','rejected','shadow-ready'];
      return {bee,status:statuses.includes(r.status)?r.status:'unavailable',at:typeof r.at==='string'?r.at:null,reason:typeof r.reason==='string'?r.reason.slice(0,700):null,executionApproved:false};
    });
    return json({at:new Date().toISOString(),schedule:'04:00 Africa/Lagos',results},{headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}});
  }catch{return json({error:'Training evidence unavailable; no result inferred'},{status:503});}
};
