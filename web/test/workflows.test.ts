import { afterEach, expect, test, vi } from 'vitest';
import { start, transition, expire } from '../convex/workflows';
afterEach(()=>vi.unstubAllEnvs());
function context(jobs:any[]=[]){
  vi.stubEnv('SUPER_ADMIN_EMAIL','admin@example.test');vi.stubEnv('GITHUB_WORKFLOW_TOKEN','test-only');vi.stubEnv('WORKFLOW_CALLBACK_SECRET','test-only');
  const db:any={query:()=>({withIndex:()=>({order:()=>({take:async()=>jobs})})}),insert:vi.fn(async()=> 'job-id'),get:vi.fn(async()=>jobs[0]),patch:vi.fn()};
  return {auth:{getUserIdentity:async()=>({subject:'admin',email:'admin@example.test',emailVerified:true})},db,scheduler:{runAfter:vi.fn()}};
}
test('unverified identity cannot start a background job',async()=>{
  const ctx=context();ctx.auth.getUserIdentity=async()=>({subject:'admin',email:'admin@example.test',emailVerified:false});
  await expect((start as any)._handler(ctx,{kind:'training'})).rejects.toThrow('Administrator');expect(ctx.db.insert).not.toHaveBeenCalled();
});
test('repeated start returns active job without dispatching again',async()=>{
  const ctx=context([{_id:'existing',status:'running',createdAt:Date.now()}]);
  expect(await(start as any)._handler(ctx,{kind:'all'})).toEqual({jobId:'existing',existing:true});expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
});
test('daily bound rejects the eleventh start',async()=>{
  const ctx=context(Array.from({length:10},()=>({status:'succeeded',createdAt:Date.now()})));
  await expect((start as any)._handler(ctx,{kind:'verification'})).rejects.toThrow('Daily limit');expect(ctx.db.insert).not.toHaveBeenCalled();
});
test('start queues dispatch and timeout without running training inline',async()=>{
  const ctx=context();expect(await(start as any)._handler(ctx,{kind:'all'})).toEqual({jobId:'job-id',existing:false});expect(ctx.scheduler.runAfter).toHaveBeenCalledTimes(2);
});
test('success requires running state and terminal callbacks are idempotent',async()=>{
  const ctx=context([{status:'queued'}]);await expect((transition as any)._handler(ctx,{jobId:'id',status:'succeeded',message:'done'})).rejects.toThrow('not started');
  ctx.db.get.mockResolvedValue({status:'succeeded'});expect(await(transition as any)._handler(ctx,{jobId:'id',status:'failed',message:'late'})).toEqual({changed:false});expect(ctx.db.patch).not.toHaveBeenCalled();
});
test('timeout expires unfinished jobs but preserves completed evidence',async()=>{
  const ctx=context([{status:'running'}]);await(expire as any)._handler(ctx,{jobId:'id'});expect(ctx.db.patch).toHaveBeenCalledWith('id',expect.objectContaining({status:'failed'}));ctx.db.patch.mockClear();ctx.db.get.mockResolvedValue({status:'succeeded'});await(expire as any)._handler(ctx,{jobId:'id'});expect(ctx.db.patch).not.toHaveBeenCalled();
});
