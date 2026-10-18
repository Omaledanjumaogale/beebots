import type {Handle} from '@sveltejs/kit';
export const handle:Handle=async({event,resolve})=>{
 const response=await resolve(event);
 const privatePath=/^\/(api|admin|auth|login|live|invest|terminal|connect)(?:\/|$)/.test(event.url.pathname);
 if(privatePath){response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');response.headers.set('Cache-Control','private, no-store');}
 else if(event.url.pathname.startsWith('/.well-known/'))response.headers.set('Cache-Control','public, max-age=300');
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 response.headers.set('X-Frame-Options','DENY');
 if(event.url.protocol==='https:')response.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
 return response;
};
