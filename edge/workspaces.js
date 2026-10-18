// Isolated spot-paper workspace. No live order submission is implemented here.
export const PAPER_ID='paper-alpaca-btc-usd-v1';
export const DATA_KEY='datasets/paper-alpaca-btc-usd-v1/bars.json';
export const SYMBOL='BTC/USD';
export const STEP=300000;
export function normalizeBars(raw,now=Date.now(),selectLatestSegment=false){
  if(!Array.isArray(raw))throw Error('Missing provider bars');
  const mapped=raw.map(b=>({time:Date.parse(b.t),open:Number(b.o),high:Number(b.h),low:Number(b.l),close:Number(b.c),volume:Number(b.v)}));
  if(mapped.some(b=>!Object.values(b).every(Number.isFinite)))throw Error('Malformed provider values');
  const bars=mapped.filter(b=>b.time+STEP<=now);
  if(bars.some(b=>!Object.values(b).every(Number.isFinite)||b.time<=0||b.time%STEP!==0||b.low<=0||b.volume<0||b.low>Math.min(b.open,b.close)||b.high<Math.max(b.open,b.close)||b.low>b.high))throw Error('Malformed provider OHLCV');
  bars.sort((a,b)=>a.time-b.time);
  if(bars.some((b,i)=>i>0&&b.time===bars[i-1].time))throw Error('Duplicate provider bars');
  const gaps=bars.flatMap((b,i)=>i>0&&b.time-bars[i-1].time!==STEP?[{index:i,previous:bars[i-1].time,next:b.time}]:[]);
  if(gaps.length&&!selectLatestSegment)throw Error('Duplicate or gapped provider bars');
  const offset=gaps.at(-1)?.index??0,selected=bars.slice(offset);
  if(selected.length<25||now-selected.at(-1).time>900000)throw Error('Insufficient or stale contiguous provider bars');
  selected.coverage={gaps,excludedEarlierBars:offset,selection:'Latest uninterrupted closed-bar segment; no imputed candles'};
  return selected;
}
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function paperCycle(env,control,put,{bootstrap=false}={}){
  const call=body=>control(env,body,PAPER_ID);
  const state=await(await call({action:'status'})).json();
  if(state.config.paused)return {status:'paused',workspace:PAPER_ID};
  const reservation=await call({action:'reserve',provider:'alpaca',endpoint:'bars'});
  if(!reservation.ok)return record({status:'abstain',reason:(await reservation.json()).error});
  try{
    const url=new URL('https://data.alpaca.markets/v1beta3/crypto/us/bars');
    url.search=new URLSearchParams({symbols:SYMBOL,timeframe:'5Min',start:new Date(Date.now()-(bootstrap?7:1)*86400000).toISOString(),limit:String(bootstrap?2000:300),sort:'desc'});
    const r=await fetch(url,{headers:{'APCA-API-KEY-ID':env.ALPACA_API_KEY,'APCA-API-SECRET-KEY':env.ALPACA_SECRET_KEY},signal:AbortSignal.timeout(15000)});
    if(!r.ok){await call({action:'providerBackoff',provider:'alpaca',status:r.status});return record({status:'abstain',reason:`Alpaca market HTTP ${r.status}`});}
    const body=await r.text();if(body.length>1024*1024)throw Error('Provider response too large');
    const raw=JSON.parse(body).bars?.[SYMBOL],bars=normalizeBars(raw,Date.now(),true);
    if(bars.coverage.gaps.length)await put(env,`datasets/${PAPER_ID}/source-window.json`,JSON.stringify({at:new Date().toISOString(),bars:raw,coverage:bars.coverage}));
    const previous=await env.ARTIFACTS.get(DATA_KEY),old=previous?await previous.json():[];
    if(!Array.isArray(old)||old.some(b=>!Number.isFinite(b.time)||!Number.isFinite(b.close)))throw Error('Retained dataset invalid');
    // A second provider/instrument never enters this namespace. Preserve gaps rather than inventing candles.
    const merged=[...new Map([...old,...bars].map(b=>[b.time,b])).values()].sort((a,b)=>a.time-b.time).slice(-5000);
    const combined=normalizeBars(merged.map(b=>({t:new Date(b.time).toISOString(),o:b.open,h:b.high,l:b.low,c:b.close,v:b.volume})),Date.now(),true);
    const encoded=JSON.stringify(combined);await put(env,DATA_KEY,encoded);
    const manifest={provider:'alpaca',location:'us',symbol:SYMBOL,intervalMs:STEP,bars:combined.length,firstBar:combined[0].time,lastBar:combined.at(-1).time,sha256:await digest(encoded),at:new Date().toISOString(),sourceCoverage:bars.coverage,retainedCoverage:combined.coverage,use:'operator research and paper evaluation',redistributionApproved:false};
    await put(env,'datasets/'+PAPER_ID+'/manifest.json',JSON.stringify(manifest));
    const models={};for(const bee of ['drift','rebound','breaker']){const artifact=await env.ARTIFACTS.get(`training/${PAPER_ID}/${bee}/latest.json`);if(artifact){const model=await artifact.json();if(model.candidate)models[bee]={...model.candidate,version:model.datasetSha256};}}
    // No historical simulated fills: only the latest fresh closed bar is evaluated on each cycle.
    const tick=await call({action:'tick',bars,models,symbol:SYMBOL,provider:'alpaca'});const result=await tick.json();
    if(!tick.ok)throw Error(result.error||'Evaluation failed');
    if(result.events?.length)await put(env,`paper/${PAPER_ID}/${bars.at(-1).time}.json`,JSON.stringify(result.events));
    return record({status:'evaluated',provider:'alpaca',symbol:SYMBOL,closedBars:bars.length,retainedBars:combined.length,lastBar:bars.at(-1).time,events:result.events?.length??0,datasetSha256:manifest.sha256});
  }catch(e){return record({status:'abstain',reason:e instanceof Error?e.message:'Market evaluation failed'});}
  async function record(result){const value={...result,at:new Date().toISOString(),workspace:PAPER_ID,mode:'paper'};await call({action:'cycleEvidence',result:{...value,outcomes:[{symbol:SYMBOL,status:result.status==='evaluated'?200:503,reason:result.reason}]}});return value;}
}
export async function marketSnapshot(env,control,put){
  const key=`market/${PAPER_ID}/latest.json`,cached=await env.ARTIFACTS.get(key);
  if(cached){const value=await cached.json();if(Date.now()-value.at<60000)return value;}
  const reserved=await control(env,{action:'reserve',provider:'alpaca',endpoint:'quotes'},PAPER_ID);if(!reserved.ok)throw Error('Shared market request budget unavailable');
  const symbols=['BTC/USD','ETH/USD','SOL/USD','LTC/USD','DOGE/USD'];
  const url='https://data.alpaca.markets/v1beta3/crypto/us/latest/quotes?symbols='+encodeURIComponent(symbols.join(','));
  const r=await fetch(url,{headers:{'APCA-API-KEY-ID':env.ALPACA_API_KEY,'APCA-API-SECRET-KEY':env.ALPACA_SECRET_KEY},signal:AbortSignal.timeout(10000)});
  if(!r.ok){await control(env,{action:'providerBackoff',provider:'alpaca',status:r.status},PAPER_ID);throw Error(`Market quotes HTTP ${r.status}`);}
  const d=await r.json(),quotes=[];
  for(const symbol of symbols){const q=d.quotes?.[symbol];if(!q)continue;const bid=Number(q.bp),ask=Number(q.ap),time=Date.parse(q.t);if(!(bid>0&&ask>=bid&&Number.isFinite(time)&&time<=Date.now()&&Date.now()-time<=120000))continue;quotes.push({symbol,bid,ask,price:(bid+ask)/2,time,spreadBps:(ask-bid)/ask*10000});}
  if(!quotes.length)throw Error('No fresh verified quotes');
  const value={at:Date.now(),provider:'alpaca',location:'us',quotes,coverage:'Five crypto spot pairs; not all global markets',source:'Actual provider bid/ask; not execution prices'};await put(env,key,JSON.stringify(value));return value;
}
