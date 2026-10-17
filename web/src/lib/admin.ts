import { ConvexClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
export const functionRef = (name:string) => makeFunctionReference<any>(name);
export async function sessionRequest(path:string, options:RequestInit={}) {
 const response=await fetch(path,{credentials:'same-origin',...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error??data.message??`Request failed (${response.status})`);
 return data;
}
export function authenticatedClient(url:string){
 const client=new ConvexClient(url);
 client.setAuth(async()=>{try{return (await sessionRequest('/api/auth/token')).token??null;}catch{return null;}});
 return client;
}

// On-demand HTTP snapshots. No WebSocket subscriptions or idle polling.
export async function controlQuery(view:string,args:Record<string,any>={}){
 const query=new URLSearchParams({view});
 for(const [k,v]of Object.entries(args))if(v!==null&&v!==undefined)query.set(k,String(v));
 return sessionRequest('/api/control?'+query);
}
export async function controlMutation(name:string,args:Record<string,unknown>={}){
 const value=await sessionRequest('/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args})});
 return value.result;
}
