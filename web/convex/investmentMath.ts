export function cents(value:number){if(!Number.isSafeInteger(value)||value<0||value>100_000_000)throw Error('Invalid monetary amount');return value;}
export function redemption(valueCents:number,principalCents:number){
 cents(valueCents);cents(principalCents);
 const principalReturned=Math.min(valueCents,principalCents);
 const feeCents=Math.floor(principalReturned*1000/10000);
 return {grossCents:valueCents,principalReturnedCents:principalReturned,feeCents,netCents:valueCents-feeCents};
}
export function businessDate(from:number,days:number){const d=new Date(from);let remaining=days;while(remaining){d.setUTCDate(d.getUTCDate()+1);if(d.getUTCDay()!==0&&d.getUTCDay()!==6)remaining--;}return d.toISOString().slice(0,10);}
export function splitRealizedProfit(profitCents:number,stakes:{id:string;units:number}[]){
 cents(profitCents);if(!stakes.length||stakes.some(s=>!Number.isSafeInteger(s.units)||s.units<=0)||new Set(stakes.map(s=>s.id)).size!==stakes.length)throw Error('Positive unique participations required');
 const total=stakes.reduce((s,a)=>s+a.units,0);if(!Number.isSafeInteger(total)||!Number.isSafeInteger(profitCents*total))throw Error('Allocation exceeds exact integer precision');
 const rows=stakes.map(s=>({...s,cents:Math.floor(profitCents*s.units/total),remainder:(profitCents*s.units)%total}));
 let left=profitCents-rows.reduce((s,a)=>s+a.cents,0);for(const row of [...rows].sort((a,b)=>b.remainder-a.remainder||a.id.localeCompare(b.id))){if(left--<=0)break;row.cents++;}return rows.map(({id,cents})=>({id,cents}));
}
