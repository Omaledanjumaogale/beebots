import {okxLiveAccount} from './okx.js';
const bytes=new TextEncoder();
async function sha(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const encode=data=>btoa(String.fromCharCode(...data));
const decode=data=>Uint8Array.from(atob(data),c=>c.charCodeAt(0));
async function key(env){if(!/^[a-f0-9]{64}$/i.test(env.BROKER_VAULT_KEY??''))throw Error('Encrypted broker vault is not configured');const raw=Uint8Array.from(env.BROKER_VAULT_KEY.match(/../g),v=>parseInt(v,16));return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);}
export function riskPolicy(allocation){
  if(!Number.isFinite(allocation)||allocation<100||allocation>100000000||Math.abs(Math.round(allocation*100)-allocation*100)>0.000001)throw Error('Allocation must be 100 USDT or more, in cents, within the supported accounting range');
  return {currency:'USDT',allocation,minAllocation:100,maxOrder:Math.min(25,allocation*.05),maxExposure:allocation*.2,maxDailyLoss:allocation*.02,maxDailyEntries:4,spotOnly:true,leverage:1,automaticExecution:false,version:'okx-spot-v1'};
}
export async function seal(env,user,value){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:bytes.encode(user)},await key(env),bytes.encode(JSON.stringify(value))));return {version:1,iv:encode(iv),ciphertext:encode(ciphertext)};}
export async function unseal(env,user,envelope){if(envelope.version!==1)throw Error('Unsupported credential envelope');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv),additionalData:bytes.encode(user)},await key(env),decode(envelope.ciphertext));return JSON.parse(new TextDecoder().decode(plain));}
export async function brokerLink(env,input,put){
  if(typeof input.user!=='string'||input.user.length<3||input.user.length>200)throw Error('Verified session identity required');
  const user=await sha(input.user),path=`broker-vault/okx/${user}.json`;
  if(input.operation==='status'){
    const object=await env.ARTIFACTS.get(path);
    if(!object)return {mode:'live',provider:'OKX',status:'account-link-required',balance:null,orders:[],positions:[],executionEnabled:false,reason:'Connect your own OKX account. No broker credentials or real funds are inferred from paper balances.'};
    const stored=await unseal(env,user,await object.json());
    const status=await okxLiveAccount({...env,...stored.credentials});
    return {...status,policy:stored.policy,linkedAt:stored.linkedAt,executionEnabled:false};
  }
  if(input.operation!=='link')throw Error('Unsupported connection action');
  // Verify encryption readiness before any API credentials are transmitted.
  await key(env);
  if(input.ownershipConfirmed!==true||input.riskAccepted!==true||input.adult!==true)throw Error('Account ownership, age and risk acknowledgements are required');
  const c=input.credentials;
  if(!c||['apiKey','secretKey','passphrase'].some(k=>typeof c[k]!=='string'||c[k].length<8||c[k].length>200))throw Error('Complete OKX API credentials are required');
  const credentials={OKX_API_KEY:c.apiKey,OKX_SECRET_KEY:c.secretKey,OKX_PASSPHRASE:c.passphrase,OKX_API_ORIGIN:c.origin||'https://www.okx.com'};
  const status=await okxLiveAccount({...env,...credentials});
  if(status.status!=='verified-read-only')throw Error(status.reason);
  const allocation=Number(input.allocation),policy=riskPolicy(allocation);
  if(allocation>status.balance.cash)throw Error('Allocation exceeds verified available USDT in the OKX trading account. Fund the account at OKX before allocating.');
  const binding=`broker-vault/okx-owners/${status.accountFingerprint}.json`,owner=await env.ARTIFACTS.get(binding);
  if(owner&&(await owner.json()).user!==user)throw Error('This OKX account is already linked to another OmieBot profile');
  const linkedAt=new Date().toISOString();
  const envelope=await seal(env,user,{credentials,policy,linkedAt,consentVersion:'okx-spot-v1',accountFingerprint:status.accountFingerprint});
  // All linking is serialized by a Durable Object; no duplicate owner race.
  await put(env,binding,JSON.stringify({user}));
  await put(env,path,JSON.stringify(envelope));
  return {...status,policy,linkedAt,executionEnabled:false,reason:'OKX connection verified and encrypted. No funds transferred. Automatic real-money execution remains disabled until execution acceptance is complete.'};
}
