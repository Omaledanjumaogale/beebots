// Read-only OKX live adapter. No order or withdrawal endpoint is exposed.
export async function okxHeaders(env,path,timestamp=new Date().toISOString()){
  if(!env.OKX_API_KEY||!env.OKX_SECRET_KEY||!env.OKX_PASSPHRASE)throw Error('OKX live credentials are not configured');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.OKX_SECRET_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'GET'+path)));
  return {'OK-ACCESS-KEY':env.OKX_API_KEY,'OK-ACCESS-SIGN':btoa(String.fromCharCode(...bytes)),'OK-ACCESS-TIMESTAMP':timestamp,'OK-ACCESS-PASSPHRASE':env.OKX_PASSPHRASE,'x-simulated-trading':'0'};
}
export async function okxLiveAccount(env){
  const base={mode:'live',provider:'OKX',executionEnabled:false,fundsSource:'verified-live-trading-account-only',at:new Date().toISOString(),balance:null,positions:[],orders:[]};
  if(!env.OKX_API_KEY||!env.OKX_SECRET_KEY||!env.OKX_PASSPHRASE)return {...base,status:'not-configured',reason:'OKX selected. Live API key, secret and passphrase are not configured. Verified account ownership, available USDT and explicit capital/order/daily-loss limits remain required.'};
  const host=env.OKX_API_ORIGIN||'https://www.okx.com';
  if(!['https://www.okx.com','https://openapi.okx.com','https://us.okx.com','https://eea.okx.com'].includes(host))return {...base,status:'invalid-config',reason:'Unrecognized OKX regional API origin; credentials were not transmitted.'};
  try{
    const read=async path=>{const r=await fetch(host+path,{headers:await okxHeaders(env,path),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(`OKX live account HTTP ${r.status}`);const value=await r.json();if(value.code!=='0'||!Array.isArray(value.data))throw Error('OKX rejected live account query');return value.data;};
    const accounts=await read('/api/v5/account/balance');const account=accounts[0];
    const config=(await read('/api/v5/account/config'))[0];
    if(!config?.uid)throw Error('OKX account identity is unavailable');
    const permissions=String(config.perm??'').split(',');
    if(permissions.some(p=>p.trim().toLowerCase()==='withdraw'))throw Error('Use an OKX API key without withdrawal permission');
    const fingerprint=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(config.uid))))].map(n=>n.toString(16).padStart(2,'0')).join('');
    if(!account||!Array.isArray(account.details)||!Number.isFinite(Number(account.totalEq)))throw Error('Invalid OKX balance response');
    const usdt=account.details.find(d=>d.ccy==='USDT'),cash=usdt?Number(usdt.availBal):0;
    if(!Number.isFinite(cash)||cash<0)throw Error('Invalid available USDT');
    const pending=await read('/api/v5/trade/orders-pending?instType=SPOT&limit=25');
    const history=await read('/api/v5/trade/orders-history?instType=SPOT&limit=25');
    const orders=[...new Map([...pending,...history].map(o=>[o.ordId,o])).values()].slice(0,50).map(o=>({id:o.ordId,symbol:o.instId,side:o.side,status:o.state,filledQty:o.accFillSz,filledPrice:o.avgPx||null,at:o.cTime}));
    return {...base,status:'verified-read-only',accountFingerprint:fingerprint,permissions:{read:true,trade:permissions.includes('trade'),withdraw:false},currency:'USDT',balance:{cash,equity:Number(account.totalEq),equityCurrency:'USD',buyingPower:null},positions:account.details.filter(d=>Number(d.cashBal)>0).map(d=>({symbol:d.ccy,qty:d.cashBal,available:d.availBal,equityUsd:d.disEq})),orders,reason:'Verified OKX live-account records only. Automated order submission is disabled pending approved limits, venue constraints, reconciliation and live acceptance. Trading-account equity is not a customer ownership allocation.'};
  }catch(e){return {...base,status:'unavailable',reason:e instanceof Error?e.message:'OKX live account unavailable'};}
}
