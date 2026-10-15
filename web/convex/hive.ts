import { queryGeneric as query, mutationGeneric as mutation, internalMutationGeneric as internalMutation } from 'convex/server';
import { v } from 'convex/values';
import { NAMES, SYMBOLS, nextState, quoteSafe } from './risk';
async function owner(ctx: any) { const user = await ctx.auth.getUserIdentity(); if (!user) throw new Error('Authentication required'); return user.tokenIdentifier; }
export const dashboard = query({ args: {}, handler: async ctx => {
  const id = await owner(ctx);
  return { portfolio: await ctx.db.query('portfolios').withIndex('owner', q=>q.eq('owner',id)).unique(), bees: await ctx.db.query('bees').withIndex('owner',q=>q.eq('owner',id)).take(20), fills: await ctx.db.query('fills').withIndex('owner',q=>q.eq('owner',id)).order('desc').take(100), candidates: await ctx.db.query('candidates').withIndex('owner',q=>q.eq('owner',id)).take(100) };
}});
export const initialize = mutation({args:{},handler:async ctx=>{const id=await owner(ctx); const existing=await ctx.db.query('portfolios').withIndex('owner',q=>q.eq('owner',id)).unique(); if(existing)return existing._id; return ctx.db.insert('portfolios',{owner:id,cash:10000,killed:false,createdAt:Date.now()});}});
export const createBee = mutation({ args:{name:v.string(),strategy:v.union(v.literal('trend'),v.literal('reversion'),v.literal('breakout'),v.literal('research')),symbol:v.string()}, handler:async(ctx,args)=>{
  const id=await owner(ctx); if(!NAMES.includes(args.name as any)||!SYMBOLS.includes(args.symbol))throw new Error('Unknown Bee or instrument');
  const rows=await ctx.db.query('bees').withIndex('owner',q=>q.eq('owner',id)).take(20); if(rows.length>=20||rows.some(b=>b.name===args.name))throw new Error('Bee already registered or limit reached');
  const portfolio=await ctx.db.query('portfolios').withIndex('owner',q=>q.eq('owner',id)).unique(); if(!portfolio)throw new Error('Initialize paper portfolio first');
  return ctx.db.insert('bees',{...args,owner:id,active:false,quantity:0});
}});
export const setBeeActive = mutation({args:{beeId:v.id('bees'),active:v.boolean()},handler:async(ctx,args)=>{const id=await owner(ctx);const bee=await ctx.db.get(args.beeId);if(!bee||bee.owner!==id)throw new Error('Unknown Bee');const p=await ctx.db.query('portfolios').withIndex('owner',q=>q.eq('owner',id)).unique();if(args.active&&(!p||p.killed))throw new Error('Portfolio stopped');if(args.active&&!bee.active){const active=await ctx.db.query('bees').withIndex('active',q=>q.eq('active',true)).take(101);if(active.length>=100)throw new Error('Deployment capacity reached: 100 active Bees');}await ctx.db.patch(args.beeId,{active:args.active});}});
export const killSwitch = mutation({args:{killed:v.boolean()},handler:async(ctx,args)=>{const id=await owner(ctx);const p=await ctx.db.query('portfolios').withIndex('owner',q=>q.eq('owner',id)).unique();if(!p)throw new Error('Initialize portfolio first');await ctx.db.patch(p._id,args);if(args.killed){const bees=await ctx.db.query('bees').withIndex('owner',q=>q.eq('owner',id)).take(20);for(const b of bees)await ctx.db.patch(b._id,{active:false});}}});
export const closeBeePosition = mutation({args:{beeId:v.id('bees')},handler:async(ctx,args)=>{
  const id=await owner(ctx);const bee=await ctx.db.get(args.beeId);if(!bee||bee.owner!==id)throw new Error('Unknown Bee');
  // Pausing and closing remain available even when the portfolio is killed.
  if(bee.quantity<=0){await ctx.db.patch(bee._id,{active:false});return {closed:false};}
  const portfolio=await ctx.db.query('portfolios').withIndex('owner',q=>q.eq('owner',id)).unique();if(!portfolio)throw new Error('Unknown portfolio');
  const quote=await ctx.db.query('quotes').withIndex('symbol',q=>q.eq('symbol',bee.symbol)).order('desc').first();const now=Date.now();
  if(!quote||!quoteSafe(quote.bid,quote.ask,quote.sourceAt,now))throw new Error('Fresh safe bid/ask required to close paper position');
  const quantity=bee.quantity;const price=quote.bid;const fee=quantity*price*.001;const cashDelta=quantity*price-fee;
  await ctx.db.insert('fills',{owner:id,beeId:bee._id,key:`manual-close:${bee._id}:${now}`,side:'sell',quantity,price,fee,cashDelta,at:now,quoteAt:quote.sourceAt,source:'OKX public spot ticker; owner-requested simulated reduction'});
  await ctx.db.patch(portfolio._id,{cash:portfolio.cash+cashDelta});await ctx.db.patch(bee._id,{quantity:0,active:false,lastDecision:'Owner closed paper position at fresh bid; Bee paused'});return {closed:true};
}});
export const registerCandidate = mutation({args:{name:v.string(),artifactHash:v.string(),datasetHash:v.string()},handler:async(ctx,args)=>{const id=await owner(ctx);if(args.name.length>100||![args.artifactHash,args.datasetHash].every(s=>/^[a-f0-9]{64}$/.test(s)))throw new Error('Supply name and SHA256 manifests');const rows=await ctx.db.query('candidates').withIndex('owner',q=>q.eq('owner',id)).take(100);if(rows.length>=100)throw new Error('Candidate quota reached');return ctx.db.insert('candidates',{...args,owner:id,state:'registered',createdAt:Date.now()});}});
export const promoteCandidate = mutation({args:{candidateId:v.id('candidates'),target:v.string()},handler:async(ctx,args)=>{
  const id=await owner(ctx);const c=await ctx.db.get(args.candidateId);if(!c||c.owner!==id)throw new Error('Unknown candidate');
  const evaluation=await ctx.db.query('evaluations').withIndex('candidate_target',(q:any)=>q.eq('candidateId',c._id).eq('target',args.target)).unique();
  if(!evaluation||evaluation.artifactHash!==c.artifactHash||evaluation.datasetHash!==c.datasetHash)throw new Error('Trusted matching evaluator report required');
  if(await ctx.db.query('evaluationUses').withIndex('evaluation',q=>q.eq('evaluationId',evaluation._id)).first())throw new Error('Evaluation already consumed');
  const state=nextState(c.state,args.target,evaluation);
  await ctx.db.insert('evaluationUses',{evaluationId:evaluation._id,candidateId:c._id,at:Date.now()});
  await ctx.db.insert('evidence',{owner:id,candidateId:c._id,from:c.state,to:state,report:JSON.stringify(evaluation),at:Date.now()});await ctx.db.patch(c._id,{state});
}});
// Only deployment operators/internal evaluator actions can record evidence. There
// is deliberately no HTTP/public report ingestion until signature verification exists.
export const recordEvaluation = internalMutation({args:{candidateId:v.id('candidates'),artifactHash:v.string(),datasetHash:v.string(),target:v.string(),report:v.string(),independentSamples:v.number(),durationDays:v.number(),passed:v.boolean(),evaluator:v.string()},handler:async(ctx,args)=>{
  const candidate=await ctx.db.get(args.candidateId);if(!candidate||candidate.artifactHash!==args.artifactHash||candidate.datasetHash!==args.datasetHash)throw new Error('Candidate manifest mismatch');
  if(args.report.length>8000||args.evaluator.trim().length<3||args.evaluator.length>200)throw new Error('Invalid evaluator report');
  nextState(candidate.state,args.target,args);
  if(await ctx.db.query('evaluations').withIndex('candidate_target',(q:any)=>q.eq('candidateId',candidate._id).eq('target',args.target)).first())throw new Error('Immutable evaluation already recorded for transition');
  return ctx.db.insert('evaluations',{...args,recordedAt:Date.now()});
}});
