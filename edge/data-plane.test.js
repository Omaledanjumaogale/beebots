import {describe,it,expect} from 'vitest';
import {canonical,dataPlane,retryPublications,publicPaper} from './data-plane.js';
function fixture(){
 const db=new Map(),objects=new Map(),writes=[];
 const state={storage:{get:async k=>db.get(k),put:async(k,v)=>db.set(k,structuredClone(v)),delete:async k=>db.delete(k),list:async({prefix,limit})=>new Map([...db].filter(([k])=>k.startsWith(prefix)).slice(0,limit)),setAlarm:async()=>{}}};
 const env={ARTIFACTS:{get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k)),body:objects.get(k)}:null}};
 const put=async(_,key,value)=>{writes.push(key);objects.set(key,value);};
 const input={scope:'hive',owner:'alice',key:'',operation:'publish',value:{cash:100}};
 return {state,env,writes,put,input,db,objects};
}
describe('private R2 data plane',()=>{
 it('uses canonical content and performs zero replacements for unchanged data',async()=>{
  const f=fixture();expect(canonical({b:2,a:1})).toBe(canonical({a:1,b:2}));
  expect((await dataPlane(f.state,f.env,f.input,f.put)).r2Replacements).toBe(2);
  const same=await dataPlane(f.state,f.env,f.input,f.put);expect(same.changed).toBe(false);expect(same.r2Replacements).toBe(0);expect(f.writes).toHaveLength(2);
 });
 it('separates owners and rejects a snapshot raced by invalidation',async()=>{
  const f=fixture();const miss=await dataPlane(f.state,f.env,{...f.input,operation:'get'},f.put);
  await dataPlane(f.state,f.env,{...f.input,operation:'invalidate'},f.put);
  expect((await dataPlane(f.state,f.env,{...f.input,expectedGeneration:miss.generation},f.put)).conflict).toBe(true);
  await dataPlane(f.state,f.env,f.input,f.put);
  expect((await dataPlane(f.state,f.env,{...f.input,owner:'bob',operation:'get'},f.put)).miss).toBe(true);
  expect((await dataPlane(f.state,f.env,{...f.input,operation:'get'},f.put)).value.cash).toBe(100);
 });
 it('durably retries failed writes and drains the queue',async()=>{
  const f=fixture();expect((await dataPlane(f.state,f.env,f.input,async()=>{throw Error('R2 unavailable');})).queued).toBe(true);
  expect((await retryPublications(f.state,f.env,f.put))).toEqual({completed:1,remaining:0});
  expect((await dataPlane(f.state,f.env,{...f.input,operation:'get'},f.put)).hit).toBe(true);
 });
 it('supersedes an older failed publication and bounds payloads',async()=>{
  const f=fixture();await dataPlane(f.state,f.env,f.input,async()=>{throw Error('offline');});
  await dataPlane(f.state,f.env,{...f.input,value:{cash:200}},f.put);
  expect((await retryPublications(f.state,f.env,f.put)).remaining).toBe(0);
  expect((await dataPlane(f.state,f.env,{...f.input,operation:'get'},f.put)).value.cash).toBe(200);
  await expect(dataPlane(f.state,f.env,{...f.input,value:'x'.repeat(512001)},f.put)).rejects.toThrow('512KB');
 });
 it('serves only the fixed public projection with conditional requests',async()=>{
  const f=fixture();await dataPlane(f.state,f.env,{...f.input,scope:'public-paper',owner:'public'},f.put);
  const first=await publicPaper(f.env,new Request('https://runtime/public/paper'));
  expect(first.status).toBe(200);expect(first.headers.get('X-Data-Plane')).toBe('r2');
  const second=await publicPaper(f.env,new Request('https://runtime/public/paper',{headers:{'If-None-Match':first.headers.get('ETag')}}));expect(second.status).toBe(304);
 });
});
