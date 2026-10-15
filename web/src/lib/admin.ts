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
