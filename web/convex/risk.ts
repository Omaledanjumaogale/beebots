export const NAMES = ['Scout','Archivist','Sentinel','Candle','Compass','Drift','Rebound','Breaker','Pulse','Carry','Volta','Surface','Macro','Newswire','Calibrator','Weaver','Auditor','Guardian','Pilot','Beekeeper'] as const;
export const SYMBOLS = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'];
export function contiguousPrices(quotes: {bid:number;ask:number;sourceAt:number}[]) {
  let start=0;
  for(let index=1;index<quotes.length;index++)if(quotes[index].sourceAt-quotes[index-1].sourceAt>90_000)start=index;
  return quotes.slice(start).map(quote=>(quote.bid+quote.ask)/2);
}
export function quoteSafe(bid: number, ask: number, sourceAt: number, now: number) {
  return Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask >= bid && sourceAt <= now + 1000 && now - sourceAt <= 15_000 && (ask - bid) / bid <= 0.003;
}
export function signal(strategy: string, prices: number[]): 'buy' | 'sell' | 'hold' {
  if (prices.length < 30 || prices.some(p => !Number.isFinite(p) || p <= 0)) return 'hold';
  const latest = prices.at(-1)!;
  const prior = prices.slice(-21, -1);
  const mean = prior.reduce((a,b) => a+b,0) / prior.length;
  if (strategy === 'reversion') return latest < mean * 0.99 ? 'buy' : latest > mean * 1.01 ? 'sell' : 'hold';
  if (strategy === 'breakout') return latest > Math.max(...prior) ? 'buy' : latest < Math.min(...prior) ? 'sell' : 'hold';
  if (strategy === 'trend') return latest > mean * 1.003 ? 'buy' : latest < mean * 0.997 ? 'sell' : 'hold';
  return 'hold';
}
export function nextState(current: string, target: string, evidence: { report: string; independentSamples: number; durationDays: number; passed: boolean }) {
  const sequence = ['registered','evaluated','shadow','paper','approved'];
  if (sequence.indexOf(target) !== sequence.indexOf(current) + 1 || !sequence.includes(current)) throw new Error('Invalid lifecycle transition');
  if (!evidence.passed || evidence.report.trim().length < 40 || !Number.isSafeInteger(evidence.independentSamples) || evidence.independentSamples < 100 || !Number.isFinite(evidence.durationDays) || evidence.durationDays < (target === 'approved' ? 30 : 1)) throw new Error('Insufficient evaluation evidence');
  return target;
}
