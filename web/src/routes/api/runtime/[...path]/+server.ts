import {json,error} from '@sveltejs/kit';
import {authEnv,verifyToken,sameOrigin} from '$lib/server/auth';
import type {RequestHandler} from './$types';
const readPaths=new Set(['admin/status','admin/training','status']);
const writePaths=new Set(['admin/config','admin/cycle','admin/datasets','mode','execution/mode','execution/order','execution/reconcile']);
const handle:RequestHandler=async({request,params,url,cookies,platform,fetch})=>{
 const env=authEnv(platform);const token=cookies.get('omiebot_session');const user=token?await verifyToken(env,token):null;
 if(!user)throw error(401,'Sign in required');const path=params.path??'';
 const mutation=request.method!=='GET';if(mutation&&!sameOrigin(request,url))throw error(403,'Origin rejected');
 if(!(mutation?writePaths:readPaths).has(path))throw error(404,'Runtime route unavailable');
 if((path.startsWith('admin/')||mutation)&&user.role!=='admin')throw error(403,'Administrator access required');
 if(!env.EDGE_RUNTIME_URL||!env.EDGE_SERVICE_SECRET)return json({configured:false,mode:'paper',liveEnabled:false,liveLockReason:'Execution runtime is not configured',training:{status:'unconfigured'}},{status:503});
 const target=path==='status'?'admin/status':path==='mode'?'execution/mode':path;
 const upstream=await fetch(`${env.EDGE_RUNTIME_URL}/${target}`,{method:request.method,headers:{Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`,'Content-Type':'application/json'},body:mutation?await request.text():undefined,signal:AbortSignal.timeout(20000)});
 const result=await upstream.json();if(path==='status')return json({configured:true,mode:result.config?.mode??'paper',liveEnabled:false,liveLockReason:'Only paper-account credentials are configured',training:{...result.training,status:'scheduled · retained-data evaluation',nextRun:'04:00 Africa/Lagos'},bots:result.config?.bees??[],paper:result.paper??{},paused:result.config?.paused},{status:upstream.status,headers:{'Cache-Control':'no-store'}});
 return json(result,{status:upstream.status,headers:{'Cache-Control':'no-store'}});
};
export const GET=handle;export const POST=handle;export const PUT=handle;
