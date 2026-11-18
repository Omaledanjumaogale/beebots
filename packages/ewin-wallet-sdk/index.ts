/** Server-only bridge. Import the confirmation UI separately; never ship serviceKey to a browser. */
export type WalletOperation='heartbeat'|'balance'|'receipt'|'quote'|'hold'|'release'|'refund';
export function walletConfirmationUrl(quoteId: string, hubOrigin = 'https://ewinproject.org') {
  const url = new URL('/wallet/confirm', hubOrigin);
  if (url.protocol !== 'https:' || !/^[a-z0-9]{20,128}$/i.test(quoteId)) {
    throw new Error('A valid quote ID and HTTPS Hub URL are required.');
  }
  url.searchParams.set('quote', quoteId);
  return url.toString();
}

export class EwinWallet {
  constructor(private options:{baseUrl:string;platformId:string;serviceKey:string}){
    if(typeof window!=='undefined')throw new Error('The wallet service client is server-only.');
    const url=new URL(options.baseUrl);
    if(url.protocol!=='https:'||options.serviceKey.length<32)throw new Error('Use an HTTPS Hub URL and a private service key.');
  }
  async request(operation:WalletOperation,subject:string,key:string,input:{actionKey?:string;target?:string;quoteId?:string;resultId?:string}={}){
    const body=JSON.stringify({version:1,platformId:this.options.platformId,operation,subject,key,actionKey:input.actionKey,target:input.target,quoteId:input.quoteId,resultId:input.resultId});
    const timestamp=String(Date.now());
    const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(this.options.serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const bytes=await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(timestamp+'.'+body));
    const signature=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
    const response=await fetch(new URL('/wallet/v1',this.options.baseUrl),{method:'POST',headers:{'Content-Type':'application/json','X-Ewin-Timestamp':timestamp,'X-Ewin-Signature':signature},body,signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(`E-WIN wallet operation failed (${response.status}). Retry only with the same operation, body and idempotency key.`);
    return response.json();
  }
}
