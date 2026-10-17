const scopes=new Set(['hive','investments','admin-overview','admin-list','evaluation-report','public-paper']);
const encoder=new TextEncoder();
export function canonical(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const family=scope=>scope.startsWith('admin-')?'admin':scope;
export async function dataPlane(state,env,input,put){
  if(!scopes.has(input.scope)||typeof input.owner!=='string'||input.owner.length>400||typeof (input.key??'')!=='string'||(input.key??'').length>8000)throw Error('Invalid data-plane scope');
  const identity=await hash(input.owner),id=await hash(input.scope+'\n'+identity+'\n'+(input.key??''));
  const prefix=`bulk/${input.scope}/${identity}/${id}`,metaKey='bulk:'+id,genKey=`bulk-generation:${family(input.scope)}:${identity}`;
  const generation=await state.storage.get(genKey)||0;
  if(input.operation==='invalidate'){await state.storage.put(genKey,generation+1);return {invalidated:true};}
  const meta=await state.storage.get(metaKey);
  if(input.operation==='get'){
    if(!meta||meta.generation!==generation||Date.now()-meta.checkedAt>60000)return {miss:true,generation};
    const object=await env.ARTIFACTS.get(meta.objectKey);if(!object)throw Error('R2 snapshot missing; source fallback disabled');
    return {hit:true,hash:meta.hash,bytes:meta.bytes,value:await object.json()};
  }
  if(input.operation!=='publish')throw Error('Unsupported data-plane operation');
  if(input.expectedGeneration!==undefined&&input.expectedGeneration!==generation)return {conflict:true};
  const body=canonical(input.value),bytes=encoder.encode(body).length;if(bytes>512000)throw Error('Snapshot exceeds 512KB bound; paginate it');
  const digest=await hash(body);
  if(meta?.hash===digest){await state.storage.delete('bulk-retry:'+id);await state.storage.put(metaKey,{...meta,checkedAt:Date.now(),generation});return {changed:false,hash:digest,bytes,r2Replacements:0};}
  const job={metaKey,prefix,objectKey:prefix+'/'+digest+'.json',hash:digest,bytes,body,generation,genKey,createdAt:Date.now()};
  const queueKey='bulk-retry:'+id;
  try{await commit(state,env,job,put);await state.storage.delete(queueKey);return {changed:true,hash:digest,bytes,r2Replacements:2};}
  catch{
    const queued=await state.storage.list({prefix:'bulk-retry:',limit:26});if(!queued.has(queueKey)&&queued.size>=25)throw Error('Archive retry queue full; publication stopped');
    await state.storage.put(queueKey,job);await state.storage.setAlarm(Date.now()+60000);return {queued:true,hash:digest,bytes};
  }
}
async function commit(state,env,job,put){
  // Content-addressed objects are their own archives. Retries use the same keys.
  await put(env,job.objectKey,job.body);
  await put(env,job.prefix+'/latest.json',JSON.stringify({key:job.objectKey,hash:job.hash,bytes:job.bytes}));
  await state.storage.put(job.metaKey,{hash:job.hash,objectKey:job.objectKey,bytes:job.bytes,generation:job.generation,checkedAt:Date.now()});
}
export async function retryPublications(state,env,put){
  const entries=await state.storage.list({prefix:'bulk-retry:',limit:25});let completed=0;
  for(const [key,job]of entries){try{if(job.genKey&&(await state.storage.get(job.genKey)||0)!==job.generation){await state.storage.delete(key);completed++;continue;}await commit(state,env,job,put);await state.storage.delete(key);completed++;}catch{}}
  const remaining=(await state.storage.list({prefix:'bulk-retry:',limit:26})).size;
  if(remaining)await state.storage.setAlarm(Date.now()+300000);
  return {completed,remaining};
}
export async function publicPaper(env,request){
  const owner=await hash('public'),id=await hash('public-paper\n'+owner+'\n');
  const pointer=await env.ARTIFACTS.get(`bulk/public-paper/${owner}/${id}/latest.json`);
  if(!pointer)return Response.json({error:'Public paper snapshot is not published yet'},{status:503});
  const meta=await pointer.json(),headers={'Content-Type':'application/json','Cache-Control':'public, max-age=30, s-maxage=30',ETag:'"'+meta.hash+'"','Access-Control-Allow-Origin':'https://omiebot.ewinproject.org','X-Data-Plane':'r2'};
  if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
  const object=await env.ARTIFACTS.get(meta.key);if(!object)return Response.json({error:'Snapshot unavailable'},{status:503});
  return new Response(object.body,{headers});
}
