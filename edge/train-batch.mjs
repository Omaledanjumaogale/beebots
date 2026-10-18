import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {trainCandidate} from './training.js';
const bees=['drift','rebound','breaker'],workspace='paper-alpaca-btc-usd-v1',revision='logistic-v1';
export async function trainRetained(store,{now=()=>new Date().toISOString()}={}){
 const outcomes=[];
 for(const scope of ['legacy',workspace]){
  const shared=scope==='legacy'?null:await store.get(`datasets/${workspace}/bars.json`);
  for(const bee of bees){
   const namespace=scope==='legacy'?'':workspace+'/',raw=shared??(scope==='legacy'?await store.get(`datasets/${bee}.json`):null);
   if(!raw){outcomes.push({scope,bee,status:'awaiting-data',writes:0});continue;}
   if(!Array.isArray(raw)||raw.length>5000)throw Error('Retained dataset exceeds its bound');
   const bars=raw.slice(-2000),datasetSha256=createHash('sha256').update(JSON.stringify(bars)).digest('hex');
   const latest=`training/${namespace}${bee}/latest.json`,previous=await store.get(latest);
   if(previous?.datasetSha256===datasetSha256&&previous?.trainingRevision===revision){outcomes.push({scope,bee,status:previous.status,unchanged:true,writes:0});continue;}
   const incumbent=scope==='legacy'?await store.get(`models/${bee}/challenger.json`):null;
   const result=trainCandidate(bars,incumbent),at=now();
   const report={...result,at,compute:'github-actions-node',trainingRevision:revision,maxSamples:2000,epochs:10,workspace:scope,samples:bars.length,firstBar:bars[0]?.time,lastBar:bars.at(-1)?.time,datasetSha256,executionApproved:false};
   // Retained reports are shadow evidence. This job never submits orders or promotes models.
   await store.put(`training/${namespace}${bee}/${revision}-${datasetSha256}.json`,report);
   await store.put(latest,report);outcomes.push({scope,bee,status:result.status,writes:2,samples:bars.length,datasetSha256});
  }
 }
 return outcomes;
}
export function r2Store(env){
 if(!env.OMIE_CF_ACCOUNT_ID||!env.OMIE_R2_API_TOKEN)throw Error('R2 runner credentials are not configured');
 const base=`https://api.cloudflare.com/client/v4/accounts/${env.OMIE_CF_ACCOUNT_ID}/r2/buckets/omiebot-retained-data/objects/`;
 async function call(key,method='GET',value){
  const body=value===undefined?undefined:JSON.stringify(value);if(body&&Buffer.byteLength(body)>512000)throw Error('Report exceeds 512KB');
  const r=await fetch(base+key.split('/').map(encodeURIComponent).join('/'),{method,headers:{Authorization:`Bearer ${env.OMIE_R2_API_TOKEN}`,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(30000)});
  if(r.status===404&&method==='GET')return null;
  if(!r.ok)throw Error(`R2 ${method} failed (${r.status}); no provider or Worker fallback`);
  if(method==='GET'){const text=await r.text();if(Buffer.byteLength(text)>2000000)throw Error('Dataset exceeds 2MB');return JSON.parse(text);}
 }
 return {get:key=>call(key),put:(key,value)=>call(key,'PUT',value)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify({at:new Date().toISOString(),outcomes:await trainRetained(r2Store(process.env))}));
