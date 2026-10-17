import {describe,it,expect} from 'vitest';
import {bees,marketOpen,validateMarket} from './policy.js';
import {trainCandidate} from './training.js';
import {HiveControl} from './worker.js';
function state(){const db=new Map();return {blockConcurrencyWhile:f=>f(),storage:{get:async k=>db.get(k),put:async(k,v)=>{if(typeof k==='object')Object.entries(k).forEach(([a,b])=>db.set(a,b));else db.set(k,v);}}};}
describe('edge safety contracts',()=>{
  it('has twenty distinct bees but only three executable baselines',()=>{expect(bees()).toHaveLength(20);expect(bees().filter(b=>b.executable)).toHaveLength(3);});
  it('never treats weekend forex as open',()=>{expect(marketOpen('forex',new Date('2026-10-17T12:00:00Z'))).toBe(false);expect(marketOpen('crypto',new Date('2026-10-17T12:00:00Z'))).toBe(true);});
  it('rejects arbitrary URL endpoints and symbols',()=>{expect(validateMarket('twelvedata','https://evil.test','BTC/USD')).toBe(false);expect(validateMarket('twelvedata','price','BTC/USD')).toBe(true);});
  it('skips incomplete and duplicated training datasets',()=>{expect(trainCandidate([]).status).toBe('skipped');expect(trainCandidate([{time:1,close:1},{time:1,close:2}]).reason).toContain('duplicate');});
  it('does not promote a flat-price candidate or invent short trades',()=>{const result=trainCandidate(Array.from({length:1200},(_,i)=>({time:i*300000,close:100})));expect(result.status).toBe('rejected');expect(result.metrics.netReturn).toBe(0);expect(result.metrics.trades).toBe(0);expect(result.executionApproved).toBe(false);});
  it('rejects invalid prices, reversed bars, gaps and future training bars',()=>{
    const bars=Array.from({length:1200},(_,i)=>({time:i*300000,close:100}));
    expect(trainCandidate(bars.map((b,i)=>i===10?{...b,close:NaN}:b)).status).toBe('skipped');
    expect(trainCandidate([...bars].reverse()).status).toBe('skipped');
    expect(trainCandidate(bars.filter((_,i)=>i!==30)).status).toBe('skipped');
    expect(trainCandidate(bars.map((b,i)=>({...b,time:Date.now()+i*300000}))).status).toBe('skipped');
  });
  it('rejects live mode and reserves requests before calls',async()=>{
    const c=new HiveControl(state(),{});const call=async body=>(await c.fetch(new Request('https://control/',{method:'POST',body:JSON.stringify(body)})));
    expect((await call({action:'configure',mode:'live'})).status).toBe(409);
    expect((await call({action:'reserve',provider:'marketstack'})).status).toBe(403);
    await call({action:'configure',providers:{marketstack:{enabled:true}}});
    expect((await call({action:'reserve',provider:'marketstack'})).status).toBe(200);
    expect((await call({action:'reserve',provider:'marketstack'})).status).toBe(429);
  });
  it('persists five login attempts then denies the sixth',async()=>{
    const c=new HiveControl(state(),{});const call=()=>c.fetch(new Request('https://control/',{method:'POST',body:JSON.stringify({action:'rate',key:'a'.repeat(64)})}));
    for(let i=0;i<5;i++)expect((await call()).status).toBe(200);
    const denied=await call();expect(denied.status).toBe(429);expect((await denied.json()).allowed).toBe(false);
  });
  it('simulates a capped entry once per closed bar and exits on a stop',async()=>{
    const c=new HiveControl(state(),{});const call=async body=>(await c.fetch(new Request('https://control/',{method:'POST',body:JSON.stringify(body)}))).json();
    await call({action:'configure',paused:false,bees:[{id:'drift',enabled:true}]});
    const now=Date.now(),bars=Array.from({length:26},(_,i)=>({time:now-(27-i)*300000,close:100+i}));
    const tick={action:'tick',bars,symbol:'BTC-USDT',provider:'okx'};
    const first=await call(tick);expect(first.events).toHaveLength(1);expect(first.events[0].notional).toBe(25);expect(first.events[0].mode).toBe('simulation');
    expect((await call(tick)).events).toHaveLength(0);
    const stopped=await call({...tick,bars:[...bars,{time:now-300000,close:110}]});expect(stopped.events[0].side).toBe('sell');
    expect(stopped.paper['drift:BTC-USDT'].quantity).toBe(0);
  });
});
