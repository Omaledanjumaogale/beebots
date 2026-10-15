import { json,error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {authEnv} from '$lib/server/auth';
const symbols=new Set(['BTC-USDT','ETH-USDT','SOL-USDT','BNB-USDT','XRP-USDT','DOGE-USDT','AVAX-USDT','LINK-USDT']);
const bars=new Set(['1m','5m','15m','1H','4H','1D']);
async function upstream(fetcher:typeof fetch,path:string,runtime:Record<string,string|undefined>){
 const parsed=new URL('https://market.invalid/'+path);const endpoint=parsed.pathname.split('/').at(-1)!;
 const query=new URLSearchParams({provider:'okx',endpoint,symbol:parsed.searchParams.get('instId')??'SPOT'});if(parsed.searchParams.has('bar'))query.set('bar',parsed.searchParams.get('bar')!);
 if(!runtime.EDGE_RUNTIME_URL||!runtime.EDGE_SERVICE_SECRET)throw error(503,'Market runtime is not configured');
 const res=await fetcher(`${runtime.EDGE_RUNTIME_URL}/market?${query}`,{headers:{Authorization:`Bearer ${runtime.EDGE_SERVICE_SECRET}`},signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw error(res.status===429?429:503,'Market provider unavailable or budget exhausted');const envelope=await res.json();const body=envelope.data;if(body?.code!=='0'||!Array.isArray(body.data))throw error(503,'Market provider rejected request');return body.data;
}
export const GET:RequestHandler=async({url,fetch,platform})=>{
 const runtime=authEnv(platform);
 const type=url.searchParams.get('type');const symbol=url.searchParams.get('symbol')??'BTC-USDT';if(!symbols.has(symbol))throw error(400,'Unsupported instrument');
 if(type==='candles'){
  const bar=url.searchParams.get('bar')??'15m';if(!bars.has(bar))throw error(400,'Unsupported timeframe');
  const rows=await upstream(fetch,`market/candles?instId=${symbol}&bar=${bar}&limit=150`,runtime);
  const candles=rows.filter((r:any)=>r[8]==='1').map((r:any)=>({time:Number(r[0])/1000,open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])})).filter((c:any)=>Object.values(c).every(Number.isFinite)).reverse();
  if(!candles.length)throw error(503,'No closed candles');return json({candles,time:Date.now(),source:'OKX public REST · closed spot candles'},{headers:{'Cache-Control':'public, max-age=10'}});
 }
 if(type==='quotes'){
  const rows=await upstream(fetch,'market/tickers?instType=SPOT',runtime);const quotes=rows.filter((r:any)=>symbols.has(r.instId)).map((r:any)=>({symbol:r.instId,price:Number(r.last),change:(Number(r.last)/Number(r.open24h)-1)*100,volume:compact(Number(r.volCcy24h)),spread:(Number(r.askPx)-Number(r.bidPx))/Number(r.askPx)*10000,time:Number(r.ts)})).filter((r:any)=>r.price>0&&Date.now()-r.time<360000);return json({quotes,time:Date.now(),source:'OKX public REST · shared quota cache'},{headers:{'Cache-Control':'public, max-age=30'}});
 }
 if(type==='quote'){
  const rows=await upstream(fetch,`market/ticker?instId=${symbol}`,runtime);const r=rows[0];if(!r)throw error(503,'Quote missing');return json({symbol,bid:Number(r.bidPx),ask:Number(r.askPx),time:Number(r.ts),source:'OKX public REST · simulated spot fill'},{headers:{'Cache-Control':'no-store'}});
 }
 throw error(400,'Unsupported request');
};
function compact(n:number){return n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(1)}M`:`$${n.toFixed(0)}`;}
