import {readHeaders} from '$lib/server/read-budget';
import {json,error} from '@sveltejs/kit';
import {authEnv,verifyToken,sameOrigin} from '$lib/server/auth';
import type {RequestHandler} from './$types';
export const POST:RequestHandler=async({request,url,cookies,platform,fetch})=>{
 const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
 if(!user)throw error(401,'Sign in before connecting a broker');
 if(!sameOrigin(request,url))throw error(403,'Origin rejected');
 if(Number(request.headers.get('content-length')??0)>3000)throw error(413,'Request too large');
 const text=await request.text();if(text.length>3000)throw error(413,'Request too large');
 let body;try{body=JSON.parse(text);}catch{throw error(400,'Invalid request');}
 if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)throw error(503,'Broker runtime unavailable');
 // Never accept user identity, operation, or execution permission from the browser.
 const input={operation:'link',user:user.sub,credentials:body.credentials,allocation:body.allocation,ownershipConfirmed:body.ownershipConfirmed===true,riskAccepted:body.riskAccepted===true,adult:body.adult===true};
 try{const r=await fetch(env.EDGE_RUNTIME_URL+'/workspaces/okx',{method:'POST',headers:{...(request.method==='GET'?await readHeaders(env,user):{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`}),'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(45000)});return json(await r.json(),{status:r.status,headers:{'Cache-Control':'no-store'}});}catch{throw error(503,'OKX verification response unavailable. No execution was enabled; refresh your workspace before retrying.');}
};
