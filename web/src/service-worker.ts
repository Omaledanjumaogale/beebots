/// <reference lib="webworker" />
import {build,version} from '$service-worker';
import {publicOfflineRoutes} from '../static-routes.mjs';
const worker=self as unknown as ServiceWorkerGlobalScope;
const name='omiebot-public-'+version,offline='/offline.html';
const publicPaths=new Set<string>(publicOfflineRoutes);
// Never cache API responses, credentials, account mutations or private page shells.
worker.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(name);
 await cache.addAll([...build,...publicOfflineRoutes,offline]);
})()));
worker.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('omiebot-public-')&&key!==name)await caches.delete(key);
 await worker.clients.claim();
})()));
worker.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==worker.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/.well-known/'))return;
 if(request.mode==='navigate'&&publicPaths.has(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(name);
   try{const response=await fetch(request);if(response.ok){await cache.put(url.pathname,response.clone());return response;}return await cache.match(url.pathname)??await cache.match(offline)??response;}
   catch{return await cache.match(url.pathname)??await cache.match(offline)??new Response('Offline',{status:503});}
  })());
 }else if(build.includes(url.pathname))event.respondWith((async()=>await(await caches.open(name)).match(url.pathname)??fetch(request))());
});

worker.addEventListener('push',event=>{
 let message:{title?:string;body?:string;url?:string}={};try{message=event.data?.json()??{};}catch{}
 event.waitUntil(worker.registration.showNotification(message.title??'OmieBot update',{body:message.body??'Sign in to review your workflow status.',icon:'/favicon.svg',tag:'omiebot-workflow',data:{url:'/admin'}}));
});
worker.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(worker.clients.openWindow('/admin'));});
