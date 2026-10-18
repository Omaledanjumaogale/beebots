import {describe,it,expect} from 'vitest';
import {trainRetained} from './train-batch.mjs';
describe('external retained-data training',()=>{
 it('does not replace reports for identical inputs and never activates a model',async()=>{
  const db=new Map(),writes=[];const bars=Array.from({length:1200},(_,i)=>({time:300000*(i+1),close:100}));
  db.set('datasets/paper-alpaca-btc-usd-v1/bars.json',bars);
  const store={get:async k=>db.get(k)??null,put:async(k,v)=>{db.set(k,v);writes.push(k);}};
  const first=await trainRetained(store);expect(first.filter(r=>r.writes===2)).toHaveLength(3);expect(writes).toHaveLength(6);
  for(const [key,value]of db)if(key.startsWith('training/')){expect(value.executionApproved).toBe(false);expect(value.compute).toBe('github-actions-node');}
  const count=writes.length;const second=await trainRetained(store);expect(second.every(r=>r.writes===0)).toBe(true);expect(writes).toHaveLength(count);
  expect(writes.some(k=>k.startsWith('models/'))).toBe(false);
 });
});
