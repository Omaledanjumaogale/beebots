import {readFile,writeFile,access} from 'node:fs/promises';
import {staticRoutes,dynamicRoutes} from '../static-routes.mjs';
const root=new URL('../.svelte-kit/cloudflare/',import.meta.url);
const routes=JSON.parse(await readFile(new URL('_routes.json',root),'utf8'));
if(JSON.stringify(routes.include)!==JSON.stringify(dynamicRoutes))throw Error('Only protected API and discovery paths may invoke Functions');
for(const route of staticRoutes){
 const file=route==='/'?'index.html':route.slice(1)+'.html';
 const html=await readFile(new URL(file,root),'utf8');
 if(!html.includes('<html')||!html.includes('OmieBot'))throw Error('Missing static shell: '+route);
 if(!routes.exclude.includes(route))throw Error('Shell is not excluded from Functions: '+route);
}
const recovery=await readFile(new URL('../static/offline.html',import.meta.url),'utf8');
await writeFile(new URL('404.html',root),recovery);
await access(new URL('service-worker.js',root));
for(const file of ['robots.txt','llms.txt','llms-full.txt','sitemap.xml','rss.xml','.well-known/ai-agent-manifest.json','images/omiebot-social.png'])await access(new URL(file,root));
for(const route of ['/','/paper','/hive','/research','/ecosystem']){
 const html=await readFile(new URL(route==='/'?'index.html':route.slice(1)+'.html',root),'utf8');
 if((html.match(/application\/ld\+json/g)??[]).length!==1||!html.includes('rel="canonical"'))throw Error('Missing or duplicate server-rendered graph/canonical: '+route);
}
if(!recovery.includes('Service temporarily limited'))throw Error('Recovery page unavailable');
const privateRoutes=new Set(['/admin','/invest','/invest/terms','/live','/login','/connect/okx','/terminal']);
const headers=staticRoutes.map(route=>`${route}\n  X-Omie-Shell: static-v2\n  X-Robots-Tag: ${privateRoutes.has(route)?'noindex, nofollow, noarchive':'index, follow'}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY`).join('\n\n');
// The adapter owns _routes.json; append only exact static-route headers.
const headerPath=new URL('_headers',root),existing=await readFile(headerPath,'utf8').catch(()=>'');
if(!existing.includes('X-Omie-Shell: static-v2'))await writeFile(headerPath,existing+'\n'+headers+'\n/service-worker.js\n  Cache-Control: no-cache\n');
console.log(`Static contract passed: ${staticRoutes.length} HTML shells, API-only Functions routing, recovery page and public-only service worker.`);
