import {staticRoutes} from '../static-routes.mjs';
const base=process.env.OMIE_PRODUCTION_URL||'https://omiebot.ewinproject.org';
const checks=[];
for(const path of staticRoutes){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)}),html=await r.text();
 checks.push({path,status:r.status,static:r.headers.get('X-Omie-Shell')==='static-v2',pass:r.status===200&&r.headers.get('Content-Type')?.includes('text/html')&&html.includes('OmieBot')&&r.headers.get('X-Omie-Shell')==='static-v2'});
}
const missing=await fetch(base+'/missing-omiebot-recovery-check',{signal:AbortSignal.timeout(15000)}),body=await missing.text();
checks.push({path:'unknown public route',status:missing.status,pass:missing.status===404&&body.includes('Service temporarily limited')&&body.includes('Paper Workspace')});
for(const path of ['/api/control?view=admin-overview','/api/workspaces?view=live','/api/market?type=ticker&symbol=BTC-USDT','/api/runtime/admin/status']){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
 checks.push({path,status:r.status,protected:true,pass:r.status===401});
}
console.log(JSON.stringify({at:new Date().toISOString(),base,checks},null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
