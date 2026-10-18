import { json,error } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { authEnv,verifyToken,signToken,sameOrigin } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async({cookies,platform})=>{
  const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
  if(!user)throw error(401,'Sign in required');if(user.role!=='admin')throw error(403,'Administrator access required');
  const client=new ConvexHttpClient(PUBLIC_CONVEX_URL);client.setAuth(await signToken(env,user));
  return json(await client.query(makeFunctionReference<any>('workflows:list'),{}),{headers:{'Cache-Control':'private, no-store'}});
};
export const POST:RequestHandler=async({request,url,cookies,platform})=>{
  const env=authEnv(platform),token=cookies.get('omiebot_session'),user=token?await verifyToken(env,token):null;
  if(!user)throw error(401,'Sign in required');if(user.role!=='admin')throw error(403,'Administrator access required');if(!sameOrigin(request,url))throw error(403,'Origin rejected');
  const text=await request.text();if(text.length>256)throw error(413,'Request too large');
  let input;try{input=JSON.parse(text);}catch{throw error(400,'Invalid JSON');}if(!['training','verification','all'].includes(input?.kind))throw error(400,'Invalid workflow');
  const client=new ConvexHttpClient(PUBLIC_CONVEX_URL);client.setAuth(await signToken(env,user));
  return json(await client.mutation(makeFunctionReference<any>('workflows:start'),{kind:input.kind}),{headers:{'Cache-Control':'private, no-store'}});
};
