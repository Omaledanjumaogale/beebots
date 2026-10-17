import {json,error} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {authEnv,verifyToken,sameOrigin} from '$lib/server/auth';
import {parseSubscription,deliverPush} from '$lib/server/push';
async function store(env:ReturnType<typeof authEnv>,owner:string,operation:string,subscription?:unknown){
 if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)throw error(503,'Notification storage unavailable');
 const r=await fetch(env.EDGE_RUNTIME_URL+'/notifications',{method:'POST',headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({owner,operation,subscription}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw error(503,'Notification storage temporarily unavailable');return r.json();
}
export const GET:RequestHandler=async({cookies,platform})=>{
 const env=authEnv(platform),user=await verifyToken(env,cookies.get('omiebot_session')??'');if(!user)throw error(401,'Sign in required');
 return json({publicKey:env.VAPID_PUBLIC_KEY??null,configured:!!env.VAPID_PRIVATE_KEY},{headers:{'Cache-Control':'private, no-store'}});
};
export const POST:RequestHandler=async({request,cookies,platform,url})=>{
 const env=authEnv(platform);
 const internal=!!env.WORKFLOW_CALLBACK_SECRET&&request.headers.get('Authorization')===`Bearer ${env.WORKFLOW_CALLBACK_SECRET}`;
 const user=internal?null:await verifyToken(env,cookies.get('omiebot_session')??'');
 if(!internal&&!user)throw error(401,'Sign in required');if(!internal&&!sameOrigin(request,url))throw error(403,'Origin rejected');
 const text=await request.text();if(text.length>6000)throw error(413,'Request too large');let body;try{body=JSON.parse(text);}catch{throw error(400,'Invalid JSON');}
 const owner=internal?body.owner:user!.sub;if(typeof owner!=='string'||owner.length>256)throw error(400,'Invalid owner');
 if(internal&&body.operation!=='deliver')throw error(403,'Internal operation rejected');
 if(body.operation==='subscribe'){let subscription;try{subscription=parseSubscription(body.subscription);}catch{throw error(400,'Invalid push subscription');}await store(env,owner,'subscribe',subscription);return json({saved:true},{headers:{'Cache-Control':'no-store'}});}
 if(body.operation==='unsubscribe'){let subscription;try{subscription=parseSubscription(body.subscription);}catch{throw error(400,'Invalid push subscription');}await store(env,owner,'unsubscribe',subscription);return json({removed:true});}
 if(body.operation==='test'||internal){const subscriptions=await store(env,owner,'read');const results=await deliverPush(env,subscriptions);for(const result of results.filter(r=>r.expired)){const sub=subscriptions.find((s:any)=>s.endpoint===result.endpoint);await store(env,owner,'unsubscribe',sub);}return json({accepted:results.filter(r=>r.accepted).length,devices:results.length,deviceReceiptVerified:false},{headers:{'Cache-Control':'no-store'}});}
 throw error(400,'Unknown notification action');
};
