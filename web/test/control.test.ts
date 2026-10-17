import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:null as any,mutation:vi.fn(),query:vi.fn()}));
vi.mock('$lib/server/read-budget',()=>({readHeaders:async()=>({Authorization:'Bearer test','X-Omie-Read-Key':'a'.repeat(64)})}));
vi.mock('$env/static/public',()=>({PUBLIC_CONVEX_URL:'https://example.convex.cloud'}));
vi.mock('$lib/server/auth',()=>({authEnv:()=>({EDGE_RUNTIME_URL:'https://edge.test',EDGE_SERVICE_SECRET:'test'}),verifyToken:async()=>mocks.user,signToken:async()=>'signed',sameOrigin:()=>true}));
vi.mock('convex/browser',()=>({ConvexHttpClient:class{setAuth(){} query=mocks.query;mutation=mocks.mutation;}}));
import {GET,POST} from '../src/routes/api/control/+server';
const event=(view='hive',fetcher:any=vi.fn())=>({request:new Request('https://app.test/api/control'),url:new URL('https://app.test/api/control?view='+view),cookies:{get:()=> 'session'},platform:{},fetch:fetcher}) as any;
beforeEach(()=>{mocks.user=null;vi.clearAllMocks();});
describe('authenticated snapshot gateway',()=>{
 it('rejects anonymous reads before touching storage',async()=>{const e=event();await expect(GET(e)).rejects.toMatchObject({status:401});expect(e.fetch).not.toHaveBeenCalled();});
 it('rejects a member from cached admin views',async()=>{mocks.user={sub:'alice',role:'user'};const e=event('admin-overview');await expect(GET(e)).rejects.toMatchObject({status:403});expect(e.fetch).not.toHaveBeenCalled();});
 it('binds cache identity to the verified owner and performs no Convex query on a hit',async()=>{
  mocks.user={sub:'alice',role:'user'};const fetcher=vi.fn(async(_url,init)=>{expect(JSON.parse(init.body).owner).toBe('alice');return Response.json({hit:true,hash:'abc',value:{cash:100}});});
  const r=await GET(event('hive',fetcher));expect(r.headers.get('X-Convex-Source-Calls')).toBe('0');expect(r.headers.get('Cache-Control')).toBe('private, no-store');expect(mocks.query).not.toHaveBeenCalled();
 });
 it('returns committed success even when cache invalidation fails',async()=>{
  mocks.user={sub:'alice',role:'user'};mocks.mutation.mockResolvedValue('receipt');const e=event('hive',vi.fn(async()=>{throw Error('offline');}));e.request=new Request('https://app.test/api/control',{method:'POST',body:JSON.stringify({name:'investments:allocate',args:{}})});
  const r=await POST(e);expect(await r.json()).toEqual({result:'receipt',committed:true,cacheInvalidated:false});expect(mocks.mutation).toHaveBeenCalledTimes(1);
 });
});
