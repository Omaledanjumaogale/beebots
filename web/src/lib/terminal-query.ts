const symbols=new Set(['BTC-USDT','ETH-USDT','SOL-USDT','BNB-USDT','XRP-USDT','DOGE-USDT','AVAX-USDT','LINK-USDT']);
const bars=new Set(['1m','5m','15m','1H','4H','1D']);
export function terminalQuery(search:string){const query=new URLSearchParams(search);return {symbol:symbols.has(query.get('symbol')??'')?query.get('symbol')!:'BTC-USDT',bar:bars.has(query.get('bar')??'')?query.get('bar')!:'15m'};}
export function safeReturnTo(search:string){const path=new URLSearchParams(search).get('returnTo')??'/';return /^\/(?!\/)/.test(path)&&!/[\\\r\n]/.test(path)?path:'/';}
