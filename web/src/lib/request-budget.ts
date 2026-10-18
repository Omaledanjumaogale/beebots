const pending=new Map<string,Promise<any>>(),cache=new Map<string,{until:number;value:any}>(),cooldown=new Map<string,number>();
const publicReads=new Set(['/api/workspaces?view=paper','/api/hive','/api/research']);
export async function budgetRead(path:string):Promise<any>{
 const now=Date.now(),previous=cache.get(path);
 if(previous&&previous.until>now)return previous.value;
 if((cooldown.get(path)??0)>now)throw Error('Service temporarily limited. Wait before refreshing; displayed evidence may be stale.');
 if(pending.has(path))return pending.get(path);
 const job=(async()=>{
  const response=await fetch(path,{credentials:'same-origin',signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data){if([404,429,500,502,503,504].includes(response.status))cooldown.set(path,Date.now()+60000);throw Error(data?.error??data?.message??'Service temporarily limited. Account actions require the online service.');}
  if(publicReads.has(path)){if(cache.size>=16)cache.delete(cache.keys().next().value!);cache.set(path,{until:Date.now()+60000,value:data});}
  return data;
 })();pending.set(path,job);
 try{return await job;}finally{pending.delete(path);}
}
export function visiblePoll(task:()=>Promise<boolean>,intervalMs:number){
 let stopped=false,timer:ReturnType<typeof setTimeout>,delay=intervalMs;
 async function tick(){
  if(stopped)return;
  if(!document.hidden&&navigator.onLine){try{delay=await task()?intervalMs:Math.min(delay*2,900000);}catch{delay=Math.min(delay*2,900000);}}
  if(!stopped)timer=setTimeout(tick,delay);
 }
 timer=setTimeout(tick,delay);return()=>{stopped=true;clearTimeout(timer);};
}
