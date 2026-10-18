import {describe,it,expect,vi,afterEach} from 'vitest';
import {budgetRead,visiblePoll} from '../src/lib/request-budget';
import {terminalQuery,safeReturnTo} from '../src/lib/terminal-query';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('browser request budget',()=>{
 it('coalesces concurrent reads and reuses only public snapshots',async()=>{
  const fetcher=vi.fn(async()=>Response.json({ok:true}));vi.stubGlobal('fetch',fetcher);
  await Promise.all([budgetRead('/api/workspaces?view=paper'),budgetRead('/api/workspaces?view=paper')]);await budgetRead('/api/workspaces?view=paper');expect(fetcher).toHaveBeenCalledTimes(1);
  await budgetRead('/api/control?view=hive');await budgetRead('/api/control?view=hive');expect(fetcher).toHaveBeenCalledTimes(3);
 });
 it('backs off after unavailable services instead of hammering the backend',async()=>{
  const fetcher=vi.fn(async()=>new Response('limited',{status:429}));vi.stubGlobal('fetch',fetcher);
  await expect(budgetRead('/api/research')).rejects.toThrow('temporarily limited');await expect(budgetRead('/api/research')).rejects.toThrow('temporarily limited');expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('does not poll hidden or offline tabs and clears its timer',async()=>{
  vi.useFakeTimers();const page={hidden:true},network={onLine:true};vi.stubGlobal('document',page);vi.stubGlobal('navigator',network);const task=vi.fn(async()=>true),stop=visiblePoll(task,300000);
  await vi.advanceTimersByTimeAsync(300000);expect(task).not.toHaveBeenCalled();page.hidden=false;network.onLine=false;await vi.advanceTimersByTimeAsync(300000);expect(task).not.toHaveBeenCalled();network.onLine=true;await vi.advanceTimersByTimeAsync(300000);expect(task).toHaveBeenCalledTimes(1);stop();await vi.advanceTimersByTimeAsync(900000);expect(task).toHaveBeenCalledTimes(1);
 });
 it('initializes allowlisted query parameters after static delivery',()=>{
  expect(terminalQuery('?symbol=ETH-USDT&bar=1H')).toEqual({symbol:'ETH-USDT',bar:'1H'});expect(terminalQuery('?symbol=evil&bar=evil')).toEqual({symbol:'BTC-USDT',bar:'15m'});
  expect(safeReturnTo('?returnTo=%2Flive')).toBe('/live');expect(safeReturnTo('?returnTo=%2F%2Fevil.test')).toBe('/');expect(safeReturnTo('?returnTo=%2F%5Cevil.test')).toBe('/');
 });
});
