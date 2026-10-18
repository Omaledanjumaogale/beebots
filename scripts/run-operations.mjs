import { spawnSync } from 'node:child_process';
const {OMIE_JOB_ID:jobId,OMIE_OPERATION:kind,OMIE_CONVEX_SITE_URL:site,OMIE_WORKFLOW_CALLBACK_SECRET:secret}=process.env;
if(!jobId||!['training','verification','all'].includes(kind)||!site||!secret)throw new Error('Operation configuration is incomplete');
const endpoint=new URL('/operations/callback',site);
if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.convex.site'))throw new Error('Callback must use the configured Convex site');
async function callback(status,message){const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({jobId,status,message}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`Workflow callback returned ${response.status}`);}
let failed=false,message='All requested stages completed';
try{
  await callback('running','External runner started');
  for(const file of kind==='all'?['edge/train-batch.mjs','web/scripts/verify-deployment.mjs']:kind==='training'?['edge/train-batch.mjs']:['web/scripts/verify-deployment.mjs']){
    const result=spawnSync(process.execPath,[file],{stdio:'inherit',timeout:600000});
    if(result.error||result.status!==0)throw new Error(`${file.includes('train')?'Training':'Verification'} stage failed`);
  }
}catch(error){failed=true;message=error instanceof Error?error.message:'Operation failed';}
finally{try{await callback(failed?'failed':'succeeded',message);}catch{failed=true;console.error('Final workflow callback unavailable; administrator must reconcile the job.');}}
if(failed)process.exitCode=1;
