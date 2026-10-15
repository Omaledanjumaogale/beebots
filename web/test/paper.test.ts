import {afterEach,describe,expect,it,vi} from 'vitest';
import {initialPaper,placePaperOrder,closePaperPosition,previewCandles} from '../src/lib/hive';
afterEach(()=>vi.unstubAllGlobals());
function quote(bid=100,ask=100.1,time=Date.now()){vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({bid,ask,time,source:'test public quote'})})));}
describe('paper cash and risk boundaries',()=>{
 it('accounts for spread and both fees across a round trip',async()=>{quote();let p=await placePaperOrder(initialPaper(),{symbol:'BTC-USDT',side:'buy',amount:100});expect(p.cash).toBeCloseTo(9899.9);expect(p.positions).toHaveLength(1);quote();p=await closePaperPosition(p,p.positions[0].id);expect(p.positions).toHaveLength(0);expect(p.cash).toBeLessThan(10000);expect(p.ledger.reduce((s,e)=>s+e.fee,0)).toBeGreaterThan(.19);});
 it('fails closed for stale or crossed quotes',async()=>{quote(100,99);await expect(placePaperOrder(initialPaper(),{symbol:'BTC-USDT',side:'buy',amount:100})).rejects.toThrow('Fresh');quote(100,100.1,Date.now()-60000);await expect(placePaperOrder(initialPaper(),{symbol:'BTC-USDT',side:'buy',amount:100})).rejects.toThrow('Fresh');});
 it('blocks short selling and new risk after kill switch',async()=>{quote();await expect(placePaperOrder(initialPaper(),{symbol:'BTC-USDT',side:'sell',amount:100})).rejects.toThrow('existing');await expect(placePaperOrder({...initialPaper(),paused:true},{symbol:'BTC-USDT',side:'buy',amount:100})).rejects.toThrow('paused');});
 it('allows reducing held exposure while paused',async()=>{quote();let p=await placePaperOrder(initialPaper(),{symbol:'BTC-USDT',side:'buy',amount:100});p.paused=true;quote();expect((await closePaperPosition(p,p.positions[0].id)).positions).toHaveLength(0);});
 it('marks preview candles as deterministic inputs with valid OHLC',()=>{const bars=previewCandles('BTC-USDT');expect(bars).toHaveLength(96);expect(bars).toEqual(previewCandles('BTC-USDT'));expect(bars.every(b=>b.high>=Math.max(b.open,b.close)&&b.low<=Math.min(b.open,b.close))).toBe(true);});
});
