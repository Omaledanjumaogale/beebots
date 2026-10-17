import type {AuthEnv,AuthUser} from './auth';
export async function readHeaders(env:AuthEnv,user:AuthUser){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.sub));
 return {Authorization:`Bearer ${env.EDGE_SERVICE_SECRET}`,'X-Omie-Read-Key':[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')};
}
