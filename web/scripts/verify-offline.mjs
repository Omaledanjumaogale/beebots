import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const handlers={},cached=new Map(),installed=[];
const cache={addAll:async paths=>{installed.push(...paths);for(const path of paths)cached.set(path,new Response('cached '+path));},match:async path=>cached.get(path)?.clone(),put:async(path,response)=>cached.set(path,response)};
const location=new URL('https://omiebot.test/service-worker.js');
runInNewContext(await readFile(new URL('../.svelte-kit/cloudflare/service-worker.js',import.meta.url),'utf8'),{
 self:{location,clients:{claim:async()=>{}},addEventListener:(name,handler)=>handlers[name]=handler},location,URL,Response,Set,
 caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async()=>{throw Error('network unavailable');}
});
let task;handlers.install({waitUntil:p=>task=p});await task;
assert(installed.includes('/paper'));assert(!installed.some(path=>path.startsWith('/api/')||['/admin','/invest','/live','/login','/connect/okx'].includes(path)));
for(const [path,method,mode]of [['/api/control?view=hive','GET','cors'],['/api/auth/login','POST','cors'],['/admin','GET','navigate'],['/live','GET','navigate']]){
 let intercepted=false;handlers.fetch({request:{url:'https://omiebot.test'+path,method,mode},respondWith:()=>intercepted=true});assert.equal(intercepted,false,path);
}
let result;handlers.fetch({request:{url:'https://omiebot.test/paper?view=summary',method:'GET',mode:'navigate'},respondWith:p=>result=p});assert.equal(await(await result).text(),'cached /paper');
cached.delete('/paper');handlers.fetch({request:{url:'https://omiebot.test/paper',method:'GET',mode:'navigate'},respondWith:p=>result=p});assert.equal(await(await result).text(),'cached /offline.html');
console.log('Offline bundle contract passed: public shell/recovery fallback; private, API and mutation requests never intercepted. Browser acceptance remains separate.');
