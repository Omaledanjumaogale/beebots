import { internalActionGeneric as action, internalMutationGeneric as mutation, makeFunctionReference } from 'convex/server';
import { v } from 'convex/values';
import { SYMBOLS, quoteSafe, signal, contiguousPrices } from './risk';
export const poll = action({args:{},handler:async ctx=>{
  for(const symbol of SYMBOLS){
    try {
      const response=await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(symbol)}`,{signal:AbortSignal.timeout(8000)});
      if(!response.ok)continue;const result=await response.json();const ticker=result.data?.[0];if(result.code!=='0'||!ticker)continue;
      const quote={symbol,bid:Number(ticker.bidPx),ask:Number(ticker.askPx),sourceAt:Number(ticker.ts)};
      if(quoteSafe(quote.bid,quote.ask,quote.sourceAt,Date.now()))await ctx.runMutation(makeFunctionReference<'mutation'>('market:tick'),quote);
    }catch{ /* No quote means no execution. Next cron retries. */ }
  }
}});
export const tick = mutation({args:{symbol:v.string(),bid:v.number(),ask:v.number(),sourceAt:v.number()},handler:async(ctx,args)=>{
  const now=Date.now();if(!SYMBOLS.includes(args.symbol)||!quoteSafe(args.bid,args.ask,args.sourceAt,now))return;
  const history=await ctx.db.query('quotes').withIndex('symbol',q=>q.eq('symbol',args.symbol)).order('desc').take(61);
  if(history[0]&&args.sourceAt<=history[0].sourceAt)return;
  await ctx.db.insert('quotes',{...args,receivedAt:now,source:'OKX public spot ticker'});
  for(const old of history.slice(59))await ctx.db.delete(old._id);
  const prices=contiguousPrices([...history.slice(0,59).reverse(),args]);
  // Admission caps active Bees globally. Read only this instrument so unrelated
  // symbols cannot consume the bound. Legacy/admin over-cap state fails closed.
  const allActive=await ctx.db.query('bees').withIndex('active',q=>q.eq('active',true)).take(101);
  if(allActive.length>100)throw new Error('Active Bee capacity exceeded; operator must pause excess Bees');
  const bees=await ctx.db.query('bees').withIndex('active_symbol',(q:any)=>q.eq('active',true).eq('symbol',args.symbol)).take(101);
  if(bees.length>100)throw new Error('Instrument Bee capacity exceeded');
  for(const bee of bees){
    if(bee.symbol!==args.symbol)continue;
    const p=await ctx.db.query('portfolios').withIndex('owner',q=>q.eq('owner',bee.owner)).unique();if(!p||p.killed)continue;
    const holdings=await ctx.db.query('bees').withIndex('owner',q=>q.eq('owner',bee.owner)).take(20);
    let equity=p.cash;let pricesComplete=true;
    for(const holding of holdings){if(holding.quantity<=0)continue;const mark=holding.symbol===args.symbol?args:await ctx.db.query('quotes').withIndex('symbol',q=>q.eq('symbol',holding.symbol)).order('desc').first();if(!mark||!quoteSafe(mark.bid,mark.ask,mark.sourceAt,now)){pricesComplete=false;break;}equity+=holding.quantity*mark.bid;}
    if(!pricesComplete)continue;
    if(equity<9000){await ctx.db.patch(p._id,{killed:true});for(const holding of holdings)await ctx.db.patch(holding._id,{active:false,lastDecision:'Portfolio stopped: 10% paper equity loss threshold'});continue;}
    const choice=signal(bee.strategy,prices);const key=`${bee._id}:${Math.floor(args.sourceAt/60000)}`;
    if(choice==='hold'){await ctx.db.patch(bee._id,{lastDecision:prices.length<30?'Abstain: collecting 30 quote observations':'Hold: baseline has no signal'});continue;}
    if(await ctx.db.query('fills').withIndex('key',q=>q.eq('key',key)).first())continue;
    // Long-only, fully cash-funded, one position per Bee; $250 cap and 0.1% taker fee.
    if(choice==='buy'&&bee.quantity>0||choice==='sell'&&bee.quantity<=0)continue;
    const price=choice==='buy'?args.ask:args.bid;
    const quantity=choice==='buy'?Math.floor(Math.min(250,p.cash/1.001)*1e8/price)/1e8:bee.quantity;
    if(quantity<=0||quantity*price<5)continue;
    const notional=quantity*price;const fee=notional*0.001;const cashDelta=choice==='buy'?-notional-fee:notional-fee;
    if(p.cash+cashDelta<0)continue;
    await ctx.db.insert('fills',{owner:bee.owner,beeId:bee._id,key,side:choice,quantity,price,fee,cashDelta,at:now,quoteAt:args.sourceAt,source:'OKX public spot ticker; simulated top-of-book fill'});
    await ctx.db.patch(p._id,{cash:p.cash+cashDelta});
    await ctx.db.patch(bee._id,{quantity:choice==='buy'?quantity:0,lastDecision:`${choice}: deterministic ${bee.strategy} baseline; paper fill`});
  }
}});
