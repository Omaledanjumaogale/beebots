import {PROVIDERS,bees,buckets,marketOpen,validateMarket} from './policy.js';
import {trainCandidate} from './training.js';
import {PAPER_ID,DATA_KEY,SYMBOL,paperCycle,marketSnapshot} from './workspaces.js';
import {okxLiveAccount} from './okx.js';
import {brokerLink} from './broker-vault.js';
import {dataPlane,retryPublications,publicPaper,hash} from './data-plane.js';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const defaults=()=>({mode:'paper',paused:true,feeds:[],providers:{},bees:bees(),maxOrderUsd:25});
export class HiveControl {
  constructor(state,env){this.state=state;this.env=env;}
  async fetch(request){
    return this.state.blockConcurrencyWhile(async()=>{
      const {action,...data}=await request.json();
      const config=await this.state.storage.get('config')||defaults();
      if(action==='dataPlane'){try{return json(await dataPlane(this.state,this.env,data.input,artifactPut));}catch(e){return json({error:e instanceof Error?e.message:'Data plane unavailable'},503);}}
      if(action==='retryPublications')return json(await retryPublications(this.state,this.env,artifactPut));
      if(action==='publicationStatus')return json({pending:(await this.state.storage.list({prefix:'bulk-retry:',limit:26})).size});
      if(action==='brokerLink'){
        const input=data.input;if(typeof input?.user!=='string'||input.user.length>200)return json({error:'Verified profile required'},400);
        const ownerHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.user)))].map(n=>n.toString(16).padStart(2,'0')).join('');
        const cacheKey=`broker-status:${ownerHash}`,now=Date.now();
        if(input.operation==='status'){const cache=await this.state.storage.get(cacheKey);if(cache&&now-cache.at<15000)return json(cache.result);}
        else{
          const rateKey=`rate:${ownerHash}`,previous=await this.state.storage.get(rateKey),rate=!previous||previous.resetAt<=now?{count:0,resetAt:now+900000}:previous;
          if(rate.count>=5)return json({error:'Connection attempt limit reached; wait 15 minutes'},429);
          rate.count++;await this.state.storage.put(rateKey,rate);if(this.state.storage.setAlarm)await this.state.storage.setAlarm(now+900000);
        }
        try{const result=await brokerLink(this.env,input,artifactPut);await this.state.storage.put(cacheKey,{at:now,result});return json(result);}catch(e){return json({error:e instanceof Error?e.message:'Broker connection failed'},400);}
      }
      config.bees=bees().map(b=>({...b,enabled:config.bees?.find(old=>old.id===b.id)?.enabled??false}));
      if(action==='cycleEvidence'){await this.state.storage.put('lastCycle',data.result);return json({ok:true});}
      if(action==='providerBackoff'){await this.state.storage.put(`backoff:${data.provider}`,Date.now()+(data.status===429?900000:60000));return json({ok:true});}
      if(action==='providerPolicy')return json(config.providers[data.provider]||{enabled:false,retentionAllowed:false});
      if(action==='storageStatus')return json({usedBytes:(await this.state.storage.get('artifactBudget'))?.bytes||0,capBytes:8000000000,maxObjects:10000,scope:'Dedicated runtime bucket only; excludes other account services'});
      if(action==='storageReserve'){
        if(typeof data.key!=='string'||data.key.length>200||!Number.isInteger(data.bytes)||data.bytes<0||data.bytes>1024*1024)return json({error:'Invalid artifact size'},400);
        const budget=await this.state.storage.get('artifactBudget')||{bytes:0,objects:0};
        const key=`artifact:${data.key}`,previous=await this.state.storage.get(key)||0;
        const next=budget.bytes-previous+data.bytes;
        if(next>8000000000||(!previous&&budget.objects>=10000))return json({error:'Retained data storage budget exhausted'},429);
        budget.bytes=next;if(!previous)budget.objects++;await this.state.storage.put({artifactBudget:budget,[key]:data.bytes});
        return json({ok:true,bytes:next,cap:8000000000});
      }
      if(action==='train'){
        if(!bees().some(b=>b.id===data.bee&&b.executable))return json({error:'Unknown executable bee'},400);
        const namespace=data.workspace===PAPER_ID?`${PAPER_ID}/`:'';
        const dataset=await this.env.ARTIFACTS.get(namespace?DATA_KEY:`datasets/${data.bee}.json`);if(!dataset){const report={status:'awaiting-data',at:new Date().toISOString(),reason:'No retained dataset; no provider requests made'};await artifactPut(this.env,`training/${namespace}${data.bee}/latest.json`,JSON.stringify(report));return json(report);}
        const raw=await dataset.json();
        if(!Array.isArray(raw)||raw.some(b=>!Number.isFinite(b.time)||b.time>Date.now()-300000))return json({status:'skipped',reason:'Unclosed or invalid data'},400);
        const priorReport=await this.env.ARTIFACTS.get(`training/${namespace}${data.bee}/latest.json`);
          const currentHash=await hash(JSON.stringify(raw.slice(-2000)));
          if(priorReport){const prior=await priorReport.json();if(prior.datasetSha256===currentHash)return json({status:prior.status,unchanged:true,r2Replacements:0});}
          const bars=raw.slice(-2000),previous=await this.env.ARTIFACTS.get(`models/${data.bee}/challenger.json`);
        const result=trainCandidate(bars,previous?await previous.json():null);
        const at=new Date().toISOString();
        const datasetSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(bars))))].map(n=>n.toString(16).padStart(2,'0')).join('');
        const report={...result,at,compute:'isolated-durable-object',maxSamples:2000,epochs:10,workspace:namespace?PAPER_ID:'legacy-okx',samples:bars.length,firstBar:bars[0]?.time,lastBar:bars.at(-1)?.time,datasetSha256,executionApproved:false};
        await artifactPut(this.env,`training/${namespace}${data.bee}/${at.replaceAll(':','-')}.json`,JSON.stringify(report));
        await artifactPut(this.env,`training/${namespace}${data.bee}/latest.json`,JSON.stringify(report));
        if(result.status==='shadow-ready'&&!namespace)await artifactPut(this.env,`models/${data.bee}/challenger.json`,JSON.stringify(result.candidate));
        return json({status:result.status});
      }
      if(action==='rate'){
        if(!/^[a-f0-9]{64}$/.test(data.key||''))return json({error:'Hashed rate key required'},400);
        const now=Date.now(),key=`rate:${data.key}`,limit=5,windowMs=900000;
        let entry=await this.state.storage.get(key);if(!entry||entry.resetAt<=now)entry={count:0,resetAt:now+windowMs};
        if(entry.count>=limit)return json({allowed:false,retryAfter:Math.ceil((entry.resetAt-now)/1000)},429);
        entry.count++;await this.state.storage.put(key,entry);
        if(this.state.storage.setAlarm){
          const existing=this.state.storage.getAlarm?await this.state.storage.getAlarm():null;
          if(existing===null)await this.state.storage.setAlarm(now+86400000);
        }
        return json({allowed:true,remaining:limit-entry.count});
      }
      if(action==='status')return json({config,usage:await this.state.storage.get('usage')||{},paper:await this.state.storage.get('paper')||{},lastCycle:await this.state.storage.get('lastCycle')||null,liveReady:false,providers:Object.entries(PROVIDERS).map(([id,p])=>({id,configured:!p.key||!!this.env[p.key],enabled:!!config.providers[id]?.enabled,limits:{minute:p.minute,day:p.day,month:p.month,bytes30d:p.bytes30d},endpoints:p.endpoints})),training:{schedule:'0 3 * * *',localTime:'04:00 Africa/Lagos',activation:'shadow-only-until-forward-validation'}});
      if(action==='configure'){
        if(data.mode && data.mode!=='paper')return json({error:'Live execution locked: separate live credentials and owner/account permission verification required'},409);
        if(data.feeds && (!Array.isArray(data.feeds)||data.feeds.length>3||data.feeds.some(f=>!validateMarket(f.provider,f.endpoint,f.symbol)||!['crypto','forex'].includes(f.assetClass))))return json({error:'Invalid feeds; maximum three'},400);
        if(data.feeds?.length&&config.trainingInstrument&&`${data.feeds[0].provider}:${data.feeds[0].symbol}`!==config.trainingInstrument)return json({error:'Primary training instrument is frozen to prevent mixed datasets; deploy a separate hive for another primary instrument'},409);
        if(data.providers){for(const [id,p]of Object.entries(data.providers)){
          if(!PROVIDERS[id]||Object.keys(p).some(k=>!['enabled','retentionAllowed','redistributionAllowed'].includes(k))||Object.values(p).some(v=>typeof v!=='boolean'))return json({error:'Invalid provider permissions'},400);
        }}
        if(data.maxOrderUsd!==undefined&&(!Number.isFinite(data.maxOrderUsd)||data.maxOrderUsd<=0||data.maxOrderUsd>100))return json({error:'Order cap must be 0â€“100 USD'},400);
        if(data.bees!==undefined){
          if(!Array.isArray(data.bees)||data.bees.some(b=>!config.bees.some(existing=>existing.id===b.id&&existing.executable)||typeof b.enabled!=='boolean'))return json({error:'Only executable baseline bees can be activated'},400);
          config.bees=config.bees.map(b=>({...b,enabled:data.bees.find(c=>c.id===b.id)?.enabled??b.enabled}));
        }
        if(data.paused!==undefined&&typeof data.paused!=='boolean')return json({error:'paused must be boolean'},400);
        for(const key of ['feeds','providers','maxOrderUsd','paused'])if(data[key]!==undefined)config[key]=data[key];
        if(config.feeds.length&&!config.trainingInstrument)config.trainingInstrument=`${config.feeds[0].provider}:${config.feeds[0].symbol}`;
        await this.state.storage.put('config',config);return json({config});
      }
      if(action==='tick'){
        if(config.paused)return json({events:[]});
        const bars=data.bars,now=Date.now();
        if(!Array.isArray(bars)||bars.length<25||bars.some((b,i)=>!Number.isFinite(b.close)||b.close<=0||!Number.isFinite(b.time)||(i>0&&b.time-bars[i-1].time!==300000))||now-bars.at(-1).time>900000||bars.at(-1).time>now-300000)return json({error:'Stale, unclosed, gapped or insufficient data; abstain'},409);
        const paper=await this.state.storage.get('paper')||{},events=[];
        for(const bee of config.bees.filter(b=>b.executable&&b.enabled)){
          const index=bees().findIndex(b=>b.id===bee.id);
          const current=bars.at(-1),key=`${bee.id}:${data.symbol}`,account=paper[key]||{cash:10000,initialCash:10000,quantity:0,entry:0,lastBar:0,trades:0};
          if(account.lastBar>=current.time)continue;
          const lookback=[5,12,20][index],change=current.close/bars.at(-1-lookback).close-1;
          const threshold=[.003,.005,.008][index];let side=null;
          const model=data.models?.[bee.id];let probability=null;
          if(model?.weights?.length===4&&model.mean?.length===3&&model.sd?.length===3&&model.weights.every(Number.isFinite)&&model.mean.every(Number.isFinite)&&model.sd.every(v=>Number.isFinite(v)&&v>0)){
            const returns=[1,5,20].map(n=>current.close/bars.at(-1-n).close-1);
            const linear=model.weights[0]+returns.reduce((s,v,j)=>s+model.weights[j+1]*(v-model.mean[j])/model.sd[j],0);
            probability=1/(1+Math.exp(-Math.max(-30,Math.min(30,linear))));
          }
          // Score only a prior, already-recorded forecast against the next observed closed bar.
          const forecast=account.shadowForecast;
          if(forecast&&forecast.time+300000===current.time&&Number.isFinite(forecast.probability)){
            const forward=account.forwardShadow||{samples:0,brierSum:0,longEntries:0,netReturnProxy:0};
            const outcome=Number(current.close>forecast.close);forward.samples++;forward.brierSum+=(forecast.probability-outcome)**2;
            if(forecast.probability>.6){forward.longEntries++;forward.netReturnProxy+=current.close/forecast.close-1-.004;}
            forward.lastAt=now;forward.scope='one-bar close-to-close shadow proxy; models may be updated; no promotion';account.forwardShadow=forward;
          }
          account.shadowForecast=probability===null?null:{time:current.time,close:current.close,probability,version:model?.version??'unknown'};
          const recent=bars.slice(-21,-1).map(b=>b.close),mean=recent.reduce((a,b)=>a+b,0)/recent.length;
          const volatility=Math.sqrt(recent.reduce((s,v)=>s+(v-mean)**2,0)/recent.length)||1;
          const z=(current.close-mean)/volatility;
          // Learned models remain shadows until independently validated on forward paper data.
          const enter=index===0?change>threshold:index===1?z<-2:current.close>Math.max(...recent)*1.001;
          const exit=index===0?change<-threshold:index===1?current.close>=mean:current.close<mean;
          if(account.quantity>0&&(current.close/account.entry<.98||current.close/account.entry>1.04||exit))side='sell';
          else if(account.quantity===0&&enter&&account.cash>25)side='buy';
          const day=buckets(now).day;if(account.day!==day){account.day=day;account.dayTrades=0;}
          // Entry caps never prevent a protective exit on an existing position.
          if(account.dayTrades>=4&&side==='buy')side=null;
          account.lastBar=current.time;account.lastDecision={at:now,barTime:current.time,action:side||'hold',reason:side?'Closed-bar signal, fixed risk and fees':'No qualified entry/exit',model:['trend-baseline','mean-reversion-baseline','breakout-baseline'][index],shadowProbability:probability,source:data.provider};
          if(side){
            const feeRate=.001,slippage=.001,price=current.close*(side==='buy'?1+slippage:1-slippage);
            const notional=side==='buy'?Math.min(25,account.cash/(1+feeRate)):account.quantity*price,fee=notional*feeRate;
            if(side==='buy'){account.quantity=notional/price;account.entry=price;account.cash-=notional+fee;}
            else{account.cash+=notional-fee;account.quantity=0;account.entry=0;}
            account.trades++;account.dayTrades++;account.fees=(account.fees||0)+fee;
            events.push({id:`${bee.id}-${current.time}`,bee:bee.id,symbol:data.symbol,side,price,notional,fee,at:now,mode:'simulation',source:data.provider});
          }
          account.mark=current.close;account.equity=account.cash+account.quantity*current.close;account.pnl=account.equity-account.initialCash;account.history=[...(account.history||[]),{at:current.time,equity:account.equity}].slice(-288);account.decisions=[...(account.decisions||[]),account.lastDecision].slice(-24);account.fills=[...(account.fills||[]),...events.filter(e=>e.bee===bee.id)].slice(-24);paper[key]=account;
        }
        await this.state.storage.put('paper',paper);return json({events,paper});
      }
      if(action==='reserve'){
        const policy=PROVIDERS[data.provider];
        if(!policy||!config.providers[data.provider]?.enabled)return json({error:'Provider disabled pending entitlement confirmation'},403);
        const usage=await this.state.storage.get('usage')||{}, now=Date.now(), windows=buckets(now);const until=await this.state.storage.get(`backoff:${data.provider}`)||0;if(until>now)return json({error:'Provider cooldown after upstream throttling; abstain',retryAt:until},429);
        const entry=usage[data.provider]||{bytes:[]};
        for(const period of ['minute','day','month']){
          if(entry[period]?.window!==windows[period])entry[period]={window:windows[period],count:0};
          const limit=policy[period];
          if(limit!==undefined&&entry[period].count>=(limit===0?0:Math.max(1,Math.floor(limit*.9))))return json({error:`${period} budget reserved / exhausted`},429);
        }
        entry.bytes=(entry.bytes||[]).filter(b=>b.at>now-30*86400000);
        const reserveBytes=1024*1024;
        if(policy.bytes30d&&entry.bytes.reduce((s,b)=>s+b.bytes,0)+reserveBytes>policy.bytes30d*.9)return json({error:'Bandwidth budget exhausted'},429);
        for(const period of ['minute','day','month'])entry[period].count++;
        if(data.endpoint&&policy.endpoints.includes(data.endpoint)){
          entry.endpoints=entry.endpoints||{};const endpoint=entry.endpoints[data.endpoint]||{};
          for(const period of ['minute','day','month']){
            if(endpoint[period]?.window!==windows[period])endpoint[period]={window:windows[period],count:0};
            endpoint[period].count++;
          }
          entry.endpoints[data.endpoint]=endpoint;
        }
        if(policy.bytes30d)entry.bytes.push({at:now,bytes:reserveBytes});usage[data.provider]=entry;
        await this.state.storage.put('usage',usage);return json({ok:true});
      }
      if(action==='reconcile'){
        if(!/^[a-zA-Z0-9_-]{8,48}$/.test(data.id||''))return json({error:'Invalid id'},400);
        const existing=await this.state.storage.get(`order:${data.id}`);if(!existing)return json({error:'Unknown order'},404);
        try{
          const response=await fetch(`https://paper-api.alpaca.markets/v2/orders:by_client_order_id?client_order_id=${encodeURIComponent(data.id)}`,{headers:{'APCA-API-KEY-ID':this.env.ALPACA_API_KEY,'APCA-API-SECRET-KEY':this.env.ALPACA_SECRET_KEY}});
          if(!response.ok)return json(existing,202);
          const o=await response.json();const result={id:data.id,brokerId:o.id,status:o.status,symbol:o.symbol};
          await this.state.storage.put(`order:${data.id}`,result);return json(result);
        }catch{return json(existing,202);}
      }
      if(action==='order'){
        if(config.paused)return json({error:'Hive paused'},409);
        if(!/^[a-zA-Z0-9_-]{8,48}$/.test(data.id||'')||!/^([A-Z]{1,8}|[A-Z]{2,8}\/[A-Z]{2,8})$/.test(data.symbol||'')||!['buy','sell'].includes(data.side)||!Number.isFinite(data.notional)||data.notional<=0||data.notional>config.maxOrderUsd)return json({error:'Invalid order or risk cap'},400);
        const existing=await this.state.storage.get(`order:${data.id}`);if(existing)return json(existing);
        if((this.env.ALPACA_ENDPOINT||'https://paper-api.alpaca.markets/v2')!=='https://paper-api.alpaca.markets/v2')return json({error:'Only paper endpoint supported'},409);
        const count=await this.state.storage.get('orderDay')||{day:'',count:0};const day=buckets().day;
        if(count.day!==day){count.day=day;count.count=0;}if(count.count>=10)return json({error:'Daily order cap reached'},429);
        const pending={id:data.id,status:'pending-reconciliation',symbol:data.symbol};
        count.count++;await this.state.storage.put({'orderDay':count,[`order:${data.id}`]:pending});
        const headers={'APCA-API-KEY-ID':this.env.ALPACA_API_KEY,'APCA-API-SECRET-KEY':this.env.ALPACA_SECRET_KEY,'Content-Type':'application/json'};
        try{
          const account=await fetch('https://paper-api.alpaca.markets/v2/account',{headers,signal:AbortSignal.timeout(10000)});const a=await account.json();
          const crypto=data.symbol.includes('/');
          if(!account.ok||a.trading_blocked||a.status!=='ACTIVE'||(crypto&&a.crypto_status!=='ACTIVE')||(data.side==='buy'&&(!Number.isFinite(Number(a.cash))||Number(a.cash)<data.notional)))throw new Error('Account unavailable or risk check failed');
          if(data.side==='sell'){
            const position=await fetch(`https://paper-api.alpaca.markets/v2/positions/${encodeURIComponent(data.symbol)}`,{headers,signal:AbortSignal.timeout(10000)});
            const owned=await position.json();if(!position.ok||!Number.isFinite(Number(owned.qty))||!Number.isFinite(Number(owned.market_value))||Number(owned.qty)<=0||Number(owned.market_value)<data.notional)throw new Error('Owned long position required');
          }
          const response=await fetch('https://paper-api.alpaca.markets/v2/orders',{method:'POST',headers,signal:AbortSignal.timeout(10000),body:JSON.stringify({symbol:data.symbol,notional:String(data.notional),side:data.side,type:'market',time_in_force:crypto?'gtc':'day',client_order_id:data.id})});
          if(!response.ok)throw new Error('Broker rejected or uncertain order');
          const o=await response.json();const result={id:data.id,brokerId:o.id,status:o.status,symbol:data.symbol};
          await this.state.storage.put(`order:${data.id}`,result);return json(result);
        }catch{return json(pending,202);}
      }
      return json({error:'Unsupported action'},400);
    });
  }
  async alarm(){return this.state.blockConcurrencyWhile(async()=>{
    const publicationRetries=await retryPublications(this.state,this.env,artifactPut);
    const cursor=await this.state.storage.get('rateCleanupCursor');
    const entries=await this.state.storage.list({prefix:'rate:',limit:1000,...(cursor?{startAfter:cursor}:{})});
    const expired=[...entries].filter(([,v])=>v.resetAt<=Date.now()).map(([k])=>k);
    if(expired.length)await this.state.storage.delete(expired);
    if(entries.size===1000){await this.state.storage.put('rateCleanupCursor',[...entries.keys()].at(-1));await this.state.storage.setAlarm(Date.now()+1000);}
    else{await this.state.storage.delete('rateCleanupCursor');await this.state.storage.setAlarm(Date.now()+86400000);}
    if(publicationRetries.remaining)await this.state.storage.setAlarm(Date.now()+300000);
  });}
}
async function control(env,body,name='hive'){return env.CONTROL.get(env.CONTROL.idFromName(name)).fetch('https://control/',{method:'POST',body:JSON.stringify(body)});}
async function artifactPut(env,key,value){
  const digest=await hash(value),existing=await env.ARTIFACTS.get(key);
  if(existing&&(existing.customMetadata?.sha256===digest||await existing.text()===value))return {changed:false};
  const reservation=await control(env,{action:'storageReserve',key,bytes:new TextEncoder().encode(value).length},'storage-budget');
  if(!reservation.ok)throw new Error('Retained artifact budget exhausted');
  await env.ARTIFACTS.put(key,value,{customMetadata:{sha256:digest}});return {changed:true};
}
async function brokerControl(env,body){
  const status=await(await control(env,{action:'status'})).json();
  await control(env,{action:'configure',paused:status.config.paused,maxOrderUsd:status.config.maxOrderUsd},'broker');
  return control(env,body,'broker');
}
async function market(env,p,e,s,bar='5m'){
  if(!validateMarket(p,e,s))return json({error:'Endpoint not allowed'},400);
  if(!['1m','5m','15m','1H','4H','1D'].includes(bar))return json({error:'Invalid candle interval'},400);
  const policy=PROVIDERS[p];if(policy.key&&!env[policy.key])return json({error:'Provider not configured'},503);
  const permission=await(await control(env,{action:'providerPolicy',provider:p})).json();
  if(!permission.enabled)return json({error:'Provider disabled'},403);
  const key=`cache/${p}/${e.replaceAll('/','_')}/${encodeURIComponent(s)}/${bar}.json`;
  const cached=await env.ARTIFACTS.get(key);
  const ttl=p==='okx'?(e==='ticker'?10000:e==='tickers'?60000:300000):300000;
  if(cached){const v=await cached.json();if(Date.now()-v.fetchedAt<ttl)return json(v);}
  const reservation=await control(env,{action:'reserve',provider:p,endpoint:e});if(!reservation.ok)return reservation;
  let url=new URL(e,policy.base);
  if(p==='alphavantage'){url=new URL(policy.base);url.searchParams.set('function',e);}
  if(p==='massive')return json({error:'Entitlement not configured'},403);
  if(p==='okx'&&e==='tickers'){
    if(!['SPOT','SWAP'].includes(s))return json({error:'Invalid instrument type'},400);
    url.searchParams.set('instType',s);
  }else url.searchParams.set(p==='okx'?'instId':p==='marketstack'?'symbols':'symbol',s);
  if(policy.key)url.searchParams.set(p==='finnhub'?'token':p==='marketstack'?'access_key':'apikey',env[policy.key]);
  if(p==='okx'&&e==='candles'){url.searchParams.set('bar',bar);url.searchParams.set('limit','100');}
  if(p==='twelvedata'&&e==='time_series'){url.searchParams.set('interval','5min');url.searchParams.set('outputsize','100');}
  try{
    const r=await fetch(url,{signal:AbortSignal.timeout(10000)});
    if(!r.ok){await control(env,{action:'providerBackoff',provider:p,status:r.status});return json({error:'Provider unavailable; abstain',status:r.status},503);}
    const text=await r.text();if(new TextEncoder().encode(text).length>1024*1024)return json({error:'Response exceeds reserved byte budget'},503);
    const data=JSON.parse(text);if(data.error||data.status==='error'||data.Note||data.Information||(p==='okx'&&data.code!=='0'))return json({error:'Provider rejected query; abstain'},503);
    const value={provider:p,symbol:s,endpoint:e,fetchedAt:Date.now(),data};
    if(permission.retentionAllowed)await artifactPut(env,key,JSON.stringify(value));
    return json(value);
  }catch{return json({error:'Feed unavailable; abstain'},503);}
}
export async function runPaperCycle(env){const state=await(await control(env,{action:'status'})).json();if(state.config.paused)return {status:'paused'};const outcomes=[];
      for(const feed of state.config.feeds)if(marketOpen(feed.assetClass)){
        const response=await market(env,feed.provider,feed.endpoint,feed.symbol);if(!response.ok){outcomes.push({symbol:feed.symbol,status:response.status,reason:(await response.json()).error});continue;}
        const value=await response.json();let bars=[];
        if(feed.provider==='okx'&&feed.endpoint==='candles')bars=(value.data.data||[]).filter(b=>b[8]==='1').map(b=>({time:Number(b[0]),close:Number(b[4])})).sort((a,b)=>a.time-b.time);
        // Only OKX has closed-bar confirmation and event timestamps verified in this version.
        if(bars.length){
          if(feed===state.config.feeds[0]&&state.config.providers[feed.provider]?.retentionAllowed){
            for(const bee of state.config.bees.filter(b=>b.executable&&b.enabled)){
              const existing=await env.ARTIFACTS.get(`datasets/${bee.id}.json`);
              const previous=existing?await existing.json():[];
              const combined=[...new Map([...previous,...bars].map(b=>[b.time,b])).values()].sort((a,b)=>a.time-b.time).slice(-5000);
              await artifactPut(env,`datasets/${bee.id}.json`,JSON.stringify(combined));
            }
          }
          const models={};
          // Promoted challengers are bound to the primary configured instrument only.
          if(feed===state.config.feeds[0])for(const bee of state.config.bees.filter(b=>b.executable&&b.enabled)){
            const artifact=await env.ARTIFACTS.get(`models/${bee.id}/challenger.json`);if(artifact)models[bee.id]=await artifact.json();
          }
          const tick=await control(env,{action:'tick',bars,models,symbol:feed.symbol,provider:feed.provider});
          const result=await tick.json();outcomes.push({symbol:feed.symbol,status:tick.status,closedBars:bars.length,events:result.events?.length??0,error:result.error});if(tick.ok){
            if(result.events.length)await artifactPut(env,`paper/${new Date().toISOString().slice(0,10)}/${Date.now()}-${feed.symbol}.json`,JSON.stringify(result.events));
          }
        }
      }
 const result={at:new Date().toISOString(),outcomes};await control(env,{action:'cycleEvidence',result});return result;
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);if(url.pathname==='/health')return json({service:'OmieBot runtime',mode:'paper',liveReady:false});
    if(url.pathname==='/public/paper'&&request.method==='GET')return publicPaper(env,request);
    if(!env.EDGE_SERVICE_SECRET||request.headers.get('Authorization')!==`Bearer ${env.EDGE_SERVICE_SECRET}`)return json({error:'Unauthorized'},401);
    if(url.pathname==='/control/cache'&&request.method==='POST'){
      const text=await request.text();if(text.length>600000)return json({error:'Snapshot too large'},413);
      let input;try{input=JSON.parse(text);}catch{return json({error:'Invalid JSON'},400);}
      return control(env,{action:'dataPlane',input},'bulk-data-plane');
    }
    if(url.pathname==='/control/retry'&&request.method==='POST')return control(env,{action:'retryPublications'},'bulk-data-plane');
    if(url.pathname==='/control/publish-paper'&&request.method==='POST')return publishPaper(env);
    if(url.pathname==='/control/status')return control(env,{action:'publicationStatus'},'bulk-data-plane');
    if(url.pathname==='/workspaces/live')return json(await okxLiveAccount(env));
    if(url.pathname==='/workspaces/okx'&&request.method==='POST'){
      const text=await request.text();if(text.length>4000)return json({error:'Connection request too large'},413);
      let input;try{input=JSON.parse(text);}catch{return json({error:'Invalid connection request'},400);}
      return control(env,{input,action:'brokerLink'},'okx-owner-registry');
    }
    if(url.pathname==='/workspaces/markets'){try{return json(await marketSnapshot(env,control,artifactPut));}catch(e){return json({error:e instanceof Error?e.message:'Markets unavailable',at:Date.now()},503);}}
    if(url.pathname==='/workspaces/paper'){
      const status=await(await control(env,{action:'status'},PAPER_ID)).json();
      const manifest=await env.ARTIFACTS.get(`datasets/${PAPER_ID}/manifest.json`);
      return json({...status,workspace:PAPER_ID,symbol:SYMBOL,dataset:manifest?await manifest.json():null,training:await workspaceTraining(env),capitalKind:'simulated',mode:'paper'});
    }
    if(url.pathname==='/admin/paper/start'&&request.method==='POST'){
      await control(env,{action:'configure',paused:false,maxOrderUsd:25,providers:{alpaca:{enabled:true,retentionAllowed:true,redistributionAllowed:false}},bees:bees().filter(b=>b.executable).map(b=>({id:b.id,enabled:true}))},PAPER_ID);
      const result=await paperCycle(env,control,artifactPut,{bootstrap:true});await publishPaper(env);return json(result);
    }
    if(url.pathname==='/admin/paper/pause'&&request.method==='POST')return control(env,{action:'configure',paused:true},PAPER_ID);
    if(url.pathname==='/admin/paper/cycle'&&request.method==='POST'){const result=await paperCycle(env,control,artifactPut);await publishPaper(env);return json(result);}
    if(url.pathname==='/admin/paper/train'&&request.method==='POST'){
      const results=[];for(const bee of bees().filter(b=>b.executable)){const r=await control(env,{action:'train',bee:bee.id,workspace:PAPER_ID},`training:${PAPER_ID}:${bee.id}`);results.push({bee:bee.id,status:r.status,result:await r.json()});}return json({results});
    }
    if(url.pathname==='/admin/cycle'&&request.method==='POST')return json(await runPaperCycle(env));
    if(url.pathname==='/admin/status'){
      const status=await(await control(env,{action:'status'})).json();
      const storage=await(await control(env,{action:'storageStatus'},'storage-budget')).json();
      return json({...status,storage});
    }
    if(['/admin/dataset','/admin/datasets'].includes(url.pathname)&&request.method==='PUT'){
      if(Number(request.headers.get('content-length')||0)>1024*1024)return json({error:'Dataset maximum1MB'},413);
      const body=await request.text();if(body.length>1024*1024)return json({error:'Dataset maximum1MB'},413);
      let input;try{input=JSON.parse(body);}catch{return json({error:'Invalid JSON'},400);}
      const allowed=bees().filter(b=>b.executable).map(b=>b.id);
      if(!allowed.includes(input.bee)||input.retentionRightsConfirmed!==true||!Array.isArray(input.bars)||input.bars.length<1||input.bars.length>5000||input.bars.some(b=>!Number.isFinite(b.time)||b.time<=0||b.time>Date.now()-300000||!Number.isFinite(b.close)||b.close<=0))return json({error:'Expected licensed closed bars, eligible bee and maximum5000 samples'},400);
      const bars=input.bars.map(({time,close})=>({time,close})).sort((a,b)=>a.time-b.time);
      if(bars.some((b,i)=>i>0&&bars[i-1].time===b.time))return json({error:'Duplicate timestamps'},400);
      await artifactPut(env,`datasets/${input.bee}.json`,JSON.stringify(bars));
      return json({bee:input.bee,samples:bars.length,trainingAt:'04:00 Africa/Lagos',status:bars.length>=1200?'eligible':'insufficient-data'});
    }
    if(url.pathname==='/admin/training'){
      const current=await workspaceTraining(env);if(current.results.some(r=>r.result.status!=='awaiting-data'))return json(current);
      const results=[];
      for(const bee of bees().filter(b=>b.executable)){
        const artifact=await env.ARTIFACTS.get(`training/${bee.id}/latest.json`);
        results.push({bee:bee.id,result:artifact?await artifact.json():{status:'awaiting-data'}});
      }
      return json({results,cron:'0 3 * * *',timezone:'Africa/Lagos',mode:'paper-challengers'});
    }
    if(url.pathname==='/auth/rate'&&request.method==='POST')return control(env,{...await request.json(),action:'rate'});
    if(url.pathname==='/admin/config'&&request.method==='PUT')return control(env,{...await request.json(),action:'configure'});
    if(url.pathname==='/execution/mode'&&request.method==='POST')return control(env,{...await request.json(),action:'configure'});
    if(url.pathname==='/execution/order'&&request.method==='POST')return brokerControl(env,{...await request.json(),action:'order'});
    if(url.pathname==='/execution/reconcile'&&request.method==='POST')return brokerControl(env,{...await request.json(),action:'reconcile'});
    if(url.pathname==='/market')return market(env,url.searchParams.get('provider'),url.searchParams.get('endpoint'),url.searchParams.get('symbol'),url.searchParams.get('bar')||'5m');
    return json({error:'Not found'},404);
  },
  async scheduled(event,env,ctx){
    if(event.cron==='0 3 * * *'){
      ctx.waitUntil((async()=>{
        // Only owner-imported closed bars. This path never calls market/LLM providers.
        for(const bee of bees().filter(b=>b.executable)){
          await control(env,{action:'train',bee:bee.id},`training:${bee.id}`);
          await control(env,{action:'train',bee:bee.id,workspace:PAPER_ID},`training:${PAPER_ID}:${bee.id}`);
        }
      })());return;
    }
    ctx.waitUntil(Promise.all([runPaperCycle(env),(async()=>{await paperCycle(env,control,artifactPut);await publishPaper(env);})()]));
  }
};
async function publishPaper(env){
  const d=await(await control(env,{action:'status'},PAPER_ID)).json();
  const dataset=await env.ARTIFACTS.get(`datasets/${PAPER_ID}/manifest.json`),manifest=dataset?await dataset.json():null;
  const lastDecisionAt=Math.max(0,...Object.values(d.paper||{}).map(a=>a.lastDecision?.at||0));
  const lastCycle=d.lastCycle?{...d.lastCycle,at:lastDecisionAt?new Date(lastDecisionAt).toISOString():null}:null;
  const value={workspace:PAPER_ID,symbol:SYMBOL,mode:'paper',config:{paused:d.config.paused,bees:d.config.bees},paper:d.paper,lastCycle,dataset:manifest?{provider:manifest.provider,symbol:manifest.symbol,bars:manifest.bars,firstBar:manifest.firstBar,lastBar:manifest.lastBar,sha256:manifest.sha256,sourceCoverage:manifest.sourceCoverage}:null,training:await workspaceTraining(env),liveReady:false};
  return control(env,{action:'dataPlane',input:{operation:'publish',scope:'public-paper',owner:'public',key:'',value}},'bulk-data-plane');
}
async function workspaceTraining(env){
  const results=[];for(const bee of bees().filter(b=>b.executable)){const artifact=await env.ARTIFACTS.get(`training/${PAPER_ID}/${bee.id}/latest.json`);const value=artifact?await artifact.json():{status:'awaiting-data'};const {candidate,...result}=value;results.push({bee:bee.id,result});}
  return {results,cron:'0 3 * * *',timezone:'Africa/Lagos',mode:'paper-challengers',workspace:PAPER_ID};
}
