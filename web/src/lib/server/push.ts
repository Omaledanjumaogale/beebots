import {buildPushPayload,type PushSubscription} from '@block65/webcrypto-web-push';
import type {AuthEnv} from './auth';
export function validSubscription(value:unknown):value is PushSubscription{
 if(!value||typeof value!=='object')return false;const v=value as PushSubscription;
 try{const u=new URL(v.endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.href.length<2000&&
 ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(host=>u.hostname===host)||false;}catch{return false;}
}
export function parseSubscription(value:unknown):PushSubscription{
 if(!validSubscription(value))throw Error('Unsupported push service endpoint');
 const v=value as PushSubscription;
 if(!v.keys||!/^[-_a-zA-Z0-9]{80,150}$/.test(v.keys.p256dh)||!/^[-_a-zA-Z0-9]{16,50}$/.test(v.keys.auth))throw Error('Invalid subscription keys');
 return {endpoint:v.endpoint,expirationTime:null,keys:{p256dh:v.keys.p256dh,auth:v.keys.auth}};
}
export async function deliverPush(env:AuthEnv,subscriptions:PushSubscription[],fetcher:typeof fetch=fetch){
 if(!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY)throw Error('Device delivery is not configured');
 const results=[];
 for(const subscription of subscriptions.slice(0,3)){
  parseSubscription(subscription);
  try{const payload=await buildPushPayload({data:JSON.stringify({title:'OmieBot workflow update',body:'Your workflow status was updated. Sign in to review its evidence.',url:'/admin'}),options:{ttl:300}},subscription,{subject:'https://omiebot.ewinproject.org',publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY});
   const r=await fetcher(subscription.endpoint,{...payload,redirect:'error',signal:AbortSignal.timeout(10000)});results.push({endpoint:subscription.endpoint,accepted:r.status===201||r.status===202,expired:r.status===404||r.status===410});
  }catch{results.push({endpoint:subscription.endpoint,accepted:false,expired:false});}
 }
 return results;
}
