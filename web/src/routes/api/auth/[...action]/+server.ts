import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authEnv, b64, sameOrigin, signToken, verifyPassword, verifyToken, signFlow, readFlow } from '$lib/server/auth';
const limits = new Map<string,{n:number;until:number}>();
const options = {path:'/',httpOnly:true,sameSite:'lax' as const,secure:true};
export const GET: RequestHandler = async ({params,cookies,platform,url,fetch}) => {
  const env=authEnv(platform); const action=params.action;
  const current=await verifyToken(env,cookies.get('omiebot_session')||'');
  if(action==='session')return json({user:current},{headers:{'cache-control':'no-store'}});
  if(action==='token')return json({token:current?await signToken(env,current):null},{headers:{'cache-control':'no-store'}});
  const provider=action.split('/')[0]; if(!['google','github'].includes(provider))return json({error:'Not found'},{status:404});
  const callback=`${url.origin}/api/auth/${provider}/callback`;
  const clientId=env[`${provider.toUpperCase()}_CLIENT_ID`]; const secret=env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  if(!clientId||!secret)return json({error:'OAuth provider is not configured'},{status:503});
  if(action===provider){
    const state=b64(crypto.getRandomValues(new Uint8Array(32))); const verifier=b64(crypto.getRandomValues(new Uint8Array(48)));
    // Random state and PKCE are held only in an HttpOnly host cookie, never accepted from caller input.
    cookies.set('omiebot_oauth',await signFlow(env,{provider,state,verifier,expires:Date.now()+600000}),{...options,secure:url.protocol==='https:',maxAge:600});
    const target=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':'https://github.com/login/oauth/authorize');
    target.search=new URLSearchParams({client_id:clientId,redirect_uri:callback,state,scope:provider==='google'?'openid email profile':'read:user user:email',response_type:'code',code_challenge:b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))),code_challenge_method:'S256'}).toString();
    throw redirect(302,target.href);
  }
  if(action!==`${provider}/callback`)return json({error:'Not found'},{status:404});
  const flow=await readFlow(env,cookies.get('omiebot_oauth')||'');
  cookies.delete('omiebot_oauth',{path:'/'});
  if(!flow||flow.provider!==provider||flow.state!==url.searchParams.get('state')||!url.searchParams.get('code'))return json({error:'Invalid OAuth state'},{status:400});
  const response=await fetch(provider==='google'?'https://oauth2.googleapis.com/token':'https://github.com/login/oauth/access_token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',accept:'application/json'},body:new URLSearchParams({client_id:clientId,client_secret:secret,code:url.searchParams.get('code')!,redirect_uri:callback,grant_type:'authorization_code',code_verifier:flow.verifier})});
  const token=await response.json();if(!response.ok||!token.access_token)return json({error:'OAuth exchange failed'},{status:401});
  let email:string|undefined;let subject:string|undefined;
  if(provider==='google'){const r=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:`Bearer ${token.access_token}`}});const p=await r.json();if(r.ok&&p.email_verified===true){email=p.email;subject=p.sub;}}
  else {const headers={authorization:`Bearer ${token.access_token}`,accept:'application/vnd.github+json','user-agent':'OmieBot'};const r=await fetch('https://api.github.com/user/emails',{headers});const rows=await r.json();const verified=Array.isArray(rows)?rows.find((x:any)=>x.primary&&x.verified):null;const p=await (await fetch('https://api.github.com/user',{headers})).json();if(r.ok&&verified&&p.id){email=verified.email;subject=String(p.id);}}
  if(!email||!subject)return json({error:'A verified primary email is required'},{status:401});
  const user={sub:`${provider}:${subject}`,email:email.toLowerCase(),role:email.toLowerCase()===env.SUPER_ADMIN_EMAIL?.toLowerCase()?'admin' as const:'user' as const};
  cookies.set('omiebot_session',await signToken(env,user,28800),{...options,secure:url.protocol==='https:',maxAge:28800});throw redirect(302,'/');
};
export const POST: RequestHandler = async ({params,cookies,platform,url,request,getClientAddress,fetch})=>{
  if(!sameOrigin(request,url))return json({error:'Invalid request origin'},{status:403});
  if(params.action==='logout'){cookies.delete('omiebot_session',{path:'/'});return json({ok:true});}
  if(params.action!=='login')return json({error:'Not found'},{status:404});
  const declaredSize=Number(request.headers.get('content-length')||'0');if(!Number.isFinite(declaredSize)||declaredSize>4096)return json({error:'Request too large'},{status:413});
  const env=authEnv(platform);const key=getClientAddress();const now=Date.now();
  if(env.EDGE_RUNTIME_URL&&env.EDGE_SERVICE_SECRET){try{const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${env.ADMIN_SESSION_SECRET}:${key}`))),b=>b.toString(16).padStart(2,'0')).join('');const r=await fetch(`${env.EDGE_RUNTIME_URL}/auth/rate`,{method:'POST',headers:{authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`,'content-type':'application/json'},body:JSON.stringify({key:digest})});if(r.status===429)return json({error:'Too many attempts; retry later'},{status:429});if(!r.ok)return json({error:'Sign-in temporarily unavailable'},{status:503});const result=await r.json();if(result.allowed!==true)return json({error:'Too many attempts; retry later'},{status:429});}catch{return json({error:'Sign-in temporarily unavailable'},{status:503});}}
  else {let entry=limits.get(key);if(!entry||entry.until<now){entry={n:0,until:now+900000};limits.set(key,entry);}if(++entry.n>5)return json({error:'Too many attempts; retry later'},{status:429});}
  if(limits.size>10000)for(const [k,v]of limits)if(v.until<now)limits.delete(k);
  let input:any;try{const reader=request.body?.getReader();if(!reader)return json({error:'Invalid JSON'},{status:400});const chunks:Uint8Array[]=[];let size=0;while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>4096){await reader.cancel();return json({error:'Request too large'},{status:413});}chunks.push(next.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}input=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid JSON'},{status:400});}
  if(!input||typeof input!=='object'||typeof input.email!=='string'||typeof input.password!=='string'||input.password.length>256||input.email.toLowerCase()!==env.SUPER_ADMIN_EMAIL?.toLowerCase()||!await verifyPassword(env,input.password))return json({error:'Invalid credentials'},{status:401});
  const user={sub:`admin:${input.email.toLowerCase()}`,email:input.email.toLowerCase(),role:'admin' as const};
  cookies.set('omiebot_session',await signToken(env,user,28800),{...options,secure:url.protocol==='https:',maxAge:28800});return json({user});
};
