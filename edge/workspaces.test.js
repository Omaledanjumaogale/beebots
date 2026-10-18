import {describe,it,expect,vi,afterEach} from 'vitest';
import {normalizeBars,paperCycle,PAPER_ID,DATA_KEY} from './workspaces.js';
import {okxHeaders,okxLiveAccount} from './okx.js';
import {createHmac} from 'node:crypto';
import {HiveControl} from './worker.js';
afterEach(()=>vi.unstubAllGlobals());
function rows(count=30){const end=Math.floor((Date.now()-600000)/300000)*300000;return Array.from({length:count},(_,i)=>({t:new Date(end-(count-1-i)*300000).toISOString(),o:100,h:102,l:99,c:101,v:2}));}
function state(){const db=new Map();return {blockConcurrencyWhile:f=>f(),storage:{get:async k=>db.get(k),put:async(k,v)=>{if(typeof k==='object')Object.entries(k).forEach(([a,b])=>db.set(a,b));else db.set(k,v);}}};}
describe('separate real-market paper workspace',()=>{
 it('normalizes actual schema, excludes the open bar and rejects gaps or malformed OHLC',()=>{
   const valid=rows();expect(normalizeBars([...valid].reverse())).toHaveLength(30);
   expect(()=>normalizeBars(valid.filter((_,i)=>i!==10))).toThrow(/gapped/);
   expect(()=>normalizeBars(valid.map((b,i)=>i===10?{...b,l:103}:b))).toThrow(/Malformed/);
   expect(normalizeBars([...valid,{t:new Date().toISOString(),o:1,h:1,l:1,c:1,v:0}])).toHaveLength(30);
 });
 it('can explicitly select and disclose a later uninterrupted segment without filling gaps',()=>{
   const raw=rows(100).filter((_,i)=>i!==10),selected=normalizeBars(raw,Date.now(),true);expect(selected).toHaveLength(89);expect(selected.coverage.gaps).toHaveLength(1);expect(selected.coverage.excludedEarlierBars).toBe(10);
   expect(()=>normalizeBars([...raw,raw.at(-1)],Date.now(),true)).toThrow(/Duplicate/);
 });
 it('does not fetch when paused and never invents a cycle',async()=>{
   const spy=vi.fn();vi.stubGlobal('fetch',spy);
   const result=await paperCycle({},async()=>Response.json({config:{paused:true}}),vi.fn());expect(result.status).toBe('paused');expect(spy).not.toHaveBeenCalled();
 });
 it('stores isolated provenance and evaluates once per fresh closed bar, not historical fills',async()=>{
   const objects=new Map(),env={ALPACA_API_KEY:'paper',ALPACA_SECRET_KEY:'test',ARTIFACTS:{get:async key=>objects.has(key)?{json:async()=>JSON.parse(objects.get(key))}:null}};
   const c=new HiveControl(state(),env),control=async(_env,body,name)=>{expect(name).toBe(PAPER_ID);return c.fetch(new Request('https://control/',{method:'POST',body:JSON.stringify(body)}));};
   await control(env,{action:'configure',paused:false,providers:{alpaca:{enabled:true}},bees:[{id:'drift',enabled:true}]},PAPER_ID);
   vi.stubGlobal('fetch',vi.fn(async()=>Response.json({bars:{'BTC/USD':rows()}})));
   const put=async(_env,key,value)=>objects.set(key,value);
   const first=await paperCycle(env,control,put);expect(first.status).toBe('evaluated');expect(objects.has(DATA_KEY)).toBe(true);expect(first.retainedBars).toBe(30);expect(first.datasetSha256).toHaveLength(64);
   const second=await paperCycle(env,control,put);expect(second.events).toBe(0);expect(second.retainedBars).toBe(30);
   expect([...objects.keys()].some(k=>k==='datasets/drift.json')).toBe(false);
 });
 it('scores an already recorded shadow forecast only after its next bar arrives',async()=>{
   const c=new HiveControl(state(),{}),call=async body=>(await c.fetch(new Request('https://control/',{method:'POST',body:JSON.stringify(body)}))).json();
   await call({action:'configure',paused:false,bees:[{id:'drift',enabled:true}]});
   const bars=normalizeBars(rows()).map(b=>({time:b.time,close:b.close})),model={weights:[Math.log(4),0,0,0],mean:[0,0,0],sd:[1,1,1],version:'test'};
   const tick={action:'tick',bars,symbol:'BTC/USD',provider:'alpaca',models:{drift:model}};
   const first=await call(tick);expect(first.paper['drift:BTC/USD'].forwardShadow).toBeUndefined();
   const second=await call({...tick,bars:[...bars,{time:bars.at(-1).time+300000,close:102}]});expect(second.paper['drift:BTC/USD'].forwardShadow.samples).toBe(1);expect(second.paper['drift:BTC/USD'].forwardShadow.brierSum).toBeCloseTo(.04);
   const duplicate=await call({...tick,bars:[...bars,{time:bars.at(-1).time+300000,close:102}]});expect(duplicate.paper['drift:BTC/USD'].forwardShadow.samples).toBe(1);
 });
});
describe('OKX real-fund boundary',()=>{
 it('signs the exact GET path/query and explicitly chooses live',async()=>{
   const env={OKX_API_KEY:'key',OKX_SECRET_KEY:'secret',OKX_PASSPHRASE:'pass'},path='/api/v5/account/balance',time='2026-10-17T12:00:00.000Z';
   const headers=await okxHeaders(env,path,time);expect(headers['OK-ACCESS-SIGN']).toBe(createHmac('sha256','secret').update(time+'GET'+path).digest('base64'));expect(headers['x-simulated-trading']).toBe('0');
 });
 it('never contacts the broker or fabricates a balance without live credentials',async()=>{
   const spy=vi.fn();vi.stubGlobal('fetch',spy);const result=await okxLiveAccount({});expect(result.balance).toBeNull();expect(result.executionEnabled).toBe(false);expect(spy).not.toHaveBeenCalled();
 });
 it('does not send credentials to an arbitrary API origin',async()=>{
   const spy=vi.fn();vi.stubGlobal('fetch',spy);const result=await okxLiveAccount({OKX_API_KEY:'key',OKX_SECRET_KEY:'secret',OKX_PASSPHRASE:'pass',OKX_API_ORIGIN:'https://evil.example'});expect(result.status).toBe('invalid-config');expect(spy).not.toHaveBeenCalled();
 });
 it('fails closed on upstream rejection with no paper fallback',async()=>{
   vi.stubGlobal('fetch',vi.fn(async()=>Response.json({code:'50101',data:[]})));const result=await okxLiveAccount({OKX_API_KEY:'key',OKX_SECRET_KEY:'secret',OKX_PASSPHRASE:'pass'});expect(result.status).toBe('unavailable');expect(result.balance).toBeNull();expect(result.orders).toEqual([]);
 });
});
