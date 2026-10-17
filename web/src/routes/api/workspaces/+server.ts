import {json,error} from '@sveltejs/kit';
import {authEnv,verifyToken,sameOrigin} from '$lib/server/auth';
import type {RequestHandler} from './$types';

export const GET:RequestHandler=async({url,cookies,platform,fetch})=>{
  const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
  const view=url.searchParams.get('view')??'paper';
  if(!['paper','live','markets'].includes(view))throw error(400,'Unknown workspace');
  if(view!=='paper'&&!user)throw error(401,'Sign in to view the live workspace');
  if(view==='markets'&&user?.role!=='admin')throw error(403,'The configured market feed is currently available to the account operator. Customer feed entitlements are not configured.');
  if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)return json({error:'Workspace runtime unavailable'},{status:503});
  try{
    const r=await fetch(`${env.EDGE_RUNTIME_URL}/workspaces/${view==='live'?'okx':view}`,{method:view==='live'?'POST':'GET',headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`},body:view==='live'?JSON.stringify({operation:'status',user:user!.sub}):undefined,signal:AbortSignal.timeout(30000)});
    const d=await r.json();
    if(view==='paper')return json({mode:'paper',workspace:d.workspace,symbol:d.symbol,paused:d.config?.paused??true,bots:d.config?.bees??[],paper:d.paper??{},lastCycle:d.lastCycle??null,dataset:d.dataset?{provider:d.dataset.provider,symbol:d.dataset.symbol,bars:d.dataset.bars,firstBar:d.dataset.firstBar,lastBar:d.dataset.lastBar,sha256:d.dataset.sha256,sourceCoverage:d.dataset.sourceCoverage}:null,training:d.training,capitalKind:'simulated',executionEnabled:false},{status:r.status,headers:{'Cache-Control':'no-store'}});
    return json(d,{status:r.status,headers:{'Cache-Control':'no-store'}});
  }catch{return json({error:'Workspace evidence unavailable; no balance or market value inferred'},{status:503});}
};
export const POST:RequestHandler=async({request,url,cookies,platform,fetch})=>{
  const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
  if(user?.role!=='admin')throw error(403,'Operator access required');
  if(!sameOrigin(request,url))throw error(403,'Origin rejected');
  if(Number(request.headers.get('content-length')??0)>200)throw error(413,'Request too large');
  const body=await request.text();if(body.length>200)throw error(413,'Request too large');
  let action;try{action=JSON.parse(body).action;}catch{throw error(400,'Invalid action');}
  if(!['start','pause','cycle','train'].includes(action))throw error(400,'Only paper workspace controls are available');
  if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)throw error(503,'Runtime unavailable');
  try{const r=await fetch(`${env.EDGE_RUNTIME_URL}/admin/paper/${action}`,{method:'POST',headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`},signal:AbortSignal.timeout(60000)});return json(await r.json(),{status:r.status});}catch{throw error(503,'Control response unavailable. Refresh evidence before retrying.');}
};
