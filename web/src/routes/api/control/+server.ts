import {readHeaders} from '$lib/server/read-budget';
import {json,error} from '@sveltejs/kit';
import {ConvexHttpClient} from 'convex/browser';
import {makeFunctionReference} from 'convex/server';
import {PUBLIC_CONVEX_URL} from '$env/static/public';
import {authEnv,verifyToken,signToken,sameOrigin} from '$lib/server/auth';
import type {RequestHandler} from './$types';
const views:Record<string,string>={hive:'hive:dashboard',investments:'investments:dashboard','admin-overview':'admin:overview','admin-list':'admin:list'};
const mutations=new Set(['hive:initialize','hive:createBee','hive:setBeeActive','hive:killSwitch','hive:closeBeePosition','hive:registerCandidate','hive:promoteCandidate','investments:claimTestCredit','investments:allocate','investments:requestRedemption','investments:cancelRedemption','admin:save','admin:remove']);
const sections=new Set(['users','applications','referrals','financial','settings']);
export const GET:RequestHandler=async({request,url,cookies,platform,fetch})=>{
 const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
 if(!user)throw error(401,'Sign in required');
 const view=url.searchParams.get('view')??'hive';if(!views[view])throw error(404,'Unknown control view');
 if(view.startsWith('admin-')&&user.role!=='admin')throw error(403,'Administrator access required');
 const args:any={};if(view==='admin-list'){const section=url.searchParams.get('section');if(!sections.has(section??''))throw error(400,'Invalid section');const cursor=url.searchParams.get('cursor');if((cursor?.length??0)>8000)throw error(400,'Invalid cursor');args.section=section;args.paginationOpts={numItems:25,cursor:cursor||null};}
 if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET||!PUBLIC_CONVEX_URL)throw error(503,'Control data plane unavailable');
 const identity={scope:view,owner:view.startsWith('admin-')?'admin':user.sub,key:JSON.stringify(args)};
 const edge=async(body:any)=>{const r=await fetch(env.EDGE_RUNTIME_URL+'/control/cache',{method:'POST',headers:{...(body.operation==='get'?await readHeaders(env,user):{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`}),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok)throw error(503,'R2 control snapshot unavailable; bulk source fallback stopped');return d;};
 const cached=await edge({...identity,operation:'get'});
 if(cached.hit)return json(cached.value,{headers:{'Cache-Control':'private, no-store','X-Control-Cache':'hit','X-Convex-Source-Calls':'0','X-Snapshot-Hash':cached.hash}});
 const client=new ConvexHttpClient(PUBLIC_CONVEX_URL);client.setAuth(await signToken(env,user));
 const value=await client.query(makeFunctionReference<any>(views[view]),args);
 const publication=await edge({...identity,operation:'publish',value,expectedGeneration:cached.generation});
 if(publication.conflict)throw error(409,'Records changed during refresh. Refresh this view.');
 if(publication.queued)throw error(503,'Snapshot publication queued for durable retry. Retry later.');
 return json(value,{headers:{'Cache-Control':'private, no-store','X-Control-Cache':publication.changed?'published':'unchanged','X-Convex-Source-Calls':'1','X-Snapshot-Hash':publication.hash}});
};
export const POST:RequestHandler=async({request,url,cookies,platform,fetch})=>{
 const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
 if(!user)throw error(401,'Sign in required');if(!sameOrigin(request,url))throw error(403,'Origin rejected');
 const text=await request.text();if(text.length>16000)throw error(413,'Control request too large');let body;try{body=JSON.parse(text);}catch{throw error(400,'Invalid JSON');}
 if(!mutations.has(body.name))throw error(404,'Unknown control mutation');if(body.name.startsWith('admin:')&&user.role!=='admin')throw error(403,'Administrator access required');
 if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET||!PUBLIC_CONVEX_URL)throw error(503,'Control plane unavailable');
 const client=new ConvexHttpClient(PUBLIC_CONVEX_URL);client.setAuth(await signToken(env,user));
 const result=await client.mutation(makeFunctionReference<any>(body.name),body.args??{});
 const scope=body.name.startsWith('admin:')?'admin-overview':body.name.startsWith('investments:')?'investments':'hive';
 let invalidated=false;try{const r=await fetch(env.EDGE_RUNTIME_URL+'/control/cache',{method:'POST',headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({operation:'invalidate',scope,owner:scope.startsWith('admin-')?'admin':user.sub,key:''}),signal:AbortSignal.timeout(15000)});
 invalidated=r.ok;}catch{/* The committed mutation must never appear as a retryable failure. */}
 // Mutation already committed: never suggest blindly resubmitting a financial action.
 return json({result,committed:true,cacheInvalidated:invalidated},{headers:{'Cache-Control':'no-store'}});
};
