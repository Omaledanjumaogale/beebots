import {describe,it,expect,vi} from 'vitest';
import {parseSubscription,deliverPush} from '../src/lib/server/push';
const b64=(v:Uint8Array)=>Buffer.from(v).toString('base64url');
describe('Web Push privacy boundary',()=>{
 it('rejects private/arbitrary services and malformed key material',()=>{
  for(const endpoint of ['http://fcm.googleapis.com/a','https://127.0.0.1/a','https://evil.example/a','https://fcm.googleapis.com.evil.example/a','https://x@fcm.googleapis.com/a','https://fcm.googleapis.com:444/a'])expect(()=>parseSubscription({endpoint,keys:{p256dh:'a'.repeat(87),auth:'a'.repeat(22)}})).toThrow();
  expect(()=>parseSubscription({endpoint:'https://fcm.googleapis.com/test',keys:{p256dh:'bad',auth:'bad'}})).toThrow();
 });
 it('encrypts generic alerts, prevents redirects and distinguishes provider acceptance from receipt',async()=>{
  const vapid=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),key=await crypto.subtle.exportKey('jwk',vapid.privateKey);
  const publicKey=b64(new Uint8Array([4,...Buffer.from(key.x!,'base64url'),...Buffer.from(key.y!,'base64url')]));
  const recipient=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const subscription=parseSubscription({endpoint:'https://fcm.googleapis.com/test-only',keys:{p256dh:b64(new Uint8Array(await crypto.subtle.exportKey('raw',recipient.publicKey))),auth:b64(crypto.getRandomValues(new Uint8Array(16)))}});
  const fetcher=vi.fn(async(_url,options)=>{expect(options.redirect).toBe('error');expect(options.headers).toBeTruthy();expect(JSON.stringify(options.body)).not.toContain('workflow status');return new Response(null,{status:201});});
  const results=await deliverPush({VAPID_PUBLIC_KEY:publicKey,VAPID_PRIVATE_KEY:key.d},[subscription],fetcher as typeof fetch);
  expect(results).toMatchObject([{accepted:true,expired:false}]);expect(fetcher).toHaveBeenCalledTimes(1);
 });
});
