import {ensureBundle,BUNDLE_FILES} from '@receptron/laya';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createReadStream}from'node:fs';import{createHash}from'node:crypto';import path from'node:path';
const spec=JSON.parse(await readFile(new URL('./model.json',import.meta.url),'utf8'));let last=0;
const dir=await ensureBundle({...spec,cacheDir:path.resolve('models'),onProgress:({file,received,total})=>{if(Date.now()-last>15000){last=Date.now();console.log(file+': '+Math.round(received/1e6)+' MB'+(total?' / '+Math.round(total/1e6)+' MB':''));}}});
const hashes={};for(const f of BUNDLE_FILES){const hash=createHash('sha256');for await(const chunk of createReadStream(path.join(dir,f)))hash.update(chunk);hashes[f]=hash.digest('hex');}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/installed-model.json',JSON.stringify({...spec,dir,hashes,installedAt:new Date().toISOString()},null,2));console.log('Model bundle installed and SHA256 manifest recorded.');
