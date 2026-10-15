import {describe,it,expect} from 'vitest';
import {redemption,businessDate,splitRealizedProfit} from '../convex/investmentMath';
describe('investor accounting',()=>{
 it('deducts10% only from redeemable principal, never profit or a deposit',()=>{expect(redemption(110000,100000)).toEqual({grossCents:110000,principalReturnedCents:100000,feeCents:10000,netCents:100000});expect(redemption(50000,100000).netCents).toBe(45000);expect(redemption(0,100000).netCents).toBe(0);expect(()=>redemption(-1,100)).toThrow();});
 it('distributes all realized cents proportionally without inventing money',()=>{const result=splitRealizedProfit(101,[{id:'a',units:1},{id:'b',units:2}]);expect(result.reduce((s,r)=>s+r.cents,0)).toBe(101);expect(result).toEqual([{id:'a',cents:34},{id:'b',cents:67}]);expect(()=>splitRealizedProfit(10,[{id:'a',units:0}])).toThrow();});
 it('skips weekends for the indicative3–7 working-day window',()=>{expect(businessDate(Date.parse('2026-10-16T12:00:00Z'),3)).toBe('2026-10-21');expect(businessDate(Date.parse('2026-10-16T12:00:00Z'),7)).toBe('2026-10-27');});
});
