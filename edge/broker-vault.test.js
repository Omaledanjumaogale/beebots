import {describe,it,expect,vi,afterEach} from 'vitest';
import {seal,unseal,riskPolicy,brokerLink} from './broker-vault.js';
const vault={BROKER_VAULT_KEY:'a'.repeat(64)};
afterEach(()=>vi.unstubAllGlobals());
describe('private broker vault and bounded allocation',()=>{
 it('uses authenticated encryption bound to the verified profile',async()=>{
   const sealed=await seal(vault,'alice',{apiKey:'sensitive'});expect(JSON.stringify(sealed)).not.toContain('sensitive');expect((await unseal(vault,'alice',sealed)).apiKey).toBe('sensitive');await expect(unseal(vault,'bob',sealed)).rejects.toThrow();
   const altered={...sealed,ciphertext:sealed.ciphertext.replace(/^./,sealed.ciphertext[0]==='A'?'B':'A')};await expect(unseal(vault,'alice',altered)).rejects.toThrow();
 });
 it('requires a vault key rather than persisting plaintext',async()=>{await expect(seal({},'alice',{secret:'value'})).rejects.toThrow(/not configured/);});
 it('enforces minimum capital and conservative scalable limits',()=>{
   expect(()=>riskPolicy(99.99)).toThrow();expect(()=>riskPolicy(Infinity)).toThrow();expect(()=>riskPolicy(100.001)).toThrow();
   expect(riskPolicy(100)).toMatchObject({maxOrder:5,maxExposure:20,maxDailyLoss:2,maxDailyEntries:4,automaticExecution:false});expect(riskPolicy(1000).maxOrder).toBe(25);expect(riskPolicy(100.01).allocation).toBe(100.01);
 });
 it('never borrows another account or returns a paper balance when unlinked',async()=>{
   const spy=vi.fn();vi.stubGlobal('fetch',spy);const value=await brokerLink({ARTIFACTS:{get:async()=>null}},{operation:'status',user:'alice'},vi.fn());expect(value.balance).toBeNull();expect(value.status).toBe('account-link-required');expect(spy).not.toHaveBeenCalled();
 });
 it('checks the vault and user consent before transmitting credentials',async()=>{
   const spy=vi.fn();vi.stubGlobal('fetch',spy);await expect(brokerLink(vault,{operation:'link',user:'alice'},vi.fn())).rejects.toThrow(/acknowledgements/);expect(spy).not.toHaveBeenCalled();
 });
 it('verifies funded available USDT, rejects another owner, and only stores ciphertext',async()=>{
   const objects=new Map(),env={...vault,ARTIFACTS:{get:async key=>objects.has(key)?{json:async()=>JSON.parse(objects.get(key))}:null}},put=async(_env,k,v)=>objects.set(k,v);
   vi.stubGlobal('fetch',vi.fn(async url=>Response.json({code:'0',data:String(url).includes('account/config')?[{uid:'same-account',perm:'read_only,trade'}]:String(url).includes('account/balance')?[{totalEq:'200',details:[{ccy:'USDT',availBal:'200',cashBal:'200',disEq:'200'}]}]:[]})));
   const input={operation:'link',user:'alice',credentials:{apiKey:'my-api-key',secretKey:'my-secret-key',passphrase:'my-passphrase'},allocation:100,ownershipConfirmed:true,riskAccepted:true,adult:true};
   await expect(brokerLink(env,{...input,allocation:201},put)).rejects.toThrow(/exceeds/);
   const result=await brokerLink(env,input,put);expect(result.balance.cash).toBe(200);expect(result.executionEnabled).toBe(false);expect(result.policy.maxOrder).toBe(5);
   for(const value of objects.values()){expect(value).not.toContain('my-secret-key');expect(value).not.toContain('my-passphrase');}
   await expect(brokerLink(env,{...input,user:'bob'},put)).rejects.toThrow(/another/);
   const read=await brokerLink(env,{operation:'status',user:'alice'},put);expect(read.balance.cash).toBe(200);expect(JSON.stringify(read)).not.toContain('my-secret-key');
 });
});
