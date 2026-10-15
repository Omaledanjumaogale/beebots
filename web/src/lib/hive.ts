export type Market = {symbol:string;name:string;price:number|null;change:number|null;volume:string;spread:number|null;kind:'crypto'|'forex';icon:string;color:string};
export type Bee = {id:string;name:string;role:string;color:string;status:'paper'|'research'|'paused';model:string;description:string};
export type Candle = {time:number;open:number;high:number;low:number;close:number;volume:number};
export type PaperPosition = {id:string;symbol:string;quantity:number;entry:number;cost:number;beeId?:string;openedAt:number};
export type LedgerEntry = {id:string;time:number;type:string;symbol:string;side:string;quantity:number;price:number;fee:number;cash:number;source:string;pnl?:number};
export type PaperOrder = {id:string;symbol:string;side:'buy'|'sell';amount:number;status:string;time:number};
export type PaperAccount = {cash:number;equity:number;positions:PaperPosition[];ledger:LedgerEntry[];orders:PaperOrder[];paused:boolean};
const symbols=[['BTC-USDT','Bitcoin','₿','#f59e0b'],['ETH-USDT','Ethereum','Ξ','#a5b4fc'],['SOL-USDT','Solana','◎','#67e8c0'],['BNB-USDT','BNB','B','#facc15'],['XRP-USDT','XRP','X','#e2e8f0'],['DOGE-USDT','Dogecoin','Ð','#c9ae66'],['AVAX-USDT','Avalanche','A','#fb7185'],['LINK-USDT','Chainlink','L','#6c95ff']];
export const marketCatalog:Market[]=symbols.map(([symbol,name,icon,color])=>({symbol,name,icon,color,price:null,change:null,volume:'—',spread:null,kind:'crypto'}));
export const beeCatalog:Bee[]=[
 ['drift','Drift','Trend following','#e8b74c','Mean trend baseline','Cloud baseline compares sampled spot quotes with their recent mean.'],
 ['rebound','Rebound','Mean reversion','#a78bfa','Mean reversion baseline','Cloud baseline evaluates deviations from recent sampled spot quotes.'],
 ['breaker','Breaker','Breakout detection','#f472b6','Extrema baseline','Cloud baseline compares sampled spot quotes with prior extrema.'],
 ['compass','Compass','Market regimes','#5bc0eb','Regime candidate','Classify trend, range and volatility regimes.'],
 ['volta','Volta','Volatility research','#67e8c0','Volatility candidate','Forecast return intervals; training pending.'],
 ['carry','Carry','Funding & basis','#c2a3ff','Carry research','Measure funding and rollover economics.'],
 ['pulse','Pulse','Order flow','#fb923c','Microstructure candidate','Requires event-level order book datasets.'],
 ['surface','Surface','Options research','#f9a8d4','Pricing benchmark','Options pricing and risk; chain feed pending.'],
 ['macro','Macro','Economic events','#7dd3fc','Event research','Point-in-time economic event alignment.'],
 ['newswire','Newswire','News intelligence','#a3e635','Retrieval research','Sourced news extraction; provider pending.'],
 ['scout','Scout','Data discovery','#fbbf24','Connector registry','Discover permitted data feeds.'],
 ['archivist','Archivist','Data lineage','#94a3b8','Dataset manifests','Preserve source timestamps and immutable versions.'],
 ['sentinel','Sentinel','Data quality','#fb7185','Quality checks','Block stale quotes and malformed candles.'],
 ['candle','Candle','Bar construction','#c4b5fd','Session-aware bars','Validate open, high, low and close data.'],
 ['calibrator','Calibrator','Probability checks','#38bdf8','Calibration research','Reliability curves and proper scoring.'],
 ['weaver','Weaver','Ensemble research','#2dd4bf','Constrained ensemble','Combine validated forecasts by regime.'],
 ['auditor','Auditor','Experiment review','#fda4af','Leakage checks','Challenge leakage and selection bias.'],
 ['guardian','Guardian','Risk control','#fcd34d','Deterministic controls','Risk limits independent of model output.'],
 ['pilot','Pilot','Paper execution','#93c5fd','Paper simulator','Fee-aware simulated fills only.'],
 ['beekeeper','Beekeeper','Research coach','#fbbf24','Gated proposals','Propose challengers; cannot self-promote.']
].map(([id,name,role,color,model,description],i)=>({id,name,role,color,model,description,status:i<3?'paper':'research'}));
const allowed=new Set(marketCatalog.map(m=>m.symbol));
const bases:Record<string,number>={'BTC-USDT':67000,'ETH-USDT':3400,'SOL-USDT':145,'BNB-USDT':580,'XRP-USDT':0.55,'DOGE-USDT':0.12,'AVAX-USDT':28,'LINK-USDT':14};
function assertSymbol(symbol:string){if(!allowed.has(symbol))throw new Error('Unsupported market');}
async function readPublic(path:string){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 try {const response=await fetch(`/api/market?${path}`,{signal:controller.signal});if(!response.ok)throw new Error('Public market feed unavailable');return await response.json();}finally{clearTimeout(timer);}
}
export function previewCandles(symbol:string,bar='15m'):Candle[]{
 const interval=bar==='1m'?60:bar==='5m'?300:bar==='1H'?3600:bar==='4H'?14400:bar==='1D'?86400:900;
 const start=1760486400;let price=bases[symbol]??67000;let seed=17;
 return Array.from({length:96},(_,i)=>{seed=(seed*16807)%2147483647;const open=price;const wave=Math.sin(i/6)*0.0017+(seed/2147483647-.47)*.005;price=open*(1+wave);return {time:start+i*interval,open,close:price,high:Math.max(open,price)*1.002,low:Math.min(open,price)*.998,volume:40+(seed%130)};});
}
export async function fetchCandles(symbol:string,timeframe='15m'):Promise<{candles:Candle[];time:number;source:string;live:boolean}>{
 assertSymbol(symbol);
 try {const result=await readPublic(`type=candles&symbol=${encodeURIComponent(symbol)}&bar=${encodeURIComponent(timeframe)}`);return {candles:result.candles,time:result.time,source:result.source,live:true};}
 catch{return {candles:previewCandles(symbol,timeframe),time:1760486400000,source:'Preview dataset · synthetic · 15 Oct 2025',live:false};}
}
export async function fetchQuotes():Promise<Market[]>{
 try {const result=await readPublic('type=quotes');return marketCatalog.map(m=>{const q=result.quotes.find((v:any)=>v.symbol===m.symbol);return q?{...m,...q}:m;});}catch{return marketCatalog;}
}
const storageKey='omie-paper-v1';
export const initialPaper=():PaperAccount=>({cash:10000,equity:10000,positions:[],ledger:[],orders:[],paused:false});
export function loadPaper():PaperAccount {
 if(typeof localStorage==='undefined')return initialPaper();
 try{const p=JSON.parse(localStorage.getItem(storageKey)??'null');if(p&&Number.isFinite(p.cash)&&p.cash>=0&&Array.isArray(p.positions)&&Array.isArray(p.ledger)&&Array.isArray(p.orders))return p;}catch{/* recover isolated preview state */}return initialPaper();
}
export function savePaper(p:PaperAccount){if(typeof localStorage!=='undefined')localStorage.setItem(storageKey,JSON.stringify(p));}
let orderBusy=false;
async function paperLock<T>(work:()=>Promise<T>):Promise<T>{
 if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request('omiebot-paper-account',work);
 return work();
}
export async function placePaperOrder(account:PaperAccount,order:{symbol:string;side:'buy'|'sell';amount:number;beeId?:string}):Promise<PaperAccount>{
 return paperLock(()=>executePaperOrder(typeof localStorage==='undefined'?account:loadPaper(),order));
}
async function executePaperOrder(account:PaperAccount,order:{symbol:string;side:'buy'|'sell';amount:number;beeId?:string}):Promise<PaperAccount>{
 assertSymbol(order.symbol);if(orderBusy)throw new Error('A paper order is already processing');if(account.paused)throw new Error('Guardian has paused new orders');if(!Number.isFinite(order.amount)||order.amount<10||order.amount>2500)throw new Error('Order size must be $10–$2,500');
 orderBusy=true;
 try{const q=await readPublic(`type=quote&symbol=${encodeURIComponent(order.symbol)}`);
 if(!Number.isFinite(q.time)||!Number.isFinite(q.ask)||!Number.isFinite(q.bid)||q.ask<=0||q.bid<=0||q.ask<q.bid||Date.now()-q.time>15000||q.time>Date.now()+5000)throw new Error('Fresh executable quote required');
 const spread=(q.ask-q.bid)/q.ask*10000;if(spread>20)throw new Error('Spread exceeds Guardian limit of 20 bps');
 const next:PaperAccount=structuredClone(account);const feeRate=.001;const time=Date.now();const id=crypto.randomUUID();let quantity:number,price:number,fee:number,pnl=0;
 if(order.side==='buy'){
  price=q.ask;quantity=order.amount/price;fee=order.amount*feeRate;if(order.amount+fee>next.cash)throw new Error('Insufficient paper cash including fee');
  const exposure=next.positions.reduce((s,p)=>s+p.cost,0);if(exposure+order.amount>5000)throw new Error('Portfolio exposure cap is $5,000');
  next.cash-=order.amount+fee;next.positions.push({id,symbol:order.symbol,quantity,entry:price,cost:order.amount+fee,beeId:order.beeId,openedAt:time});
 }else{
  price=q.bid;quantity=order.amount/price;const holdings=next.positions.filter(p=>p.symbol===order.symbol);const available=holdings.reduce((s,p)=>s+p.quantity,0);if(quantity>available*(1+1e-10))throw new Error('Spot selling requires an existing paper holding');
  let remaining=quantity;let cost=0;next.positions=next.positions.flatMap(p=>{if(p.symbol!==order.symbol||remaining<1e-12)return [p];const take=Math.min(p.quantity,remaining);const fraction=take/p.quantity;cost+=p.cost*fraction;remaining-=take;return take>=p.quantity*(1-1e-10)?[]:[{...p,quantity:p.quantity-take,cost:p.cost*(1-fraction)}];});
  fee=quantity*price*feeRate;next.cash+=quantity*price-fee;pnl=quantity*price-cost-fee;
 }
 next.ledger.unshift({id,time,type:'paper-fill',symbol:order.symbol,side:order.side,quantity,price,fee,cash:next.cash,source:q.source,pnl});next.orders.unshift({id,symbol:order.symbol,side:order.side,amount:order.amount,status:'Filled · simulated',time});next.equity=next.cash+next.positions.reduce((s,p)=>s+p.cost,0);savePaper(next);return next;
 }finally{orderBusy=false;}
}
export async function closePaperPosition(account:PaperAccount,id:string):Promise<PaperAccount>{
 return paperLock(()=>executeClose(typeof localStorage==='undefined'?account:loadPaper(),id));
}
async function executeClose(account:PaperAccount,id:string):Promise<PaperAccount>{
 if(orderBusy)throw new Error('A paper order is already processing');orderBusy=true;
 try{
 const position=account.positions.find(p=>p.id===id);if(!position)throw new Error('Position no longer exists');
 // Closing risk remains possible while new orders are paused.
 const q=await readPublic(`type=quote&symbol=${encodeURIComponent(position.symbol)}`);
 if(!Number.isFinite(q.time)||!Number.isFinite(q.bid)||q.bid<=0||Date.now()-q.time>15000||q.time>Date.now()+5000)throw new Error('Fresh bid required to close');
 const next=structuredClone(account);const value=position.quantity*q.bid;const fee=value*.001;next.cash+=value-fee;next.positions=next.positions.filter(p=>p.id!==id);next.equity=next.cash+next.positions.reduce((s,p)=>s+p.cost,0);next.ledger.unshift({id:crypto.randomUUID(),time:Date.now(),type:'paper-close',symbol:position.symbol,side:'sell',quantity:position.quantity,price:q.bid,fee,cash:next.cash,source:q.source,pnl:value-fee-position.cost});savePaper(next);return next;
 }finally{orderBusy=false;}
}
export function exportLedger(account:PaperAccount){const data=new Blob([JSON.stringify({mode:'local-paper',exportedAt:new Date().toISOString(),account},null,2)],{type:'application/json'});const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download='omie-paper-ledger.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
