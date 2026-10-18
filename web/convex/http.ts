import { httpRouter, httpActionGeneric as httpAction, makeFunctionReference } from 'convex/server';
const http = httpRouter();
http.route({path:'/operations/callback',method:'POST',handler:httpAction(async(ctx,request)=>{
  const secret = process.env.WORKFLOW_CALLBACK_SECRET;
  if (!secret || request.headers.get('Authorization') !== `Bearer ${secret}`) return new Response('Unauthorized',{status:401});
  const text = await request.text();
  if (text.length > 2000) return new Response('Too large',{status:413});
  let input:any; try { input=JSON.parse(text); } catch { return new Response('Invalid JSON',{status:400}); }
  if (!input || typeof input.jobId !== 'string' || !['running','succeeded','failed'].includes(input.status) || typeof input.message !== 'string' || input.message.length > 500) return new Response('Invalid callback',{status:400});
  try { const transition=await ctx.runMutation(makeFunctionReference<'mutation'>('workflows:transition') as any,input);
    if(transition.changed&&['succeeded','failed'].includes(input.status)){
      const owner=await ctx.runMutation(makeFunctionReference<'mutation'>('workflows:notificationOwner') as any,{jobId:input.jobId});
      if(owner)await ctx.scheduler.runAfter(0,makeFunctionReference<'action'>('workflows:notify') as any,{owner});
    }
  }
  catch { return new Response('Invalid transition',{status:400}); }
  return new Response('Accepted',{headers:{'Cache-Control':'no-store'}});
})});
export default http;
