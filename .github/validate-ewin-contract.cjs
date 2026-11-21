const fs=require('fs');
const p='ewin.platform.json';
if(!fs.existsSync(p)){console.error('Missing ewin.platform.json');process.exit(1)}
const j=JSON.parse(fs.readFileSync(p,'utf8'));
for(const k of ['platformId','name','hub','status','capabilities','billableActions'])if(!(k in j)){console.error('Missing '+k);process.exit(1)}
for(const k of ['site','convexSite','ssoStart','ssoRedeem','marketplaceFeed'])if(!j.hub[k]){console.error('Missing hub.'+k);process.exit(1)}
if(!Array.isArray(j.billableActions)){console.error('billableActions must be an array');process.exit(1)}
if(!/^[a-z0-9-]{2,48}$/.test(j.platformId)){console.error('Invalid platformId');process.exit(1)}
console.log('E-WIN contract valid for',j.platformId);
