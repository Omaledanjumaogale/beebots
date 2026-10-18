import { queryGeneric as query, mutationGeneric as mutation, internalMutationGeneric as internalMutation, internalActionGeneric as internalAction, makeFunctionReference } from 'convex/server';
import { v } from 'convex/values';
const kind = v.union(v.literal('training'),v.literal('verification'),v.literal('all'));
async function guard(ctx:any) {
  const user = await ctx.auth.getUserIdentity();
  if (!user || user.emailVerified !== true || !process.env.SUPER_ADMIN_EMAIL || user.email?.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL.toLowerCase()) throw new Error('Administrator access required');
  return user;
}
export const list = query({ args:{}, handler:async(ctx) => {
  const user = await guard(ctx);
  return ctx.db.query('workflowJobs').withIndex('owner_created',q=>q.eq('owner',user.subject)).order('desc').take(11);
}});
export const start = mutation({ args:{kind}, handler:async(ctx,args) => {
  const user = await guard(ctx), now = Date.now();
  const recent = await ctx.db.query('workflowJobs').withIndex('owner_created',q=>q.eq('owner',user.subject)).order('desc').take(11);
  const active = recent.find(job => job.status === 'queued' || job.status === 'running');
  if (active) return {jobId:active._id,existing:true};
  if (recent.filter(job=>job.createdAt > now-86400000).length >= 10) throw new Error('Daily limit of 10 workflow starts reached');
  if (!process.env.GITHUB_WORKFLOW_TOKEN || !process.env.WORKFLOW_CALLBACK_SECRET) throw new Error('Workflow dispatch is not configured');
  const jobId = await ctx.db.insert('workflowJobs',{owner:user.subject,kind:args.kind,status:'queued',message:'Awaiting external runner',createdAt:now,updatedAt:now});
  await ctx.scheduler.runAfter(0,makeFunctionReference<'action'>('workflows:dispatch') as any,{jobId,kind:args.kind});
  await ctx.scheduler.runAfter(20*60*1000,makeFunctionReference<'mutation'>('workflows:expire') as any,{jobId});
  return {jobId,existing:false};
}});
export const expire = internalMutation({args:{jobId:v.id('workflowJobs')},handler:async(ctx,{jobId})=>{
  const job=await ctx.db.get(jobId);
  if(job && (job.status==='queued'||job.status==='running'))await ctx.db.patch(jobId,{status:'failed',message:'Runner did not report completion within 20 minutes. Inspect GitHub Actions before retrying.',updatedAt:Date.now()});
}});
export const transition = internalMutation({args:{jobId:v.id('workflowJobs'),status:v.union(v.literal('running'),v.literal('succeeded'),v.literal('failed')),message:v.string()},handler:async(ctx,args)=>{
  const job = await ctx.db.get(args.jobId);
  if (!job) throw new Error('Unknown workflow');
  if (args.message.length > 500) throw new Error('Message exceeds limit');
  if (job.status === args.status) return {changed:false};
  if (job.status === 'succeeded' || job.status === 'failed') return {changed:false};
  if (args.status === 'succeeded' && job.status !== 'running') throw new Error('Workflow has not started');
  await ctx.db.patch(args.jobId,{status:args.status,message:args.message,updatedAt:Date.now()});
  return {changed:true};
}});
export const dispatch = internalAction({args:{jobId:v.id('workflowJobs'),kind},handler:async(ctx,args)=>{
  try {
    const response = await fetch('https://api.github.com/repos/Omaledanjumaogale/beebots/actions/workflows/omiebot-operations.yml/dispatches',{method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_WORKFLOW_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify({ref:'codex/production-omiebot',inputs:{job_id:args.jobId,kind:args.kind}}),signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`Runner dispatch returned ${response.status}`);
  } catch {
    await ctx.runMutation(makeFunctionReference<'mutation'>('workflows:transition') as any,{jobId:args.jobId,status:'failed',message:'External runner dispatch failed. Check operator configuration.'});
  }
}});
export const notify = internalAction({args:{owner:v.string()},handler:async(_ctx,{owner})=>{
  if(!process.env.WORKFLOW_CALLBACK_SECRET)return {accepted:false};
  try{const response=await fetch('https://omiebot.ewinproject.org/api/notifications',{method:'POST',headers:{Authorization:`Bearer ${process.env.WORKFLOW_CALLBACK_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({owner,operation:'deliver'}),signal:AbortSignal.timeout(15000)});return {accepted:response.ok};}catch{return {accepted:false};}
}});
export const notificationOwner = internalMutation({args:{jobId:v.id('workflowJobs')},handler:async(ctx,{jobId})=>{const job=await ctx.db.get(jobId);return job?.owner??null;}});
