export type AuthUser = { sub: string; email: string; role: 'admin' | 'user' };
export type AuthEnv = Record<string, string | undefined>;
const encoder = new TextEncoder();
export const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export const unb64 = (text: string) => Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));
const encode = (value: unknown) => b64(encoder.encode(JSON.stringify(value)));
export async function signToken(env: AuthEnv, user: AuthUser, ttl = 900) {
  if (!env.AUTH_PRIVATE_JWK) throw new Error('Authentication is not configured');
  const jwk = JSON.parse(env.AUTH_PRIVATE_JWK); const now = Math.floor(Date.now()/1000);
  const body = `${encode({alg:'RS256',typ:'JWT',kid:jwk.kid || 'omiebot-1'})}.${encode({iss:env.AUTH_ISSUER || 'https://omiebot.ewinproject.org',aud:env.AUTH_APPLICATION_ID || 'omiebot',sub:user.sub,email:user.email,email_verified:true,emailVerified:true,role:user.role,iat:now,exp:now+ttl})}`;
  const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  return `${body}.${b64(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,encoder.encode(body))))}`;
}
export async function verifyToken(env: AuthEnv, token: string): Promise<AuthUser | null> {
  try {
    const [header,payload,signature,...extra] = token.split('.'); if(extra.length || !signature || !env.AUTH_PUBLIC_JWK)return null;
    const h=JSON.parse(new TextDecoder().decode(unb64(header))); const p=JSON.parse(new TextDecoder().decode(unb64(payload)));
    const now=Date.now()/1000;
    if(h.alg!=='RS256'||h.typ!=='JWT'||p.iss!==(env.AUTH_ISSUER||'https://omiebot.ewinproject.org')||p.aud!==(env.AUTH_APPLICATION_ID||'omiebot')||typeof p.exp!=='number'||!Number.isFinite(p.exp)||p.exp<=now||typeof p.iat!=='number'||!Number.isFinite(p.iat)||p.iat>now+30||p.exp<=p.iat||p.exp-p.iat>28800||p.nbf!==undefined&&(typeof p.nbf!=='number'||!Number.isFinite(p.nbf)||p.nbf>now)||p.email_verified!==true||typeof p.sub!=='string'||p.sub.length<1||p.sub.length>256||typeof p.email!=='string'||p.email.length>320||!p.email.includes('@')||!['user','admin'].includes(p.role))return null;
    const key=await crypto.subtle.importKey('jwk',JSON.parse(env.AUTH_PUBLIC_JWK),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,unb64(signature),encoder.encode(`${header}.${payload}`)))return null;
    return {sub:p.sub,email:p.email,role: p.email.toLowerCase()===env.SUPER_ADMIN_EMAIL?.toLowerCase()?'admin':'user'};
  } catch { return null; }
}
export async function verifyPassword(env: AuthEnv, password: string) {
  if(!env.SUPER_ADMIN_PASSWORD_HASH||!env.SUPER_ADMIN_PASSWORD_SALT)return false;
  const iterations=Number(env.SUPER_ADMIN_PASSWORD_ITERATIONS||'100000'); if(!Number.isInteger(iterations)||iterations<100000||iterations>100000)return false;
  const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const digest=b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unb64(env.SUPER_ADMIN_PASSWORD_SALT),iterations},material,256)));
  const expected=env.SUPER_ADMIN_PASSWORD_HASH; let difference=digest.length^expected.length;
  for(let i=0;i<Math.max(digest.length,expected.length);i++)difference|=(digest.charCodeAt(i)||0)^(expected.charCodeAt(i)||0);
  return difference===0;
}
export function authEnv(platform: any): AuthEnv { return platform?.env || {}; }
export function sameOrigin(request: Request, url: URL) {return request.headers.get('origin')===url.origin;}
export async function signFlow(env:AuthEnv, value:unknown){
  if(!env.ADMIN_SESSION_SECRET)throw new Error('OAuth session signing is not configured');
  const body=encode(value);const key=await crypto.subtle.importKey('raw',encoder.encode(env.ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return `${body}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(body))))}`;
}
export async function readFlow(env:AuthEnv, value:string){try{if(!env.ADMIN_SESSION_SECRET)return null;const [body,signature]=value.split('.');const key=await crypto.subtle.importKey('raw',encoder.encode(env.ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('HMAC',key,unb64(signature),encoder.encode(body)))return null;const flow=JSON.parse(new TextDecoder().decode(unb64(body)));return flow.expires>Date.now()?flow:null;}catch{return null;}}
